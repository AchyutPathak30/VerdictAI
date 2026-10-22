/**
 * VerdictAI Mobile App Offline Seed & Fallback Data
 * Strictly typed against src/types/index.ts (CaseFileHeader, TransactionSummary, EvidenceItem, UnifiedCaseFile)
 * Author: Mayank Jayswal (Mobile Lead)
 */

import { Transaction, UnifiedCaseFile, EvidenceItem } from '../types';

export const FALLBACK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_croma_18999',
    user_id: 'usr_pooja_01',
    merchant_id: 'm_croma_004',
    merchant_name: 'Croma Electronics India',
    amount: 18999.00,
    currency: 'INR',
    cardholder_name: 'Pooja Iyer',
    payment_method: 'HDFC RuPay **** 4492',
    transaction_timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    is_disputed: false,
  },
  {
    id: 'txn_swiggy_1499',
    user_id: 'usr_pooja_01',
    merchant_id: 'm_swiggy_002',
    merchant_name: 'Swiggy Instamart',
    amount: 1499.00,
    currency: 'INR',
    cardholder_name: 'Pooja Iyer',
    payment_method: 'HDFC RuPay **** 4492',
    transaction_timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    is_disputed: false,
  },
  {
    id: 'txn_reliance_28500',
    user_id: 'usr_pooja_01',
    merchant_id: 'm_reliance_003',
    merchant_name: 'Reliance Digital Retail Ltd',
    amount: 28500.00,
    currency: 'INR',
    cardholder_name: 'Pooja Iyer',
    payment_method: 'HDFC RuPay **** 4492',
    transaction_timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    is_disputed: false,
  },
  {
    id: 'txn_tatacliq_24999',
    user_id: 'usr_pooja_01',
    merchant_id: 'm_tatacliq_001',
    merchant_name: 'Tata CLiQ Luxury',
    amount: 24999.00,
    currency: 'INR',
    cardholder_name: 'Pooja Iyer',
    payment_method: 'HDFC RuPay **** 4492',
    transaction_timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    is_disputed: false,
  },
  {
    id: 'txn_flipkart_4599',
    user_id: 'usr_pooja_01',
    merchant_id: 'm_flipkart_005',
    merchant_name: 'Flipkart India Pvt Ltd',
    amount: 4599.00,
    currency: 'INR',
    cardholder_name: 'Pooja Iyer',
    payment_method: 'HDFC RuPay **** 4492',
    transaction_timestamp: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
    is_disputed: false,
  },
];

