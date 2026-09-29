import { CaseQueueItem, EvidenceItem, AuditLogEntry, ReasoningFactor, AuditExportItem } from '../types/dispute';

export const ADMIN_STATS = {
  totalDisputes: { value: '1,247', change: '+12.5%', isPositive: true },
  pendingReview: { value: '38', change: '-2.4%', isPositive: false },
  autoResolved: { value: '1,156', change: '+8.1%', isPositive: true },
  escalatedCases: { value: '53', change: '+14.2%', isPositive: true },
};

export const ACTIVE_CASE_QUEUE: CaseQueueItem[] = [
  {
    id: 'DS-9021',
    merchant: 'Global Retail Inc.',
    amount: 1240.00,
    currency: '$',
    status: 'Review Required',
    riskLevel: 'Medium',
    action: 'Review',
    reason: 'Product Not Received',
    filedDate: 'Oct 14, 2023',
    deadline: '2 days left',
    aiScore: 72,
  },
  {
    id: 'DS-8942',
    merchant: 'TechNova Solutions',
    amount: 450.25,
    currency: '$',
    status: 'Evidence Pending',
    riskLevel: 'Low',
    action: 'View',
    reason: 'Fraudulent Transaction',
    filedDate: 'Oct 13, 2023',
    deadline: '5 days left',
    aiScore: 89,
  },
  {
    id: 'DS-8812',
    merchant: 'LuxStay Hotels',
    amount: 3890.00,
    currency: '$',
    status: 'Escalated',
    riskLevel: 'High',
    action: 'Override',
    reason: 'Service Not Provided',
    filedDate: 'Oct 11, 2023',
    deadline: '1 day left',
    aiScore: 44,
  },
  {
    id: 'DS-8755',
    merchant: 'FastFlow Logistics',
    amount: 89.50,
    currency: '$',
    status: 'Review Required',
    riskLevel: 'Low',
    action: 'Review',
    reason: 'Duplicate Charge',
    filedDate: 'Oct 10, 2023',
    deadline: '4 days left',
    aiScore: 61,
  },
  {
    id: 'DS-8701',
    merchant: 'Urban Eats App',
    amount: 124.99,
    currency: '$',
    status: 'Review Required',
    riskLevel: 'Medium',
    action: 'Review',
    reason: 'Wrong Item Delivered',
    filedDate: 'Oct 09, 2023',
    deadline: '6 days left',
    aiScore: 58,
  },
];

export const DSP_1041_DETAILS = {
  id: 'Case DSP-1041',
  title: 'Case DSP-1041 – Not Received',
  status: 'Pending Review' as const,
  initiatedDate: 'Oct 14, 2023',
  deadline: 'Oct 28, 2023',
  deadlineDaysLeft: 4,
  transaction: {
    id: 'TXN-882910',
    merchant: 'Global Logistics Hub',
    merchantId: 'MID-00441',
    totalAmount: 1249.50,
    currency: 'USD',
    txnDate: 'Oct 12, 2023 14:22:10 GMT',
    memberName: 'Sarah Jenkins',
    memberAccount: '**** 4492',
    disputeReason: "The package was never delivered to my residence. The tracking number provided shows 'Delivered' but I have checked with neighbors and surveillance. No parcel found.",
  },
  merchantProfile: {
    name: 'Global Logistics Hub',
    tier: 'Tier 1 • High Volume Merchant',
    riskRating: 'Low Risk (B+)',
    historicalDisputeRate: '0.42%',
  },
  evidence: [
    {
      id: 'EV-1',
      fileName: 'Delivery_Confirmation.pdf',
      type: 'PDF',
      fileSize: '420 KB',
      uploadedAt: 'Oct 14, 2023',
      uploadedBy: 'System',
      status: 'Parsed',
      tag: 'Carrier GPS Record'
    },
    {
      id: 'EV-2',
      fileName: 'Merchant_Correspondence.pdf',
      type: 'PDF',
      fileSize: '1.1 MB',
      uploadedAt: 'Oct 15, 2023',
      uploadedBy: 'Merchant',
      status: 'Uploaded',
      tag: 'Email Thread'
    },
    {
      id: 'EV-3',
      fileName: 'Warehouse_Dispatch.csv',
      type: 'CSV',
      fileSize: '88 KB',
      uploadedAt: 'Oct 14, 2023',
      uploadedBy: 'Merchant',
      status: 'Parsed',
      tag: 'Manifest'
    },
    {
      id: 'EV-4',
      fileName: 'Member_Statement.docx',
      type: 'DOCX',
      fileSize: '156 KB',
      uploadedAt: 'Oct 14, 2023',
      uploadedBy: 'Cardholder',
      status: 'Uploaded',
      tag: 'Affidavit'
    },
    {
      id: 'EV-5',
      fileName: 'CCTV_Snapshot_Driveway.jpg',
      type: 'JPG',
      fileSize: '2.4 MB',
      uploadedAt: 'Oct 16, 2023',
      uploadedBy: 'Cardholder',
      status: 'Uploaded',
      tag: 'Photo Proof'
    }
  ] as EvidenceItem[],
  aiScoring: {
    score: 72,
    favour: 'MEMBER' as const,
    factors: [
      { label: 'Merchant Delivery Proof Quality', weight: 88, favors: 'merchant' },
      { label: 'Member Account Credibility', weight: 94, favors: 'cardholder' },
      { label: 'Geospatial Delivery Match', weight: 22, favors: 'merchant' },
      { label: 'Historical Delivery Success', weight: 65, favors: 'merchant' },
    ] as ReasoningFactor[],
    narrativeSummary: "The AI analysis identifies a critical discrepancy in the GPS delivery data. While the carrier reports 'Delivered', the geofence radius for the drop-off is 0.4 miles outside the member's registered residence. Merchant correspondence confirms high tiering but fails to provide a photo of the parcel at the door.",
    recommendation: "Uphold dispute in favor of the member. High probability of misdelivery by third-party carrier.",
    assignedAdmin: "Rivera, A.",
  }
};

