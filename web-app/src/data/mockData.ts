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
    merchant: 'Reliance Digital Retail Ltd',
    amount: 14999.00,
    currency: '₹',
    status: 'Review Required',
    riskLevel: 'Medium',
    action: 'Review',
    reason: 'Product Not Received',
    filedDate: '14 Oct 2026',
    deadline: '2 days left',
    aiScore: 87,
  },
  {
    id: 'DS-8942',
    merchant: 'Flipkart India Pvt Ltd',
    amount: 4499.00,
    currency: '₹',
    status: 'Evidence Pending',
    riskLevel: 'Low',
    action: 'View',
    reason: 'Fraudulent Transaction',
    filedDate: '13 Oct 2026',
    deadline: '5 days left',
    aiScore: 89,
  },
  {
    id: 'DS-8812',
    merchant: 'Taj Hotels & Resorts (IHCL)',
    amount: 28500.00,
    currency: '₹',
    status: 'Escalated',
    riskLevel: 'High',
    action: 'Override',
    reason: 'Service Not Provided',
    filedDate: '11 Oct 2026',
    deadline: '1 day left',
    aiScore: 44,
  },
  {
    id: 'DS-8755',
    merchant: 'Swiggy Instamart India',
    amount: 849.00,
    currency: '₹',
    status: 'Review Required',
    riskLevel: 'Low',
    action: 'Review',
    reason: 'Duplicate Charge',
    filedDate: '10 Oct 2026',
    deadline: '4 days left',
    aiScore: 61,
  },
  {
    id: 'DS-8701',
    merchant: 'Zomato Dining & Gold',
    amount: 1299.00,
    currency: '₹',
    status: 'Review Required',
    riskLevel: 'Medium',
    action: 'Review',
    reason: 'Wrong Item Delivered',
    filedDate: '09 Oct 2026',
    deadline: '6 days left',
    aiScore: 58,
  },
];

export const DSP_1041_DETAILS = {
  id: 'Case DSP-1041',
  title: 'Case DSP-1041 – Non-Delivery of Goods',
  status: 'Pending Review' as const,
  initiatedDate: '14 Oct 2026',
  deadline: '28 Oct 2026',
  deadlineDaysLeft: 4,
  transaction: {
    id: 'TXN-IN-882910',
    merchant: 'Croma Electronics India',
    merchantId: 'MID-IN-00441',
    totalAmount: 18999.00,
    currency: 'INR',
    txnDate: '12 Oct 2026 14:22:10 IST',
    memberName: 'Pooja Iyer',
    memberAccount: 'HDFC Bank RuPay **** 4492',
    disputeReason: "The package containing the OnePlus Tablet was never delivered to my residence at Indiranagar, Bengaluru. Blue Dart tracking marks it as 'Delivered', but society security logs and gate CCTV show no courier delivery occurred.",
  },
  merchantProfile: {
    name: 'Croma Electronics India (Infiniti Retail Ltd)',
    tier: 'Tier 1 • National Enterprise Merchant',
    riskRating: 'Low Risk (A+)',
    historicalDisputeRate: '0.28%',
  },
  evidence: [
    {
      id: 'EV-1',
      fileName: 'BlueDart_Courier_Delivery_POD.pdf',
      type: 'PDF',
      fileSize: '420 KB',
      uploadedAt: '14 Oct 2026',
      uploadedBy: 'System',
      status: 'Parsed',
      tag: 'Blue Dart GPS Telematics'
    },
    {
      id: 'EV-2',
      fileName: 'Croma_GST_Tax_Invoice.pdf',
      type: 'PDF',
      fileSize: '1.1 MB',
      uploadedAt: '15 Oct 2026',
      uploadedBy: 'Merchant',
      status: 'Uploaded',
      tag: 'GST Tax Invoice'
    },
    {
      id: 'EV-3',
      fileName: 'Delhivery_Dispatch_Manifest.csv',
      type: 'CSV',
      fileSize: '88 KB',
      uploadedAt: '14 Oct 2026',
      uploadedBy: 'Merchant',
      status: 'Parsed',
      tag: 'Hub Manifest'
    },
    {
      id: 'EV-4',
      fileName: 'Cardholder_Sworn_Declaration.docx',
      type: 'DOCX',
      fileSize: '156 KB',
      uploadedAt: '14 Oct 2026',
      uploadedBy: 'Cardholder',
      status: 'Uploaded',
      tag: 'Affidavit'
    },
    {
      id: 'EV-5',
      fileName: 'Society_Security_Gate_CCTV.jpg',
      type: 'JPG',
      fileSize: '2.4 MB',
      uploadedAt: '16 Oct 2026',
      uploadedBy: 'Cardholder',
      status: 'Uploaded',
      tag: 'Gate Security Proof'
    }
  ] as EvidenceItem[],
  aiScoring: {
    score: 87,
    favour: 'MEMBER' as const,
    factors: [
      { label: 'Merchant Blue Dart Delivery Proof Quality', weight: 88, favors: 'merchant' },
      { label: 'Card Member Account Credibility (HDFC Bank)', weight: 94, favors: 'cardholder' },
      { label: 'Geospatial Delivery Coordinate Match (Bengaluru)', weight: 22, favors: 'merchant' },
      { label: 'Historical Merchant Delivery Success Rate', weight: 65, favors: 'merchant' },
    ] as ReasoningFactor[],
    narrativeSummary: "AI evaluation identifies a critical geolocation discrepancy. While Blue Dart marks 'Delivered', the GPS latitude/longitude recorded is 0.7 km away from the cardholder's registered Indiranagar residence. Croma invoice is valid but carrier misdelivery is highly probable.",
    recommendation: "Uphold dispute in favor of the cardholder (Full refund ₹18,999.00 to HDFC account). Courier liability claim issued to Blue Dart Express.",
    assignedAdmin: "Sharma, P. (Lead Ops)",
  }
};

