import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Tag,
  Loader2,
  RefreshCw,
  FileCheck,
  Layers
} from 'lucide-react';
import { fetchEvidenceItems, fetchDisputeDetail } from '../../services/api';
import { ToastMessage } from '../common/Toast';

interface EvidenceReviewScreenProps {
  disputeId?: string;
  onBack?: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const EvidenceReviewScreen: React.FC<EvidenceReviewScreenProps> = ({
  disputeId = 'DSP-1041',
  onBack,
  onAddToast
}) => {
  const [loading, setLoading] = useState(true);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  useEffect(() => {
    loadData();
  }, [disputeId]);

  const loadData = async () => {
    setLoading(true);
    const [caseRes, evidenceRes] = await Promise.all([
      fetchDisputeDetail(disputeId),
      fetchEvidenceItems(disputeId)
    ]);

    setCaseDetails(caseRes.data);
    setEvidenceItems(evidenceRes.data || []);
    setIsBackendConnected(caseRes.isBackendConnected);
    setLoading(false);
  };

  const nlpComparisons = [
    { field: 'Transaction Date', memberValue: 'Oct 12, 2023', merchantValue: 'Oct 12, 2023', match: true },
    { field: 'Disputed Amount', memberValue: '$1,249.50 USD', merchantValue: '$1,249.50 USD', match: true },
    { field: 'Delivery Address', memberValue: '742 Evergreen Terrace, Springfield', merchantValue: '742 Evergreen Terrace, Springfield', match: true },
    { field: 'Carrier Tracking Number', memberValue: 'TRK-981273941', merchantValue: 'TRK-981273941', match: true },
    { field: 'Product Description', memberValue: 'Cloud Subscription Plan', merchantValue: 'Premium Enterprise Cloud Tier', match: false, note: 'Tier naming variation detected' },
    { field: 'IP Geo-Location', memberValue: '192.168.1.1 (US-East)', merchantValue: '192.168.1.1 (US-East)', match: true },
    { field: 'Signature Confirmation', memberValue: 'Signed: S. Jenkins', merchantValue: 'Signed: S. Jenkins (Front Desk)', match: true }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Extracting NLP Evidence Models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                WEB-07: NLP EVIDENCE REVIEW
              </span>
              {!isBackendConnected && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  OFFLINE FALLBACK
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Side-by-Side Evidence Review: {caseDetails?.id || disputeId}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Parse NLP</span>
          </button>
          <button
            onClick={() => onAddToast?.({ type: 'success', title: 'Evidence Certified', message: 'Cryptographic SHA-256 hashes verified.' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Certify Extraction</span>
          </button>
        </div>
      </div>

      {/* Dual Column Evidence Ingestion Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Member Evidence Column */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h2 className="font-semibold text-slate-900 text-base">Card Member Submissions</h2>
            </div>
            <span className="text-xs font-medium text-slate-500">Uploaded via Mobile App</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">Member Statement Narrative:</p>
            <p className="italic bg-white p-2.5 rounded-lg border border-slate-200">
              "{caseDetails?.transaction?.disputeReason || 'The package was never received at my residence.'}"
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attached Proof Documents</h3>
            {evidenceItems.filter(e => e.uploadedBy === 'Cardholder' || e.uploadedBy === 'System').map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                    {file.type}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{file.fileName}</p>
                    <p className="text-[10px] text-slate-500">{file.fileSize} • Uploaded {file.uploadedAt}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Evidence Column */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <h2 className="font-semibold text-slate-900 text-base">Merchant Counter-Proof</h2>
            </div>
            <span className="text-xs font-medium text-emerald-600 font-semibold">Submitted (SLA Met)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-indigo-950">Merchant Fulfillment Note:</p>
            <p className="italic bg-white p-2.5 rounded-lg border border-indigo-100">
              "Carrier tracking status shows delivered with signature confirmation at front door."
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant Uploaded Records</h3>
            {evidenceItems.filter(e => e.uploadedBy === 'Merchant').map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                    {file.type}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{file.fileName}</p>
                    <p className="text-[10px] text-slate-500">{file.fileSize} • Uploaded {file.uploadedAt}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NLP Extraction Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">NLP Entity Extraction & Discrepancy Matrix</h2>
              <p className="text-xs text-slate-500">Automated entity alignment comparing member testimony against merchant invoices</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            OCR Confidence: 99.4%
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5">Extracted Entity Field</th>
                <th className="p-3.5">Card Member Evidence Value</th>
                <th className="p-3.5">Merchant Submission Value</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nlpComparisons.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-semibold text-slate-900">{row.field}</td>
                  <td className="p-3.5 text-slate-700 font-mono text-[11px]">{row.memberValue}</td>
                  <td className="p-3.5 text-slate-700 font-mono text-[11px]">{row.merchantValue}</td>
                  <td className="p-3.5 text-center">
                    {row.match ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> MATCHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={row.note}>
                        <AlertCircle className="w-3 h-3" /> VARIATION
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
