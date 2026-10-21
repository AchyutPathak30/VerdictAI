/**
 * VerdictAI TypeScript Domain Types
 * Aligned with backend/app/models/schemas.py (Nirav Kachhiya)
 * and backend/app/models/api_schemas.py (Darshan Prajapati)
 */

// ─── Enums (mirrors backend DisputeStatus, DisputeReason) ─────────────────

export type DisputeStatus =
  | 'SUBMITTED'
  | 'EVIDENCE_PENDING'
  | 'EVIDENCE_INGESTED'
  | 'IN_ANALYSIS'
  | 'SCORING_EVALUATED'
  | 'AUTO_RESOLVED'
  | 'MANUAL_REVIEW_QUEUE'
  | 'ADMIN_OVERRIDDEN'
  | 'RESOLUTION_NOTIFIED'
  | 'CLOSED'
  | 'REJECTED';

export type DisputeReason =
  | 'FRAUD_UNRECOGNIZED_CHARGE'
  | 'PRODUCT_NOT_RECEIVED'
  | 'PRODUCT_DAMAGED_OR_DEFECTIVE'
  | 'SUBSCRIPTION_CANCELLED_CHARGED'
  | 'DUPLICATE_PROCESSING'
  | 'INCORRECT_AMOUNT_CHARGED';

export type ResolutionOutcome =
  | 'FAVOR_CARDHOLDER'
  | 'FAVOR_MERCHANT'
  | 'SPLIT_LIABILITY'
  | 'MERCHANT_ACCEPTED';

// ─── Transaction (mirrors transactions.py TransactionDTO) ─────────────────

export interface Transaction {
  id: string;
  user_id: string;
  merchant_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  cardholder_name: string;
  payment_method: string;
  transaction_timestamp: string;
  is_disputed: boolean;
}

// ─── Case File Models (mirrors schemas.py UnifiedCaseFile) ────────────────

export interface CaseFileHeader {
  case_file_id: string;
  dispute_id: string;
  case_reference_number: string;
  current_status: DisputeStatus;
  dispute_reason: DisputeReason;
  disputed_amount: number;
  currency: string;
  created_at: string;
  sla_deadline: string;
  is_sealed: boolean;
  sealed_at: string | null;
}

export interface TransactionSummary {
  transaction_id: string;
  amount: number;
  currency: string;
  merchant_id: string;
  merchant_name: string;
  cardholder_id: string;
  cardholder_name: string;
  payment_method: string;
  transaction_timestamp: string;
}

export interface EvidenceItem {
  evidence_id: string;
  dispute_id: string;
  evidence_type: string;
  source: string;
  file_name: string | null;
  raw_payload: Record<string, unknown>;
  sha256_checksum: string;
  submitted_at: string;
}

export interface UnifiedCaseFile {
  header: CaseFileHeader;
  transaction: TransactionSummary;
  cardholder_statement: string | null;
  merchant_response_statement: string | null;
  evidence_items: EvidenceItem[];
  case_hash_sha256: string;
  audit_chain_length: number;
  resolution: Record<string, unknown> | null;
}

// ─── API Request Payloads (mirrors api_schemas.py) ────────────────────────

export interface DisputeCreateRequest {
  transaction_id: string;
  cardholder_id: string;
  dispute_reason: DisputeReason;
  disputed_amount: number;
  cardholder_statement?: string;
  merchant_sla_hours?: number;
}

export interface DisputeListResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: UnifiedCaseFile[];
}

export interface CaseReasoningResponse {
  summary: string;
  cardholder_rationale: string;
  merchant_rationale: string;
  contributing_factors: string[];
  generator_source: string;
  guardrails_applied: boolean;
  guardrail_violations?: string[];
  confidence_score_pct: number;
  recommended_resolution: string;
  case_id: string;
  generated_at?: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Verification: { email: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  FileDisputeTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  MyDisputes: undefined;
  DisputeDetail: { disputeId: string };
};

export type FileDisputeStackParamList = {
  DisputeWizard: undefined;
  DisputeSuccess: { caseId: string; referenceNumber: string };
};