export const CHB_99281_OVERRIDE_DATA = {
  caseId: 'CHB-99281-DX',
  aiConfidence: 44.2,
  warningText: 'AI Score Low (44%) – Manual Review Required for Case CHB-99281-DX',
  transactionTotal: 24999.00,
  merchantName: 'Tata CLiQ Luxury India',
  keyConflictPoints: [
    {
      type: 'warning',
      title: 'Mismatched IP Geo-Location',
      desc: "UPI transaction originated from Mumbai, Maharashtra (IP: 103.21.244.2), while cardholder primary billing residence is registered in Bengaluru, Karnataka."
    },
    {
      type: 'warning',
      title: 'UPI Velocity Anomaly Trigger',
      desc: '3rd high-value RuPay debit attempt within 8 minutes from an unrecognized mobile IMEI fingerprint.'
    },
    {
      type: 'success',
      title: 'Bank 2FA Authorization',
      desc: 'RBI-mandated 2FA OTP verification succeeded via registered mobile SMS gateway (SBI Card).'
    }
  ],
  evidenceDocuments: [
    { fileName: 'TataCLiQ_GST_Invoice_7781.pdf', type: 'PDF', fileSize: '840 KB' },
    { fileName: 'Delhivery_Airway_Bill_A104.pdf', type: 'PDF', fileSize: '1.1 MB' },
    { fileName: 'WhatsApp_Customer_Support_Log.log', type: 'LOG', fileSize: '45 KB' },
  ],
  auditTrail: [
    {
      id: 'aud-1',
      actor: 'VerdictAI Automated Ingestion',
      actorRole: 'System AI',
      action: 'Initial Scoring',
      timestamp: '24 Oct 2026 • 09:12 AM IST',
      details: 'AI Score computed at 44% (High Risk Uncertainty Flagged)',
      isAutomated: true
    },
    {
      id: 'aud-2',
      actor: 'Rajesh Verma',
      actorRole: 'Senior Dispute Investigator',
      action: 'Evidence Review',
      timestamp: '24 Oct 2026 • 10:45 AM IST',
      details: 'Reviewed Delhivery AWB and customer SBI alert logs',
      isAutomated: false
    },
    {
      id: 'aud-3',
      actor: 'System Guardrail Engine',
      actorRole: 'System AI',
      action: 'Flagged for Human Override',
      timestamp: '24 Oct 2026 • 11:00 AM IST',
      details: 'Low confidence threshold triggered (< 50% cutoff, Rule FR-17)',
      isAutomated: true
    }
  ] as AuditLogEntry[],
  networkRisk: {
    similarCasesResolutionRate: '12.4%',
    merchantDisputeRatio: '0.82%'
  }
};

