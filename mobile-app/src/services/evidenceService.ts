/**
 * Evidence Service
 * Connects to: backend/app/api/v1/evidence.py (Darshan Prajapati)
 * Endpoints: POST /evidence/upload, GET /evidence/:dispute_id/items
 * File size limit: 10MB for cardholders (SRS FR-08, AC-04)
 * Implements resilient live API query with automatic offline demo fallback.
 */

import apiClient, { setBackendReachable } from './apiClient';
import { EvidenceItem } from '../types';
import { addRuntimeEvidence, getRuntimeDisputeById } from '../data/mockDisputes';

const CARDHOLDER_MAX_MB = 10;
const CARDHOLDER_MAX_BYTES = CARDHOLDER_MAX_MB * 1024 * 1024;

export interface EvidenceUploadParams {
  disputeId: string;
  evidenceType: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/** Upload a file as evidence for a dispute */
export const uploadEvidence = async (
  params: EvidenceUploadParams
): Promise<EvidenceItem> => {
  // Enforce 10MB client-side limit before sending (SRS FR-08, AC-04)
  if (params.fileSize > CARDHOLDER_MAX_BYTES) {
    throw new Error(
      `File exceeds the maximum allowed size of ${CARDHOLDER_MAX_MB}MB for cardholders.`
    );
  }

  try {
    const formData = new FormData();
    formData.append('dispute_id', params.disputeId);
    formData.append('evidence_type', params.evidenceType);
    formData.append('source', 'CARDHOLDER');
    formData.append('actor', 'CARDHOLDER_MOBILE_APP');
    formData.append('file', {
      uri: params.fileUri,
      name: params.fileName,
      type: params.mimeType,
    } as unknown as Blob);

    const response = await apiClient.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setBackendReachable(true);
    return response.data;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Evidence upload API offline (${err?.message || 'timeout'}). Attaching to local case.`
    );
    setBackendReachable(false);

    const simulatedItem: EvidenceItem = {
      evidence_id: `evi_${Date.now()}_cardholder`,
      dispute_id: params.disputeId,
      evidence_type: params.evidenceType,
      source: 'CARDHOLDER',
      file_name: params.fileName,
      raw_payload: {
        file_name: params.fileName,
        file_size: params.fileSize,
        mime_type: params.mimeType,
      },
      sha256_checksum: `sha256_doc_${Math.random().toString(16).substring(2, 10)}_evidence`,
      submitted_at: new Date().toISOString(),
    };

    addRuntimeEvidence(params.disputeId, simulatedItem);
    return simulatedItem;
  }
};

/** List all evidence items attached to a dispute */
export const getEvidenceItems = async (
  disputeId: string
): Promise<EvidenceItem[]> => {
  try {
    const response = await apiClient.get(`/evidence/${disputeId}/items`);
    setBackendReachable(true);
    return response.data;
  } catch {
    setBackendReachable(false);
    const c = getRuntimeDisputeById(disputeId);
    return c ? c.evidence_items : [];
  }
};
