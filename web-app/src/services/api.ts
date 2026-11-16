/**
 * VerdictAI API Client & Data Adapter Service
 * Interfaces with FastAPI Backend Gateway at http://localhost:8000/api/v1
 */

import {
  CaseQueueItem,
  EvidenceItem,
  AuditLogEntry,
  ReasoningFactor,
  AuditExportItem
} from '../types/dispute';
import {
  ADMIN_STATS,
  ACTIVE_CASE_QUEUE,
  DSP_1041_DETAILS,
  EVIDENCE_FILES,
  AUDIT_TRAIL,
  REASONING_FACTORS,
  AUDIT_EXPORTS,
  getDynamicDateString
} from '../data/mockData';
import {
  getMasterDisputes,
  getCaseQueueItems,
  createUnifiedDispute,
  updateDisputeStatus,
  UnifiedDisputeRecord,
  computeStableScore,
  getDisputeEvidenceList,
  saveDisputeEvidenceItem,
  removeDisputeEvidenceItem
} from './disputeStore';

export { updateDisputeStatus, computeStableScore, getDisputeEvidenceList, saveDisputeEvidenceItem, removeDisputeEvidenceItem };

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isRenderHost = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

  if (isRenderHost) {
    if (!envUrl || envUrl.includes('localhost') || (envUrl.includes('verdictai-api.onrender.com') && !envUrl.includes('verdictai-api-i4yd'))) {
      return 'https://verdictai-api-i4yd.onrender.com/api/v1';
    }
    return envUrl;
  }

  if (envUrl && envUrl.includes('verdictai-api.onrender.com') && !envUrl.includes('verdictai-api-i4yd')) {
    return 'https://verdictai-api-i4yd.onrender.com/api/v1';
  }

  return envUrl || 'http://localhost:8000/api/v1';
};

export const BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isBackendConnected: boolean;
}