export const MERCHANT_PORTAL_DATA = {
  merchant: {
    name: 'Reliance Retail Ventures Ltd',
    tier: 'Enterprise Super-Merchant',
    merchantId: 'MID-IN-992031-RRVL',
    lastSync: '5 minutes ago',
  },
  stats: {
    activeDisputes: { count: 24, change: '+12%' },
    winRate: { rate: '78.4%', change: '+2.1%' },
    pendingEvidence: { count: 8, timeframe: 'Due within next 48 hours' },
    atRiskVolume: { amount: 142050, formatted: '₹1,42,050' },
  },
  disputesRequiringEvidence: [
    {
      id: 'DS-8812',
      amount: 28500.00,
      reasonCode: 'Product Not Received',
      status: 'CRITICAL',
      deadline: '2 days left',
      active: true,
    },
    {
      id: 'DS-8904',
      amount: 4500.50,
      reasonCode: 'Fraudulent Transaction',
      status: 'WARNING',
      deadline: '5 days left',
      active: false,
    },
    {
      id: 'DS-9021',
      amount: 14999.00,
      reasonCode: 'Cancelled Subscription',
      status: 'PENDING',
      deadline: '12 days left',
      active: false,
    },
    {
      id: 'DS-9110',
      amount: 899.00,
      reasonCode: 'Duplicate Billing',
      status: 'PENDING',
      deadline: '14 days left',
      active: false,
    },
    {
      id: 'DS-9233',
      amount: 3120.00,
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
      { id: 'chk-1', title: 'Blue Dart / Delhivery Proof of Delivery (POD Signature)', status: 'Attached', required: true, checked: true },
      { id: 'chk-2', title: 'GST Sales Tax Invoice & Packing Slip', status: 'Attached', required: true, checked: true },
      { id: 'chk-3', title: 'Customer WhatsApp / Email Support Transcript', status: 'Pending', required: true, checked: false },
      { id: 'chk-4', title: 'Store Cancellation & Return Policy Terms', status: 'Pending', required: false, checked: false },
      { id: 'chk-5', title: 'Warehouse CCTV Footage / Inventory Dispatch Slip', status: 'Pending', required: false, checked: false },
    ],
    attachedFiles: [
      { fileName: 'BlueDart_AWB_Signed_DS8812.pdf', type: 'PDF', size: '842 KB' },
      { fileName: 'Customer_WhatsApp_Support_Log.pdf', type: 'PDF', size: '1.4 MB' },
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
    { id: 'EXP-IN-9921', reportName: 'RBI Regulatory Compliance Audit (Chargebacks)', format: 'PDF', generationDate: '24 Oct 2026', fileSize: '2.4 MB', status: 'Completed' },
    { id: 'EXP-IN-9920', reportName: 'NPCI UPI & RuPay Dispute Trend Analysis', format: 'CSV', generationDate: '22 Oct 2026', fileSize: '1.1 MB', status: 'Completed' },
    { id: 'EXP-IN-9918', reportName: 'Quarterly Risk Assessment (Indian Banks)', format: 'PDF', generationDate: '20 Oct 2026', fileSize: '8.9 MB', status: 'Completed' },
    { id: 'EXP-IN-9915', reportName: 'AI Model Fair-Weighing Audit Ledger', format: 'CSV', generationDate: '18 Oct 2026', fileSize: '450 KB', status: 'Completed' },
    { id: 'EXP-IN-9912', reportName: 'Cryptographic Merkle Audit Trail Package', format: 'PDF', generationDate: '15 Oct 2026', fileSize: '15.2 MB', status: 'Completed' },
  ] as AuditExportItem[]
};

export const EVIDENCE_FILES = DSP_1041_DETAILS.evidence;
export const AUDIT_TRAIL = CHB_99281_OVERRIDE_DATA.auditTrail;
export const REASONING_FACTORS = DSP_1041_DETAILS.aiScoring.factors;
export const AUDIT_EXPORTS = REPORTS_ANALYTICS_DATA.auditExports;
