/**
 * Disputes Service
 * Connects to: backend/app/api/v1/disputes.py (Darshan Prajapati)
 * Endpoints: GET /disputes, GET /disputes/:id, POST /disputes, GET /disputes/:id/audit-trail
 * Implements resilient live API query with automatic offline demo fallback.
 */

import apiClient, { setBackendReachable } from './apiClient';
import { DisputeCreateRequest, DisputeListResponse, UnifiedCaseFile } from '../types';
import {
  getRuntimeDisputes,
  getRuntimeDisputeById,
  addRuntimeDispute,
  FALLBACK_TRANSACTIONS,
} from '../data/mockDisputes';

/** List disputes — optionally filter by cardholder_id */
export const getDisputes = async (
  cardholder_id?: string
): Promise<DisputeListResponse> => {
  try {
    const params: Record<string, string | number> = { page: 1, page_size: 20 };
    if (cardholder_id) params.cardholder_id = cardholder_id;
    const response = await apiClient.get('/disputes', { params });
    setBackendReachable(true);
    return response.data;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Disputes API offline (${err?.message || 'timeout'}). Using fallback store.`
    );
    setBackendReachable(false);
    const all = getRuntimeDisputes();
    const filtered = cardholder_id
      ? all.filter((d) => d.transaction.cardholder_id === cardholder_id)
      : all;
    return {
      total_count: filtered.length,
      page: 1,
      page_size: 20,
      total_pages: 1,
      items: filtered,
    };
  }
};

/** Get a single dispute's unified case file */
export const getDisputeById = async (disputeId: string): Promise<UnifiedCaseFile> => {
  try {
    const response = await apiClient.get(`/disputes/${disputeId}`);
    setBackendReachable(true);
    return response.data;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Dispute ${disputeId} detail API offline. Checking fallback store.`
    );
    setBackendReachable(false);
    const cached = getRuntimeDisputeById(disputeId);
    if (cached) return cached;
    throw new Error(`Dispute case '${disputeId}' not found.`);
  }
};

/** File a new dispute — POST /disputes with resilient offline persistence */
export const createDispute = async (
  payload: DisputeCreateRequest
): Promise<UnifiedCaseFile> => {
  try {
    const response = await apiClient.post('/disputes', payload);
    setBackendReachable(true);
    // Also save in local runtime store so offline views can immediately access it
    addRuntimeDispute(response.data);
    return response.data;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Backend offline during dispute submission (${err?.message || 'timeout'}). Generating sealed local case.`
    );
    setBackendReachable(false);

    // Find transaction info
    const matchedTxn = FALLBACK_TRANSACTIONS.find((t) => t.id === payload.transaction_id) || {
      id: payload.transaction_id,
      user_id: payload.cardholder_id,
      merchant_id: 'm_merchant_unknown',
      merchant_name: 'Merchant Partner',
      amount: payload.disputed_amount,
      currency: 'USD',
      cardholder_name: 'Alice Smith',
      payment_method: 'VISA_CREDIT_8841',
      transaction_timestamp: new Date().toISOString(),
      is_disputed: true,
    };

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const disputeId = `DSP-${randomSuffix}`;
    const caseRef = `CAS-${randomSuffix}-MB`;
    const nowIso = new Date().toISOString();
    const slaHours = payload.merchant_sla_hours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const newCaseFile: UnifiedCaseFile = {
      case_hash_sha256: `sha256_${Date.now()}_${randomSuffix}_simulated_hash_verdictai`,
      audit_chain_length: 1,
      header: {
        case_file_id: `cf_${randomSuffix}`,
        dispute_id: disputeId,
        case_reference_number: caseRef,
        dispute_reason: payload.dispute_reason,
        current_status: 'SUBMITTED',
        disputed_amount: payload.disputed_amount,
        currency: 'USD',
        sla_deadline: slaDeadline,
        created_at: nowIso,
        is_sealed: false,
        sealed_at: null,
      },
      transaction: {
        transaction_id: matchedTxn.id,
        cardholder_id: matchedTxn.user_id,
        merchant_id: matchedTxn.merchant_id,
        merchant_name: matchedTxn.merchant_name,
        amount: matchedTxn.amount,
        currency: matchedTxn.currency,
        cardholder_name: matchedTxn.cardholder_name,
        payment_method: matchedTxn.payment_method,
        transaction_timestamp: matchedTxn.transaction_timestamp,
      },
      evidence_items: [],
      cardholder_statement: payload.cardholder_statement || null,
      merchant_response_statement: null,
      resolution: null,
    };

    addRuntimeDispute(newCaseFile);
    return newCaseFile;
  }
};

/** Get cryptographic audit trail for a dispute */
export const getAuditTrail = async (disputeId: string) => {
  try {
    const response = await apiClient.get(`/disputes/${disputeId}/audit-trail`);
    setBackendReachable(true);
    return response.data;
  } catch {
    setBackendReachable(false);
    return [
      {
        event_id: `evt_01_${disputeId}`,
        event_type: 'CASE_CREATED',
        actor: 'CARDHOLDER_MOBILE_APP',
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      },
      {
        event_id: `evt_02_${disputeId}`,
        event_type: 'EVIDENCE_INGESTED',
        actor: 'SYSTEM:evidence_dispatcher',
        timestamp: new Date().toISOString(),
        previous_hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        current_hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
      },
    ];
  }
};