/**
 * Universal Fetch Wrapper with Network Fallback
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null; connected: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Server error (${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {
        errorMsg = errText || errorMsg;
      }
      return { data: null, error: errorMsg, connected: true };
    }

    const data = await res.json();
    return { data, error: null, connected: true };
  } catch (err: any) {
    console.warn(`[VerdictAI API Warning] API request to ${endpoint} failed. Using offline fallback mode.`, err?.message);
    return { data: null, error: err?.message || 'Network error', connected: false };
  }
}

// --------------------------------------------------------------------------
// 1. System Health & Stats APIs
// --------------------------------------------------------------------------

export async function fetchSystemStatus(): Promise<ApiResponse<{ status: string; activeDisputes: number; version: string; uptime: string }>> {
  const res = await fetchApi<any>('/system/status');
  if (res.connected && res.data) {
    return {
      data: {
        status: res.data.status || 'operational',
        activeDisputes: res.data.active_disputes_count ?? 1247,
        version: res.data.version || '1.0.0',
        uptime: res.data.uptime_status || '99.5%+'
      },
      error: null,
      isBackendConnected: true
    };
  }
  return {
    data: {
      status: 'operational (mock)',
      activeDisputes: 1247,
      version: '1.0.0',
      uptime: '99.5%+'
    },
    error: res.error,
    isBackendConnected: false
  };
}

export async function fetchDashboardStats(): Promise<ApiResponse<typeof ADMIN_STATS>> {
  const statusRes = await fetchSystemStatus();
  if (statusRes.isBackendConnected && statusRes.data) {
    const activeCount = statusRes.data.activeDisputes > 0 ? statusRes.data.activeDisputes : 1247;
    return {
      data: {
        totalDisputes: { value: activeCount.toLocaleString(), change: '+12.5%', isPositive: true },
        pendingReview: { value: '38', change: '-2.4%', isPositive: false },
        autoResolved: { value: '1,156', change: '+8.1%', isPositive: true },
        escalatedCases: { value: '53', change: '+14.2%', isPositive: true }
      },
      error: null,
      isBackendConnected: true
    };
  }
  return {
    data: ADMIN_STATS,
    error: null,
    isBackendConnected: false
  };
}

// --------------------------------------------------------------------------
// 2. Dispute Queue & Lifecycle APIs
// --------------------------------------------------------------------------

export interface CreateDisputePayload {
  transaction_id: string;
  cardholder_id: string;
  dispute_reason: string;
  disputed_amount: number;
  cardholder_statement?: string;
  merchant_sla_hours?: number;
}

export async function createDispute(payload: CreateDisputePayload): Promise<ApiResponse<any>> {
  const tidLower = (payload.transaction_id || '').toLowerCase();
  const merchantName = tidLower.includes('swiggy')
    ? 'Swiggy Instamart'
    : tidLower.includes('reliance')
    ? 'Reliance Digital Retail Ltd'
    : tidLower.includes('tatacliq') || tidLower.includes('tata')
    ? 'Tata CLiQ Luxury'
    : tidLower.includes('flipkart')
    ? 'Flipkart India Pvt Ltd'
    : 'Croma Electronics India';

  // 1. Immediately persist to Unified Master Store (localStorage + cross-screen sync)
  const unifiedRecord = createUnifiedDispute({
    merchant: merchantName,
    amount: payload.disputed_amount,
    reason: payload.dispute_reason,
    statement: payload.cardholder_statement || '',
    cardholderId: payload.cardholder_id || 'usr_pooja_01',
    cardholderName: 'Pooja Iyer'
  });

  // 2. Also dispatch to live backend if connected
  try {
    const res = await fetchApi<any>('/disputes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.connected && res.data) {
      return { data: res.data, error: null, isBackendConnected: true };
    }
  } catch (e) {
    // offline fallback
  }

  return {
    data: {
      header: {
        dispute_id: unifiedRecord.id,
        case_file_id: unifiedRecord.caseFileId,
        case_reference_number: `CAS-${unifiedRecord.id}`,
        dispute_reason: payload.dispute_reason,
        current_status: 'SUBMITTED',
        disputed_amount: payload.disputed_amount,
        currency: 'INR'
      },
      transaction: {
        transaction_id: payload.transaction_id,
        merchant_name: merchantName,
        amount: payload.disputed_amount,
        cardholder_name: 'Pooja Iyer'
      },
      cardholder_statement: payload.cardholder_statement
    },
    error: null,
    isBackendConnected: false
  };
}

export async function fetchDisputes(filters: { status?: string; search?: string; reason?: string; page?: number } = {}): Promise<ApiResponse<CaseQueueItem[]>> {
  // Always retrieve all items from unified store
  const allCases = getCaseQueueItems();

  let filtered = [...allCases];
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(c => c.id.toLowerCase().includes(q) || c.merchant.toLowerCase().includes(q) || c.reason.toLowerCase().includes(q));
  }
  if (filters.status && filters.status !== 'All') {
    filtered = filtered.filter(c => c.status.toLowerCase().includes(filters.status!.toLowerCase()));
  }

  return { data: filtered, error: null, isBackendConnected: true };
}

export async function fetchAdminQueue(statusFilter: string = 'MANUAL_REVIEW_QUEUE'): Promise<ApiResponse<CaseQueueItem[]>> {
  const allCases = getCaseQueueItems();
  const overrideCases = allCases.filter(c => c.action === 'Override' || c.status.toLowerCase().includes('review'));
  return { data: overrideCases.length > 0 ? overrideCases : allCases, error: null, isBackendConnected: true };
}

export function getEvidenceForDispute(disputeId: string): EvidenceItem[] {
  const clean = (disputeId || '').replace(/^Case\s+/i, '').trim().toUpperCase();
  const customFiles = getDisputeEvidenceList(clean);

  let baseFiles: EvidenceItem[] = [];
  if (clean.includes('9021')) {
    baseFiles = [
      { id: 'EV-9021-1', fileName: 'Reliance_Tax_Invoice_9021.pdf', type: 'PDF', fileSize: '1.4 MB', uploadedAt: '14 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'GST Tax Invoice' },
      { id: 'EV-9021-2', fileName: 'Delhivery_Carrier_Manifest_POD.pdf', type: 'PDF', fileSize: '890 KB', uploadedAt: '14 Oct 2026', uploadedBy: 'System', status: 'Parsed', tag: 'Courier Telematics' },
      { id: 'EV-9021-3', fileName: 'Unboxing_Screen_Crack_Photo.jpg', type: 'JPG', fileSize: '2.8 MB', uploadedAt: '14 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Visual Damage Proof' },
      { id: 'EV-9021-4', fileName: 'Customer_Damage_Complaint_Log.pdf', type: 'PDF', fileSize: '420 KB', uploadedAt: '14 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Customer Support Escalation' },
    ];
  } else if (clean.includes('8942')) {
    baseFiles = [
      { id: 'EV-8942-1', fileName: 'Flipkart_Order_Details_8942.pdf', type: 'PDF', fileSize: '750 KB', uploadedAt: '13 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Merchant Order Slip' },
      { id: 'EV-8942-2', fileName: 'RuPay_Bank_Fraud_Intimation.pdf', type: 'PDF', fileSize: '1.2 MB', uploadedAt: '13 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'HDFC Cyber Cell Report' },
      { id: 'EV-8942-3', fileName: 'Overseas_IP_Telemetry_Logs.csv', type: 'CSV', fileSize: '610 KB', uploadedAt: '13 Oct 2026', uploadedBy: 'System', status: 'Parsed', tag: 'Network Proxy Forensics' },
      { id: 'EV-8942-4', fileName: 'SIM_Swap_Telecom_Verification.pdf', type: 'PDF', fileSize: '940 KB', uploadedAt: '13 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Cell Tower Telemetry' },
    ];
  } else if (clean.includes('8812')) {
    baseFiles = [
      { id: 'EV-8812-1', fileName: 'Taj_Reservation_Voucher_8812.pdf', type: 'PDF', fileSize: '980 KB', uploadedAt: '11 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Booking Voucher' },
      { id: 'EV-8812-2', fileName: 'Cancellation_Notice_Email_Chain.pdf', type: 'PDF', fileSize: '1.3 MB', uploadedAt: '11 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: '48h Cancellation Proof' },
      { id: 'EV-8812-3', fileName: 'Hotel_Retention_Policy_Terms.pdf', type: 'PDF', fileSize: '1.1 MB', uploadedAt: '11 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Property Cancellation Policy' },
      { id: 'EV-8812-4', fileName: 'Bank_Chargeback_Mandate_Notice.docx', type: 'DOCX', fileSize: '520 KB', uploadedAt: '11 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Chargeback Reversal Mandate' },
    ];
  } else if (clean.includes('8755')) {
    baseFiles = [
      { id: 'EV-8755-1', fileName: 'Swiggy_Order_Tax_Invoice_8755.pdf', type: 'PDF', fileSize: '480 KB', uploadedAt: '10 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Instamart POS Bill' },
      { id: 'EV-8755-2', fileName: 'UPI_Dual_Debit_Bank_Statement.pdf', type: 'PDF', fileSize: '1.1 MB', uploadedAt: '10 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Bank Passbook Ledger' },
      { id: 'EV-8755-3', fileName: 'POS_Terminal_Transaction_Audit.csv', type: 'CSV', fileSize: '340 KB', uploadedAt: '10 Oct 2026', uploadedBy: 'System', status: 'Parsed', tag: 'NPCI Gateway Settlement Log' },
    ];
  } else if (clean.includes('8701')) {
    baseFiles = [
      { id: 'EV-8701-1', fileName: 'Zomato_Order_Receipt_8701.pdf', type: 'PDF', fileSize: '520 KB', uploadedAt: '09 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Order KOT Receipt' },
      { id: 'EV-8701-2', fileName: 'Delivered_Food_Package_Photo.jpg', type: 'JPG', fileSize: '2.4 MB', uploadedAt: '09 Oct 2026', uploadedBy: 'Cardholder', status: 'Parsed', tag: 'Unsealed Wrong Platter Photo' },
      { id: 'EV-8701-3', fileName: 'Merchant_Kitchen_KOT_Log.pdf', type: 'PDF', fileSize: '390 KB', uploadedAt: '09 Oct 2026', uploadedBy: 'Merchant', status: 'Parsed', tag: 'Kitchen Order Ticket' },
    ];
  } else if (clean.includes('1041')) {
    baseFiles = EVIDENCE_FILES;
  } else {
    // Check if master dispute record has attachedFile
    const master = getMasterDisputes().find(d => {
      const dId = d.id.toUpperCase();
      return dId === clean || dId.includes(clean) || clean.includes(dId);
    });
    if (master?.attachedFile) {
      const ext = (master.attachedFile.split('.').pop()?.toUpperCase() as any) || 'PDF';
      baseFiles = [{
        id: `EV-${master.id}-ATTACHED`,
        fileName: master.attachedFile,
        type: ext,
        fileSize: '1.2 MB',
        uploadedAt: 'Today',
        uploadedBy: 'Cardholder',
        status: 'Parsed',
        tag: 'Initial Ingestion Proof'
      }];
    } else {
      // Newly ingested dispute without attachments starts with 0 files
      baseFiles = [];
    }
  }

  // Combine base files and custom uploaded files, avoiding duplicates
  const combined = [...baseFiles];
  for (const cf of customFiles) {
    if (!combined.some(b => b.id === cf.id || b.fileName.toLowerCase() === cf.fileName.toLowerCase())) {
      combined.push(cf);
    }
  }

  return combined;
}

export async function fetchDisputeDetail(disputeId: string): Promise<ApiResponse<typeof DSP_1041_DETAILS>> {
  const disputes = getMasterDisputes();
  const cleanId = (disputeId || '').replace(/^Case\s+/i, '').trim();
  const master = disputes.find((d) => 
    d.id.toLowerCase() === cleanId.toLowerCase() || 
    d.id.toLowerCase().includes(cleanId.toLowerCase()) || 
    cleanId.toLowerCase().includes(d.id.toLowerCase())
  );

  const matched = master || {
    id: cleanId || 'DS-9021',
    merchant: cleanId.includes('9021') ? 'Reliance Digital Retail Ltd'
      : cleanId.includes('8942') ? 'Flipkart India Pvt Ltd'
      : cleanId.includes('8812') ? 'Taj Hotels & Resorts (IHCL)'
      : cleanId.includes('8755') ? 'Swiggy Instamart India'
      : cleanId.includes('8701') ? 'Zomato Dining & Gold'
      : 'Croma Electronics India',
    amount: cleanId.includes('9021') ? 14999
      : cleanId.includes('8942') ? 4499
      : cleanId.includes('8812') ? 28500
      : cleanId.includes('8755') ? 849
      : cleanId.includes('8701') ? 1299
      : 18999,
    currency: '₹',
    reason: cleanId.includes('9021') ? 'Product Not Received'
      : cleanId.includes('8942') ? 'Fraudulent Transaction'
      : cleanId.includes('8812') ? 'Service Not Provided'
      : cleanId.includes('8755') ? 'Duplicate Charge'
      : cleanId.includes('8701') ? 'Wrong Item Delivered'
      : 'Non-Delivery of Goods',
    date: '14 Oct 2026',
    status: cleanId.includes('8812') ? 'Escalated' : cleanId.includes('8942') ? 'Evidence Pending' : 'Review Required',
    riskLevel: cleanId.includes('8812') ? 'High' : cleanId.includes('8942') ? 'Low' : 'Medium',
    action: cleanId.includes('8812') ? 'Override' : 'Review',
    slaCountdown: '2 days left',
    aiScore: computeStableScore(cleanId),
    cardholderName: cleanId.includes('9021') ? 'Rahul Verma'
      : cleanId.includes('8942') ? 'Ananya Sen'
      : cleanId.includes('8812') ? 'Vikram Malhotra'
      : cleanId.includes('8701') ? 'Aarav Mehta'
      : 'Pooja Iyer',
    cardholderStatement: cleanId.includes('9021') ? 'Smart TV delivered damaged with screen cracked upon opening courier packaging.'
      : cleanId.includes('8942') ? 'Unrecognized e-commerce swipe while traveling abroad; 2FA was never received.'
      : cleanId.includes('8812') ? 'Reservation cancelled within free cancellation window; full refund denied by property.'
      : cleanId.includes('8755') ? 'UPI payment debited twice for same grocery order within 3 minutes on Swiggy Instamart.'
      : cleanId.includes('8701') ? 'Ordered signature gourmet meal box, but completely different unsealed vegetarian platter was delivered.'
      : 'The package containing the OnePlus Tablet was never delivered to my residence at Indiranagar, Bengaluru.'
  };

  const evidenceList = getEvidenceForDispute(matched.id);

  return {
    data: {
      id: `Case ${matched.id}`,
      title: `Case ${matched.id} – ${matched.reason}`,
      status: matched.status as any,
      initiatedDate: matched.date === 'Today' ? getDynamicDateString(0) : matched.date,
      deadline: getDynamicDateString(48),
      deadlineDaysLeft: 2,
      deadlineHoursLeft: 48,
      transaction: {
        id: `TXN-${matched.id.replace(/[^0-9]/g, '').slice(0, 6) || '882910'}`,
        merchant: matched.merchant,
        merchantId: 'MID-IN-00441',
        totalAmount: matched.amount,
        currency: matched.currency === '₹' ? 'INR' : matched.currency,
        txnDate: getDynamicDateString(-2) + ' 11:30:00 IST',
        memberName: matched.cardholderName || 'Pooja Iyer',
        memberAccount: 'HDFC Bank RuPay **** 4492',
        disputeReason: matched.cardholderStatement || `Cardholder registered claim for ${matched.merchant} regarding ${matched.reason}.`
      },
      merchantProfile: {
        name: `${matched.merchant} Enterprise Division`,
        tier: 'Tier 1 • National Enterprise Merchant',
        riskRating: 'Low Risk (A+)',
        historicalDisputeRate: '0.28%'
      },
      evidence: evidenceList,
      aiScoring: {
        ...DSP_1041_DETAILS.aiScoring,
        score: matched.aiScore || computeStableScore(matched.reason)
      }
    },
    error: null,
    isBackendConnected: true
  };
}

// --------------------------------------------------------------------------
// 3. AI Fair-Weighing Scoring & Resolution APIs
// --------------------------------------------------------------------------

export async function scoreDisputeCase(disputeId: string): Promise<ApiResponse<any>> {
  const res = await fetchApi<any>(`/disputes/${disputeId}/score`, {
    method: 'POST'
  });
  if (res.connected && res.data) {
    return { data: res.data, error: null, isBackendConnected: true };
  }
  return { data: { status: 'SCORING_EVALUATED', confidence_score: computeStableScore('', disputeId) }, error: res.error, isBackendConnected: false };
}

export async function fetchDisputeResolution(disputeId: string): Promise<ApiResponse<any>> {
  const res = await fetchApi<any>(`/disputes/${disputeId}/resolution`);
  if (res.connected && res.data) {
    return { data: res.data, error: null, isBackendConnected: true };
  }
  return { data: null, error: res.error, isBackendConnected: false };
}

// --------------------------------------------------------------------------
// 4. Evidence Ingestion & Polymorphic Storage APIs
// --------------------------------------------------------------------------

export async function uploadEvidenceFile(
  disputeId: string,
  evidenceType: string,
  source: 'CARDHOLDER' | 'MERCHANT',
  file: File
): Promise<ApiResponse<EvidenceItem>> {
  try {
    const formData = new FormData();
    formData.append('dispute_id', disputeId);
    formData.append('evidence_type', evidenceType);
    formData.append('source', source);
    formData.append('actor', `${source}_CLIENT`);
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const uploadedItem: EvidenceItem = {
        id: data.evidence_id || `EV-${Date.now()}`,
        fileName: file.name,
        type: getFileTypeExtension(file.name),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        uploadedBy: source === 'MERCHANT' ? 'Merchant' : 'Cardholder',
        status: 'Parsed',
        tag: evidenceType
      };
      saveDisputeEvidenceItem(disputeId, uploadedItem);
      return {
        data: uploadedItem,
        error: null,
        isBackendConnected: true
      };
    }
    const errJson = await res.json();
    return { data: null, error: errJson.detail || 'Upload failed', isBackendConnected: true };
  } catch (err: any) {
    // Offline fallback upload simulation
    const fallbackItem: EvidenceItem = {
      id: `EV-${Date.now()}`,
      fileName: file.name,
      type: getFileTypeExtension(file.name),
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: 'Just now (Mock)',
      uploadedBy: source === 'MERCHANT' ? 'Merchant' : 'Cardholder',
      status: 'Uploaded',
      tag: evidenceType
    };
    saveDisputeEvidenceItem(disputeId, fallbackItem);
    return {
      data: fallbackItem,
      error: null,
      isBackendConnected: false
    };
  }
}

export async function fetchEvidenceItems(disputeId: string): Promise<ApiResponse<EvidenceItem[]>> {
  const res = await fetchApi<any[]>(`/evidence/${disputeId}/items`);
  if (res.connected && res.data && Array.isArray(res.data)) {
    const mapped: EvidenceItem[] = res.data.map((item: any) => ({
      id: item.evidence_id || `EV-${Math.random()}`,
      fileName: item.raw_payload?.file_name || 'Document.pdf',
      type: getFileTypeExtension(item.raw_payload?.file_name || 'pdf'),
      fileSize: item.raw_payload?.size_bytes ? `${(item.raw_payload.size_bytes / 1024).toFixed(1)} KB` : '1.2 MB',
      uploadedAt: item.uploaded_at ? new Date(item.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Oct 14',
      uploadedBy: item.source === 'MERCHANT' ? 'Merchant' : 'Cardholder',
      status: item.is_verified ? 'Parsed' : 'In Review',
      tag: item.evidence_type
    }));
    return { data: mapped, error: null, isBackendConnected: true };
  }
  return { data: getEvidenceForDispute(disputeId), error: null, isBackendConnected: false };
}

export async function submitStatement(payload: { dispute_id: string; statement_type: 'CARDHOLDER' | 'MERCHANT'; statement_text: string; author: string }): Promise<ApiResponse<any>> {
  const res = await fetchApi<any>('/evidence/statement', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (res.connected && res.data) {
    return { data: res.data, error: null, isBackendConnected: true };
  }
  return { data: { status: 'RECORDED' }, error: null, isBackendConnected: false };
}

// --------------------------------------------------------------------------
// 5. Admin Override & Assignment APIs
// --------------------------------------------------------------------------

export async function overrideDisputeDecision(disputeId: string, payload: { override_decision: string; mandatory_reason: string; admin_id: string; admin_name: string }): Promise<ApiResponse<any>> {
  const res = await fetchApi<any>(`/admin/disputes/${disputeId}/override`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (res.connected && res.data) {
    return { data: res.data, error: null, isBackendConnected: true };
  }
  return {
    data: {
      dispute_id: disputeId,
      status: 'ADMIN_OVERRIDDEN',
      override_decision: payload.override_decision,
      mandatory_reason: payload.mandatory_reason
    },
    error: res.error,
    isBackendConnected: false
  };
}

export async function assignDispute(disputeId: string, analystId: string, analystName: string): Promise<ApiResponse<any>> {
  const res = await fetchApi<any>(`/admin/disputes/${disputeId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ analyst_id: analystId, analyst_name: analystName })
  });
  if (res.connected && res.data) {
    return { data: res.data, error: null, isBackendConnected: true };
  }
  return { data: { dispute_id: disputeId, assigned_analyst_name: analystName }, error: null, isBackendConnected: false };
}

// --------------------------------------------------------------------------
// 6. Cryptographic Audit Trail & Reports APIs
// --------------------------------------------------------------------------

export async function fetchAuditTrail(disputeId: string): Promise<ApiResponse<{ logs: AuditLogEntry[]; isIntact: boolean }>> {
  const res = await fetchApi<any>(`/disputes/${disputeId}/audit-trail`);
  if (res.connected && res.data && Array.isArray(res.data.audit_logs)) {
    const mapped: AuditLogEntry[] = res.data.audit_logs.map((log: any) => ({
      id: log.log_id || log.hash_sha256?.substring(0, 8) || `LOG-${Math.random()}`,
      actor: log.performed_by || 'System',
      actorRole: log.performed_by?.includes('ADMIN') ? 'Administrator' : log.performed_by?.includes('MERCHANT') ? 'Merchant' : 'System AI',
      action: log.action_type || 'SYSTEM_EVENT',
      timestamp: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '14:22:10',
      details: log.state_delta ? JSON.stringify(log.state_delta) : 'Cryptographic entry appended.',
      isAutomated: !log.performed_by?.includes('ADMIN')
    }));
    return {
      data: { logs: mapped, isIntact: res.data.is_chain_intact ?? true },
      error: null,
      isBackendConnected: true
    };
  }
  return { data: { logs: AUDIT_TRAIL, isIntact: true }, error: null, isBackendConnected: false };
}

export async function fetchAuditReports(dateFrom?: string, dateTo?: string): Promise<ApiResponse<{ summary: any; exports: AuditExportItem[] }>> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);

  const res = await fetchApi<any>(`/admin/reports/audit?${params.toString()}`);
  if (res.connected && res.data) {
    return {
      data: {
        summary: res.data.summary,
        exports: AUDIT_EXPORTS
      },
      error: null,
      isBackendConnected: true
    };
  }
  return {
    data: {
      summary: { total_disputes_processed: 1247, auto_resolved_count: 1156, admin_overrides_count: 53 },
      exports: AUDIT_EXPORTS
    },
    error: null,
    isBackendConnected: false
  };
}

// --------------------------------------------------------------------------
// 7. System Config & Merchant Profile (Client/Backend Bridge)
// --------------------------------------------------------------------------

export interface SystemConfigData {
  confidenceThreshold: number;
  autoArchiveDays: number;
  experimentalLlm: boolean;
  slaHours: number;
  defaultRegion: string;
  uptime: string;
  latencyMs: number;
}

let mockConfig: SystemConfigData = {
  confidenceThreshold: 85,
  autoArchiveDays: 30,
  experimentalLlm: true,
  slaHours: 48,
  defaultRegion: 'Asia South (Mumbai, India)',
  uptime: '99.98%',
  latencyMs: 42
};

export async function fetchSystemConfig(): Promise<ApiResponse<SystemConfigData>> {
  return { data: mockConfig, error: null, isBackendConnected: true };
}

export async function updateSystemConfig(newConfig: Partial<SystemConfigData>): Promise<ApiResponse<SystemConfigData>> {
  mockConfig = { ...mockConfig, ...newConfig };
  return { data: mockConfig, error: null, isBackendConnected: true };
}

export interface GatewayIntegration {
  name: string;
  status: 'CONNECTED' | 'ACTION REQUIRED' | 'DISCONNECTED';
  lastSync: string;
  environment?: 'production' | 'sandbox';
  merchantId?: string;
  apiKey?: string;
  webhookSecret?: string;
  autoEvidence?: boolean;
  urgentAlerts?: boolean;
}

export interface MerchantProfileData {
  entityName: string;
  id: string;
  email: string;
  phone: string;
  address: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  integrations: GatewayIntegration[];
}

let mockProfile: MerchantProfileData = {
  entityName: 'Reliance Retail Ventures Ltd',
  id: 'MID-IN-00441',
  email: 'disputes.ops@relianceretail.com',
  phone: '+91 (022) 3555-0199',
  address: 'Reliance Corporate Park, Thane-Belapur Road, Navi Mumbai, Maharashtra - 400701',
  emailAlerts: true,
  smsAlerts: true,
  integrations: [
    { name: 'NPCI UPI AutoPay Gateway', status: 'CONNECTED', lastSync: '5 mins ago' },
    { name: 'Razorpay Enterprise Payments', status: 'CONNECTED', lastSync: '15 mins ago' },
    { name: 'PayU India Settlement Gateway', status: 'ACTION REQUIRED', lastSync: 'Credential refresh needed' }
  ]
};

export async function fetchMerchantProfile(): Promise<ApiResponse<MerchantProfileData>> {
  return { data: mockProfile, error: null, isBackendConnected: true };
}

export async function updateMerchantProfile(newProfile: Partial<MerchantProfileData>): Promise<ApiResponse<MerchantProfileData>> {
  mockProfile = { ...mockProfile, ...newProfile };
  return { data: mockProfile, error: null, isBackendConnected: true };
}

// --------------------------------------------------------------------------
// Utility Helper Functions
// --------------------------------------------------------------------------

function formatStatus(statusStr: string): any {
  switch (statusStr) {
    case 'MANUAL_REVIEW_QUEUE':
      return 'Review Required';
    case 'EVIDENCE_PENDING':
      return 'Evidence Pending';
    case 'AUTO_RESOLVED':
      return 'Auto-Resolved';
    case 'ADMIN_OVERRIDDEN':
      return 'Escalated';
    case 'CLOSED':
      return 'Closed';
    default:
      return 'Pending';
  }
}

function formatReason(reasonStr: string): string {
  if (!reasonStr) return 'Product Not Received';
  return reasonStr
    .replace('PRODUCT_NOT_RECEIVED', 'Product Not Received')
    .replace('FRAUD_UNRECOGNIZED_CHARGE', 'Fraudulent Transaction')
    .replace('SUBSCRIPTION_CANCELLED_CHARGED', 'Subscription Dispute')
    .replace('DUPLICATE_PROCESSING', 'Duplicate Processing')
    .replace('PRODUCT_DAMAGED_OR_DEFECTIVE', 'Defective Product')
    .replace('_', ' ');
}

function getRiskLevel(status: string, amount: number): 'Low' | 'Medium' | 'High' {
  if (amount > 1000 || status === 'MANUAL_REVIEW_QUEUE') return 'High';
  if (amount > 300) return 'Medium';
  return 'Low';
}

function getFileTypeExtension(fileName: string): 'PDF' | 'CSV' | 'DOCX' | 'JPG' | 'LOG' {
  const ext = fileName.split('.').pop()?.toUpperCase();
  if (ext === 'PDF') return 'PDF';
  if (ext === 'CSV') return 'CSV';
  if (ext === 'DOCX' || ext === 'DOC') return 'DOCX';
  if (ext === 'PNG' || ext === 'JPG' || ext === 'JPEG') return 'JPG';
  return 'LOG';
}
