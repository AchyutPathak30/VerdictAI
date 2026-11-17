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
    const params: Record<string, string | number> = { page: 1, page_size: 50 };
    if (cardholder_id) params.cardholder_id = cardholder_id;
    const response = await apiClient.get('/disputes', { params });
    setBackendReachable(true);

    // Authoritative live database response — no artificial data injection
    return response.data;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Disputes API offline (${err?.message || 'timeout'}). Using offline cache.`
    );
    setBackendReachable(false);
    const all = getRuntimeDisputes();
    const filtered = (cardholder_id && cardholder_id !== 'usr_pooja_01' && cardholder_id !== 'usr_pooja_iyer')
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
      `[VerdictAI] Dispute ${disputeId} detail API offline or not found (${err?.message || ''}). Checking fallback and local store.`
    );
    setBackendReachable(false);

    // 1. Check in-memory runtime store
    const cached = getRuntimeDisputeById(disputeId);
    if (cached) return cached;

    // 2. Check localStorage cross-storage sync (web Expo mode)
    const win = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (win && win.localStorage) {
      try {
        const raw = win.localStorage.getItem('verdictai_master_disputes_v3');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const clean = (disputeId || '').trim().toLowerCase();
            const found = parsed.find((p: any) => {
              const pId = String(p.id || '').toLowerCase();
              const cfId = String(p.caseFileId || '').toLowerCase();
              return (
                pId === clean ||
                cfId === clean ||
                pId.includes(clean) ||
                clean.includes(pId) ||
                (clean.length >= 8 && pId.startsWith(clean.slice(0, 8))) ||
                (clean.includes('3d822243') && (pId.includes('3d822243') || String(p.merchant || '').toLowerCase().includes('tata')))
              );
            });

            if (found) {
              const isRefuted = String(found.status || '').toLowerCase().includes('refut') || String(found.status || '').toLowerCase().includes('reject');
              const isApproved = String(found.status || '').toLowerCase().includes('approv') || String(found.status || '').toLowerCase().includes('settled') || String(found.status || '').toLowerCase().includes('refund');

              return {
                case_hash_sha256: found.sha256Hash || 'sha256_client_verified_hash',
                audit_chain_length: 3,
                header: {
                  case_file_id: found.caseFileId || `cf_${found.id}`,
                  dispute_id: found.id || disputeId,
                  case_reference_number: `CAS-${String(found.id || disputeId).slice(0, 8).toUpperCase()}`,
                  dispute_reason: (found.reason || 'NON_DELIVERY_OF_GOODS').replace(/ /g, '_').toUpperCase() as any,
                  current_status: isRefuted ? 'REJECTED' : isApproved ? 'AUTO_RESOLVED' : 'IN_ANALYSIS',
                  disputed_amount: found.amount || 24999,
                  currency: 'INR',
                  sla_deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  is_sealed: false,
                  sealed_at: null,
                },
                transaction: {
                  transaction_id: `txn_${found.id || disputeId}`,
                  cardholder_id: found.cardholderId || 'usr_pooja_01',
                  merchant_id: 'm_merchant_001',
                  merchant_name: found.merchant || 'Tata CLiQ Luxury',
                  amount: found.amount || 24999,
                  currency: 'INR',
                  cardholder_name: found.cardholderName || 'Pooja Iyer',
                  payment_method: 'HDFC RuPay **** 4492',
                  transaction_timestamp: new Date().toISOString(),
                },
                evidence_items: [],
                cardholder_statement: found.cardholderStatement || 'Transaction contested by cardholder.',
                merchant_response_statement: isRefuted ? 'Dispute refuted by Dispute-Ops Lead. Merchant counter-evidence upheld.' : null,
                resolution: isRefuted || isApproved ? {
                  outcome: isRefuted ? 'FAVOR_MERCHANT' : 'FAVOR_CARDHOLDER',
                  reasoning: found.aiVerdict || (isRefuted ? 'Dispute refuted by Dispute-Ops Lead. Merchant counter-evidence upheld.' : 'Claim approved in cardholder favor.'),
                  is_override: true,
                  timestamp: new Date().toISOString()
                } : null,
              };
            }
          }
        }
      } catch {
        // ignore parse error
      }
    }

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
      currency: 'INR',
      cardholder_name: 'Pooja Iyer',
      payment_method: 'HDFC RuPay **** 4492',
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
        currency: 'INR',
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
