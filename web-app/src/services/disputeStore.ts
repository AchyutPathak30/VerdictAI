/**
 * VerdictAI Unified Dispute Master Store
 * Provides bulletproof client-side persistence (localStorage) across
 * sessions, user logout/login, persona switching, and offline/standalone mode.
 */

import { CaseQueueItem, EvidenceItem } from '../types/dispute';
import { DSP_1041_DETAILS, getDynamicDateString } from '../data/mockData';

export interface UnifiedDisputeRecord {
  id: string;
  caseFileId: string;
  merchant: string;
  amount: number;
  currency: string;
  reason: string;
  date: string;
  status: string;
  statusColor: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  action: string;
  slaCountdown: string;
  sha256Hash: string;
  courier: string;
  aiVerdict: string;
  aiScore: number;
  cardholderId: string;
  cardholderName: string;
  cardholderStatement: string;
  attachedFile?: string;
}

const STORAGE_KEY = 'verdictai_master_disputes_v2';
const EVENT_NAME = 'verdictai_disputes_updated';

// Default initial demo cases seeded on first launch
const SEED_DISPUTES: UnifiedDisputeRecord[] = [
  {
    id: 'CHB-882941-DX',
    caseFileId: 'CF-882941',
    merchant: 'Croma Electronics India',
    amount: 18999.00,
    currency: '₹',
    reason: 'Product Not Received',
    date: 'Oct 23, 2026',
    status: 'In Investigation',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
    riskLevel: 'High',
    action: 'Review',
    slaCountdown: '18h 42m remaining',
    sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    courier: 'Blue Dart Express (BLUEDART-88192034)',
    aiVerdict: 'Fair-Weighing ML recommends approval in customer favor. Courier GPS shows unauthorized drop-off 3.2km away.',
    aiScore: 87,
    cardholderId: 'usr_pooja_01',
    cardholderName: 'Pooja Iyer',
    cardholderStatement: "The package containing the OnePlus Tablet was never delivered to my residence at Indiranagar, Bengaluru. Blue Dart tracking marks it as 'Delivered', but society security logs and gate CCTV show no courier delivery occurred."
  },
  {
    id: 'CHB-1042-SW',
    caseFileId: 'CF-1042',
    merchant: 'Swiggy Instamart',
    amount: 1499.00,
    currency: '₹',
    reason: 'Duplicate Billing',
    date: 'Oct 18, 2026',
    status: 'Auto-Resolved (Refunded)',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    riskLevel: 'Low',
    action: 'Review',
    slaCountdown: 'Settled',
    sha256Hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
    courier: 'Direct Delivery',
    aiVerdict: 'Dual swipe detected on merchant POS terminal within 3 minutes. Immediate credit credited to HDFC RuPay account.',
    aiScore: 97,
    cardholderId: 'usr_pooja_01',
    cardholderName: 'Pooja Iyer',
    cardholderStatement: 'UPI payment debited twice on Swiggy Instamart order within 2 minutes.'
  },
  {
    id: 'CHB-99281-TC',
    caseFileId: 'CF-99281',
    merchant: 'Tata CLiQ Luxury',
    amount: 24999.00,
    currency: '₹',
    reason: 'Unrecognized Online Charge',
    date: 'Oct 12, 2026',
    status: 'Settled (Bank Override)',
    statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
    riskLevel: 'High',
    action: 'Override',
    slaCountdown: 'Closed',
    sha256Hash: 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123',
    courier: 'N/A',
    aiVerdict: 'Overseas IP flagged without 2FA OTP authorization. Full chargeback accepted and sealed.',
    aiScore: 91,
    cardholderId: 'usr_pooja_01',
    cardholderName: 'Pooja Iyer',
    cardholderStatement: 'Unauthorized luxury apparel charge on RuPay Platinum card originating from foreign IP.'
  },
  {
    id: 'DS-9021',
    caseFileId: 'CF-9021',
    merchant: 'Reliance Digital Retail Ltd',
    amount: 14999.00,
    currency: '₹',
    reason: 'Product Not Received',
    date: '14 Oct 2026',
    status: 'Review Required',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
    riskLevel: 'Medium',
    action: 'Review',
    slaCountdown: '2 days left',
    sha256Hash: 'e5f67890123456789abcdef0123456789abcdef0123456789abcdef01234567',
    courier: 'Delhivery Surface',
    aiVerdict: 'Carrier telematics confirm signature mismatch. Verification in progress.',
    aiScore: 87,
    cardholderId: 'usr_rahul_02',
    cardholderName: 'Rahul Verma',
    cardholderStatement: 'Smart TV delivered damaged with screen cracked.'
  },
  {
    id: 'DS-8942',
    caseFileId: 'CF-8942',
    merchant: 'Flipkart India Pvt Ltd',
    amount: 4499.00,
    currency: '₹',
    reason: 'Fraudulent Transaction',
    date: '13 Oct 2026',
    status: 'Evidence Pending',
    statusColor: 'bg-purple-100 text-purple-800 border-purple-200',
    riskLevel: 'Low',
    action: 'View',
    slaCountdown: '5 days left',
    sha256Hash: 'f67890123456789abcdef0123456789abcdef0123456789abcdef012345678',
    courier: 'Ekart Logistics',
    aiVerdict: 'Cardholder reported stolen device. 2FA authentication bypassed.',
    aiScore: 89,
    cardholderId: 'usr_ananya_03',
    cardholderName: 'Ananya Sen',
    cardholderStatement: 'Unrecognized e-commerce swipe while traveling abroad.'
  },
  {
    id: 'DS-8812',
    caseFileId: 'CF-8812',
    merchant: 'Taj Hotels & Resorts (IHCL)',
    amount: 28500.00,
    currency: '₹',
    reason: 'Service Not Provided',
    date: '11 Oct 2026',
    status: 'Escalated',
    statusColor: 'bg-rose-100 text-rose-800 border-rose-200',
    riskLevel: 'High',
    action: 'Override',
    slaCountdown: '1 day left',
    sha256Hash: '7890123456789abcdef0123456789abcdef0123456789abcdef0123456789a',
    courier: 'N/A',
    aiVerdict: 'Hotel booking cancelled 48h prior per policy, but merchant ledger retained security deposit.',
    aiScore: 44,
    cardholderId: 'usr_vikram_04',
    cardholderName: 'Vikram Malhotra',
    cardholderStatement: 'Reservation cancelled within free cancellation window; full refund denied by property.'
  }
];