export const FALLBACK_DISPUTES: UnifiedCaseFile[] = [
  {
    case_hash_sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    audit_chain_length: 4,
    header: {
      case_file_id: 'cf_882941',
      dispute_id: 'DSP-882941',
      case_reference_number: 'CAS-882941-AZ',
      dispute_reason: 'PRODUCT_NOT_RECEIVED',
      current_status: 'IN_ANALYSIS',
      disputed_amount: 18999.00,
      currency: 'INR',
      sla_deadline: new Date(Date.now() + 27 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
      is_sealed: false,
      sealed_at: null,
    },
    transaction: {
      transaction_id: 'txn_croma_18999',
      cardholder_id: 'usr_pooja_01',
      merchant_id: 'm_croma_004',
      merchant_name: 'Croma Electronics India',
      amount: 18999.00,
      currency: 'INR',
      cardholder_name: 'Pooja Iyer',
      payment_method: 'HDFC RuPay **** 4492',
      transaction_timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    evidence_items: [
      {
        evidence_id: 'evi_receipt_001',
        dispute_id: 'DSP-882941',
        evidence_type: 'RECEIPT',
        source: 'CARDHOLDER',
        file_name: 'croma_tax_invoice.pdf',
        raw_payload: {
          merchant: 'Croma Electronics India',
          total: 18999.00,
          tracking_number: 'BLUEDART-88192034',
        },
        sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        submitted_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
    ],
    cardholder_statement: 'Item not received after 14 days. Blue Dart courier tracking shows parcel damaged in transit at Bengaluru Hub.',
    merchant_response_statement: null,
    resolution: null,
  },
  {
    case_hash_sha256: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
    audit_chain_length: 2,
    header: {
      case_file_id: 'cf_771023',
      dispute_id: 'DSP-771023',
      case_reference_number: 'CAS-771023-SB',
      dispute_reason: 'DUPLICATE_PROCESSING',
      current_status: 'EVIDENCE_PENDING',
      disputed_amount: 1499.00,
      currency: 'INR',
      sla_deadline: new Date(Date.now() + 15 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 33 * 3600 * 1000).toISOString(),
      is_sealed: false,
      sealed_at: null,
    },
    transaction: {
      transaction_id: 'txn_swiggy_1499',
      cardholder_id: 'usr_pooja_01',
      merchant_id: 'm_swiggy_002',
      merchant_name: 'Swiggy Instamart',
      amount: 1499.00,
      currency: 'INR',
      cardholder_name: 'Pooja Iyer',
      payment_method: 'HDFC RuPay **** 4492',
      transaction_timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    evidence_items: [],
    cardholder_statement: 'Duplicate charge on statement within 3 minutes for identical grocery order.',
    merchant_response_statement: null,
    resolution: null,
  },
  {
    case_hash_sha256: 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012',
    audit_chain_length: 6,
    header: {
      case_file_id: 'cf_660192',
      dispute_id: 'DSP-660192',
      case_reference_number: 'CAS-660192-UB',
      dispute_reason: 'INCORRECT_AMOUNT_CHARGED',
      current_status: 'AUTO_RESOLVED',
      disputed_amount: 2850.00,
      currency: 'INR',
      sla_deadline: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      is_sealed: true,
      sealed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    transaction: {
      transaction_id: 'txn_reliance_28500',
      cardholder_id: 'usr_pooja_01',
      merchant_id: 'm_reliance_003',
      merchant_name: 'Reliance Digital Retail Ltd',
      amount: 2850.00,
      currency: 'INR',
      cardholder_name: 'Pooja Iyer',
      payment_method: 'HDFC RuPay **** 4492',
      transaction_timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    },
    evidence_items: [
      {
        evidence_id: 'evi_reliance_01',
        dispute_id: 'DSP-660192',
        evidence_type: 'RECEIPT',
        source: 'CARDHOLDER',
        file_name: 'reliance_invoice_receipt.pdf',
        raw_payload: { billed_charge: 2850.00 },
        sha256_checksum: 'd3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b811',
        submitted_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    resolution: {
      outcome: 'AUTO_REFUND_CARDHOLDER',
      refund_amount: 2850.00,
      reasoning: 'POS terminal dual-swipe discrepancy verified against merchant ledger. Full refund issued.',
      resolved_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    cardholder_statement: 'Incorrect surcharge calculation. POS terminal debited extra amount without itemized receipt.',
    merchant_response_statement: 'Discrepancy acknowledged during batch settlement.',
  },
  {
    case_hash_sha256: 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123',
    audit_chain_length: 7,
    header: {
      case_file_id: 'cf_554128',
      dispute_id: 'DSP-554128',
      case_reference_number: 'CAS-554128-AP',
      dispute_reason: 'FRAUD_UNRECOGNIZED_CHARGE',
      current_status: 'AUTO_RESOLVED',
      disputed_amount: 24999.00,
      currency: 'INR',
      sla_deadline: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      is_sealed: true,
      sealed_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
    transaction: {
      transaction_id: 'txn_tatacliq_24999',
      cardholder_id: 'usr_pooja_01',
      merchant_id: 'm_tatacliq_001',
      merchant_name: 'Tata CLiQ Luxury',
      amount: 24999.00,
      currency: 'INR',
      cardholder_name: 'Pooja Iyer',
      payment_method: 'HDFC RuPay **** 4492',
      transaction_timestamp: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    },
    evidence_items: [],
    resolution: {
      outcome: 'MERCHANT_CHARGEBACK_ACCEPTED',
      refund_amount: 24999.00,
      reasoning: 'Card not present transaction flagged from unauthorized international IP. Full refund granted.',
      resolved_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
    cardholder_statement: 'Unrecognized online transaction made while I was traveling domestic.',
    merchant_response_statement: null,
  },
];

// In-memory runtime store for new disputes filed during this session
let runtimeDisputesStore: UnifiedCaseFile[] = [...FALLBACK_DISPUTES];

export const getRuntimeDisputes = (): UnifiedCaseFile[] => {
  return runtimeDisputesStore;
};

export const getRuntimeDisputeById = (id: string): UnifiedCaseFile | undefined => {
  return runtimeDisputesStore.find(
    (d) => d.header.dispute_id === id || d.header.case_reference_number === id
  );
};

export const addRuntimeDispute = (newCase: UnifiedCaseFile): void => {
  runtimeDisputesStore = [newCase, ...runtimeDisputesStore];
};

export const addRuntimeEvidence = (disputeId: string, item: EvidenceItem): void => {
  const caseIdx = runtimeDisputesStore.findIndex(
    (d) => d.header.dispute_id === disputeId || d.header.case_reference_number === disputeId
  );
  if (caseIdx !== -1) {
    runtimeDisputesStore[caseIdx].evidence_items.push(item);
    runtimeDisputesStore[caseIdx].audit_chain_length += 1;
  }
};

export const FALLBACK_REASONING: Record<string, import('../types').CaseReasoningResponse> = {
  'DSP-660192': {
    case_id: 'DSP-660192',
    recommended_resolution: 'AUTO_RESOLVED_CARDHOLDER_WIN',
    confidence_score_pct: 88.5,
    summary: 'Dispute resolved in favor of Card Member due to verified billing ledger discrepancy.',
    cardholder_rationale:
      'Your claim of an incorrect amount was verified against terminal telemetry logs. A full refund of ₹2,850.00 has been credited to your HDFC account.',
    merchant_rationale:
      'Merchant batch settlement logs confirmed double charge. Cardholder claim validated.',
    contributing_factors: [
      'Telemetry logs confirmed an unauthorized surcharge during card swipe.',
      'Receipt fare calculation exceeded authorized amount.',
      'Cardholder account demonstrates 100% dispute good-standing history.',
    ],
    generator_source: 'GEMINI_2.0_FLASH_XAI',
    guardrails_applied: true,
  },
  'DSP-554128': {
    case_id: 'DSP-554128',
    recommended_resolution: 'CARD_MEMBER_FAVOUR',
    confidence_score_pct: 94.0,
    summary: 'Dispute auto-resolved in cardholder favor due to unauthorized card-not-present activity.',
    cardholder_rationale:
      'VerdictAI fraud models cross-referenced your device IP with the transaction source. The charge originated from an unrecognized overseas proxy while your card remained physically in Bengaluru. Your full charge of ₹24,999.00 has been refunded.',
    merchant_rationale:
      'Order dispatch lacking 3D-Secure 2FA OTP verification from cardholder device.',
    contributing_factors: [
      'Geo-location mismatch: Transaction originated from foreign IP address without RuPay OTP authorization.',
      'Cardholder has no prior transaction history with the specific overseas gateway.',
      'Merchant failed to supply signed proof of delivery to cardholder billing address within 48-hour SLA.',
    ],
    generator_source: 'GEMINI_2.0_FLASH_XAI',
    guardrails_applied: true,
  },
};

export const getRuntimeReasoning = (
  disputeId: string
): import('../types').CaseReasoningResponse | undefined => {
  return FALLBACK_REASONING[disputeId];
};