export const CHB_99281_OVERRIDE_DATA = {
  caseId: 'CHB-99281-DX',
  aiConfidence: 44.2,
  warningText: 'AI Score Low (44%) – Manual Review Required for Case CHB-99281-DX',
  transactionTotal: 1240.00,
  merchantName: 'Global Retail Solutions',
  keyConflictPoints: [
    {
      type: 'warning',
      title: 'Mismatched IP',
      desc: "Transaction originated from Chicago, IL (IP: 192.168.1.1), while the cardholder's billing address is registered in Seattle, WA."
    },
    {
      type: 'warning',
      title: 'Velocity Trigger',
      desc: 'This is the 3rd attempt within 15 minutes from this specific device fingerprint.'
    },
    {
      type: 'success',
      title: 'Merchant Validation',
      desc: 'AVS/CVV matching successful. Digital receipt signed via biometric authentication.'
    }
  ],
  evidenceDocuments: [
    { fileName: 'Digital_Receipt_7781.pdf', type: 'PDF', fileSize: '840 KB' },
    { fileName: 'Shipping_Label_A104.pdf', type: 'PDF', fileSize: '1.1 MB' },
    { fileName: 'Customer_Chat_Log.log', type: 'LOG', fileSize: '45 KB' },
  ],
  auditTrail: [
    {
      id: 'aud-1',
      actor: 'System AI (Auto-Analysis)',
      actorRole: 'System AI',
      action: 'Initial Scoring',
      timestamp: 'Oct 24, 2023 • 09:12 AM',
      details: 'AI Score calculated at 44% (High Risk)',
      isAutomated: true
    },
    {
      id: 'aud-2',
      actor: 'Marcus Chen',
      actorRole: 'Administrator',
      action: 'Evidence Review',
      timestamp: 'Oct 24, 2023 • 10:45 AM',
      details: 'Manually viewed 3 evidence documents',
      isAutomated: false
    },
    {
      id: 'aud-3',
      actor: 'System AI',
      actorRole: 'System AI',
      action: 'Flagged for Override',
      timestamp: 'Oct 24, 2023 • 11:00 AM',
      details: 'Low confidence threshold triggered (< 50%)',
      isAutomated: true
    }
  ] as AuditLogEntry[],
  networkRisk: {
    similarCasesResolutionRate: '12.4%',
    merchantDisputeRatio: '1.82%'
  }
};