export function getMasterDisputes(): UnifiedDisputeRecord[] {
  if (typeof window === 'undefined') return SEED_DISPUTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Smooth migration: check if previous session stored disputes in legacy keys
    const legacyCardholder = localStorage.getItem('verdictai_cardholder_disputes');
    const migrated: UnifiedDisputeRecord[] = [];

    if (legacyCardholder) {
      try {
        const parsedLegacy = JSON.parse(legacyCardholder);
        if (Array.isArray(parsedLegacy)) {
          for (const item of parsedLegacy) {
            if (!SEED_DISPUTES.some(s => s.id === item.id)) {
              migrated.push({
                id: item.id || `CHB-${Math.floor(100000 + Math.random() * 900000)}-IN`,
                caseFileId: `CF-${item.id?.replace(/[^0-9]/g, '') || '9999'}`,
                merchant: item.merchant || 'Croma Electronics India',
                amount: item.amount || 18999,
                currency: '₹',
                reason: item.reason || 'Product Not Received',
                date: item.date || 'Today',
                status: item.status || 'Submitted (SLA Active)',
                statusColor: item.statusColor || 'bg-blue-100 text-blue-800 border-blue-200',
                riskLevel: item.amount > 10000 ? 'High' : 'Medium',
                action: 'Review',
                slaCountdown: item.slaCountdown || '47h 59m remaining',
                sha256Hash: item.sha256Hash || `sha256_${Date.now()}_migrated_fingerprint`,
                courier: item.courier || 'Awaiting Merchant Counter-Proof',
                aiVerdict: item.aiVerdict || 'Dispute ingested into Fair-Weighing ML queue. Merchant notified within 48-hour SLA.',
                aiScore: item.aiScore || 88,
                cardholderId: 'usr_pooja_01',
                cardholderName: 'Pooja Iyer',
                cardholderStatement: item.statement || item.reason || 'Contested transaction.'
              });
            }
          }
        }
      } catch (e) {
        // ignore legacy parsing error
      }
    }

    const merged = [...migrated, ...SEED_DISPUTES];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('[VerdictAI Store] Failed to read from localStorage:', err);
  }
  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DISPUTES));
  } catch (err) {
    // ignore
  }
  return SEED_DISPUTES;
}

export function saveMasterDisputes(disputes: UnifiedDisputeRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disputes));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: disputes }));
  } catch (err) {
    console.error('[VerdictAI Store] Failed to save disputes to localStorage:', err);
  }
}

export function subscribeToDisputeUpdates(callback: (disputes: UnifiedDisputeRecord[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getMasterDisputes());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getMasterDisputes());
    }
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getCardholderDisputes(cardholderId: string = 'usr_pooja_01'): UnifiedDisputeRecord[] {
  const all = getMasterDisputes();
  return all.filter((d) => d.cardholderId === cardholderId || d.id.startsWith('CHB-'));
}

export function getCaseQueueItems(): CaseQueueItem[] {
  const all = getMasterDisputes();
  return all.map((d) => ({
    id: d.id,
    merchant: d.merchant,
    amount: d.amount,
    currency: d.currency,
    status: (d.status === 'Submitted (SLA Active)' || d.status === 'In Investigation' ? 'Review Required' : d.status) as any,
    riskLevel: d.riskLevel,
    action: d.action,
    reason: d.reason,
    filedDate: d.date,
    deadline: d.slaCountdown,
    aiScore: d.aiScore
  }));
}

export interface NewDisputeInput {
  merchant: string;
  amount: number;
  reason: string;
  statement: string;
  cardholderId?: string;
  cardholderName?: string;
  attachedFile?: string;
}

export function createUnifiedDispute(input: NewDisputeInput): UnifiedDisputeRecord {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const id = `CHB-${randomNum}-IN`;

  const newRecord: UnifiedDisputeRecord = {
    id,
    caseFileId: `CF-${randomNum}`,
    merchant: input.merchant,
    amount: input.amount,
    currency: '₹',
    reason: input.reason.replace(/_/g, ' '),
    date: 'Today',
    status: 'Submitted (SLA Active)',
    statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
    riskLevel: input.amount > 10000 ? 'High' : 'Medium',
    action: 'Review',
    slaCountdown: '47h 59m remaining',
    sha256Hash: `sha256_${Date.now()}_simulated_hash_verdictai`,
    courier: 'Awaiting Merchant Counter-Proof',
    aiVerdict: 'Dispute ingested into Fair-Weighing ML queue. Merchant notified to supply delivery confirmation within 48-hour SLA.',
    aiScore: 88,
    cardholderId: input.cardholderId || 'usr_pooja_01',
    cardholderName: input.cardholderName || 'Pooja Iyer',
    cardholderStatement: input.statement,
    attachedFile: input.attachedFile
  };

  const current = getMasterDisputes();
  const updated = [newRecord, ...current];
  saveMasterDisputes(updated);

  return newRecord;
}
