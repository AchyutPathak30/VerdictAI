export type CaseStatus = 
  | 'Review Required' 
  | 'Evidence Pending' 
  | 'Escalated' 
  | 'Critical' 
  | 'Warning' 
  | 'Pending' 
  | 'Auto-Resolved' 
  | 'Closed';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CaseQueueItem {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  action: string;
  reason: string;
  filedDate?: string;
  deadline?: string;
  aiScore?: number;
}

export interface EvidenceItem {
  id: string;
  fileName: string;
  type: 'PDF' | 'CSV' | 'DOCX' | 'JPG' | 'LOG';
  fileSize: string;
  uploadedAt: string;
  uploadedBy: 'System' | 'Merchant' | 'Cardholder';
  status: 'Parsed' | 'Uploaded' | 'Missing' | 'In Review';
  tag?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: 'System AI' | 'Administrator' | 'Merchant' | 'Cardholder';
  action: string;
  timestamp: string;
  details: string;
  isAutomated?: boolean;
}

export interface ReasoningFactor {
  label: string;
  weight: number; // 0-100
  favors: 'merchant' | 'cardholder' | 'neutral';
}

export interface AuditExportItem {
  id: string;
  reportName: string;
  format: 'PDF' | 'CSV';
  generationDate: string;
  fileSize: string;
  status: 'Completed' | 'Processing';
}