export const MERCHANT_PORTAL_DATA = {
  merchant: {
    name: 'Global Retail Group',
    tier: 'Enterprise Tier',
    merchantId: 'MID-992031-GRG',
    lastSync: '12 minutes ago',
  },
  stats: {
    activeDisputes: { count: 24, change: '+12%' },
    winRate: { rate: '78.4%', change: '+2.1%' },
    pendingEvidence: { count: 8, timeframe: 'Due within next 48 hours' },
    atRiskVolume: { amount: 14205, formatted: '$14,205' },
  },
  disputesRequiringEvidence: [
    {
      id: 'DS-8812',
      amount: 1240.00,
      reasonCode: 'Product Not Received',
      status: 'CRITICAL',
      deadline: '2 days left',
      active: true,
    },
    {
      id: 'DS-8904',
      amount: 450.50,
      reasonCode: 'Fraudulent Transaction',
      status: 'WARNING',
      deadline: '5 days left',
      active: false,
    },
    {
      id: 'DS-9021',
      amount: 2100.00,
      reasonCode: 'Cancelled Subscription',
      status: 'PENDING',
      deadline: '12 days left',
      active: false,
    },
    {
      id: 'DS-9110',
      amount: 89.99,
      reasonCode: 'Duplicate Billing',
      status: 'PENDING',
      deadline: '14 days left',
      active: false,
    },
    {
      id: 'DS-9233',
      amount: 312.45,
      reasonCode: 'Credit Not Processed',
      status: 'PENDING',
      deadline: '21 days left',
      active: false,
    }
  ],
  submissionModule: {
    caseRef: 'DS-8812',
    reasonTitle: 'Required documents for Reason Code: Service Not Provided',
    progress: 40,
    checklist: [
      { id: 'chk-1', title: 'Proof of Delivery (Carrier Signature)', status: 'Attached', required: true, checked: true },
      { id: 'chk-2', title: 'Customer Communication Log', status: 'Attached', required: true, checked: true },
      { id: 'chk-3', title: 'Order Confirmation Email', status: 'Pending', required: true, checked: false },
      { id: 'chk-4', title: 'Refund Policy Agreement', status: 'Pending', required: false, checked: false },
      { id: 'chk-5', title: 'Inventory Stock Record', status: 'Pending', required: false, checked: false },
    ],
    attachedFiles: [
      { fileName: 'Shipping_Label_DS8812.pdf', type: 'PDF', size: '842 KB' },
      { fileName: 'ZenDesk_Chat_Log.pdf', type: 'PDF', size: '1.4 MB' },
    ]
  }
};

export const REPORTS_ANALYTICS_DATA = {
  kpis: {
    avgResolutionTime: { value: '4.2 min', change: '-12.5%', isPositive: true },
    autoResolutionRate: { value: '92.7%', change: '+4.1%', isPositive: true },
    falsePositiveRate: { value: '1.3%', change: '-0.4%', isPositive: true },
    merchantWinRate: { value: '38%', change: '+2.2%', isPositive: true },
  },
  monthlyVolume: [
    { month: 'Jan', volume: 1240, auto: 950, escalated: 60 },
    { month: 'Feb', volume: 1380, auto: 1020, escalated: 55 },
    { month: 'Mar', volume: 1100, auto: 1200, escalated: 70 },
    { month: 'Apr', volume: 1540, auto: 1080, escalated: 50 },
    { month: 'May', volume: 1420, auto: 1210, escalated: 65 },
    { month: 'Jun', volume: 1650, auto: 1430, escalated: 58 },
    { month: 'Jul', volume: 1620, auto: 1390, escalated: 52 },
  ],
  categoryBreakdown: [
    { category: 'Not Received', percentage: 54, count: 892, color: '#2563EB' },
    { category: 'Duplicate', percentage: 22, count: 363, color: '#3B82F6' },
    { category: 'Defective', percentage: 24, count: 396, color: '#94A3B8' },
  ],
  aiInsight: "Not Received' claims have spiked by 12% in the last cycle, predominantly from Tier 2 merchants. Recommend enabling auto-refute on verified delivery tracking.",
  auditExports: [
    { id: 'EXP-9921', reportName: 'Monthly Compliance Audit', format: 'PDF', generationDate: 'Oct 24, 2023', fileSize: '2.4 MB', status: 'Completed' },
    { id: 'EXP-9920', reportName: 'Merchant Win-Loss Analysis', format: 'CSV', generationDate: 'Oct 22, 2023', fileSize: '1.1 MB', status: 'Completed' },
    { id: 'EXP-9918', reportName: 'Quarterly Risk Assessment', format: 'PDF', generationDate: 'Oct 20, 2023', fileSize: '8.9 MB', status: 'Completed' },
    { id: 'EXP-9915', reportName: 'AI Resolution Efficiency', format: 'CSV', generationDate: 'Oct 18, 2023', fileSize: '450 KB', status: 'Completed' },
    { id: 'EXP-9912', reportName: 'Historical Dispute Log', format: 'PDF', generationDate: 'Oct 15, 2023', fileSize: '15.2 MB', status: 'Completed' },
  ] as AuditExportItem[]
};
