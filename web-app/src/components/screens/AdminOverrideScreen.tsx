import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  History,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { CHB_99281_OVERRIDE_DATA } from '../../data/mockData';
import { EvidenceCard } from '../common/EvidenceCard';

interface AdminOverrideScreenProps {
  onBack: () => void;
}

export const AdminOverrideScreen: React.FC<AdminOverrideScreenProps> = ({ onBack }) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>('validate');
  const [reasoning, setReasoning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const characterCount = reasoning.length;
  const maxCharacters = 500;

  const handleCommit = () => {
    if (!reasoning.trim()) {
      alert('Mandatory decision reasoning is required for regulatory audit compliance.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner: Low Confidence Warning */}
      <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 fill-slate-950 text-amber-500 shrink-0" />
          <span>{CHB_99281_OVERRIDE_DATA.warningText}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-400 px-2.5 py-1 rounded">
          ACTION REQUIRED
        </span>
      </div>

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Disputes</span>
            <span>›</span>
            <span>Case Queue</span>
            <span>›</span>
            <span className="text-slate-600 font-semibold">Admin Override Console</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Manual Decision Override
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              {CHB_99281_OVERRIDE_DATA.caseId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>View Case History</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition">
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Merchant Profile</span>
          </button>
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): AI Conflict Points, Evidence, Audit Trail */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Evidence Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>AI Evidence Summary</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                Confidence: {CHB_99281_OVERRIDE_DATA.aiConfidence}%
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                KEY CONFLICT POINTS
              </span>

              {CHB_99281_OVERRIDE_DATA.keyConflictPoints.map((point, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-xs flex gap-3 ${
                    point.type === 'warning'
                      ? 'bg-rose-50/50 border-rose-200 text-slate-800'
                      : 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {point.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-semibold">
                      {point.title}:
                    </strong>
                    <span className="text-slate-600 leading-relaxed">
                      {point.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Related Evidence Documents */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                RELATED EVIDENCE DOCUMENTS
              </span>
              <div className="grid grid-cols-3 gap-3">
                {CHB_99281_OVERRIDE_DATA.evidenceDocuments.map((doc, idx) => (
                  <EvidenceCard
                    key={idx}
                    fileName={doc.fileName}
                    type={doc.type}
                    fileSize={doc.fileSize}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Override Audit Trail */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Override Audit Trail
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Historical log of all interactions with this case override request.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">USER / ENTITY</th>
                    <th className="py-2.5 px-3">ACTION</th>
                    <th className="py-2.5 px-3">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CHB_99281_OVERRIDE_DATA.auditTrail.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {log.actor}
                        </div>
                        {log.isAutomated && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded">
                            Automated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 block">{log.action}</span>
                        <span className="text-[11px] text-slate-400">{log.details}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Manual Decision Engine */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4" />
              <span>MANUAL DECISION ENGINE</span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Final Determination
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Select the outcome for Case {CHB_99281_OVERRIDE_DATA.caseId}. This action is final and will update the dispute status across all platforms.
              </p>
            </div>

            {/* Case Amount & Merchant Strip */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  TRANSACTION TOTAL
                </span>
                <p className="text-base font-extrabold text-slate-900 font-mono">
                  ${CHB_99281_OVERRIDE_DATA.transactionTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  MERCHANT NAME
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {CHB_99281_OVERRIDE_DATA.merchantName}
                </p>
              </div>
            </div>

            {/* Radio Outcomes */}
            <div className="mt-5 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Outcome
              </span>

              {/* Option 1 */}
              <label
                onClick={() => setSelectedOutcome('validate')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  selectedOutcome === 'validate'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  checked={selectedOutcome === 'validate'}
                  onChange={() => setSelectedOutcome('validate')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Validate & Approve</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Accept merchant evidence; refute the cardholder dispute.
                  </p>
                </div>
              </label>

              {/* Option 2 */}
              <label
                onClick={() => setSelectedOutcome('escalate')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  selectedOutcome === 'escalate'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  checked={selectedOutcome === 'escalate'}
                  onChange={() => setSelectedOutcome('escalate')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Escalate & Refute</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Identify fraud markers; approve the cardholder refund.
                  </p>
                </div>
              </label>

              {/* Option 3 */}
              <label
                onClick={() => setSelectedOutcome('external')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  selectedOutcome === 'external'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  checked={selectedOutcome === 'external'}
                  onChange={() => setSelectedOutcome('external')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    <span>External Verification Required</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Request additional documentation from the merchant bank.
                  </p>
                </div>
              </label>
            </div>

            {/* Mandatory Decision Reasoning Textarea */}
            <div className="mt-5">
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="font-bold text-slate-700">
                  Decision Reasoning <strong className="text-rose-500">*</strong>
                </span>
                <span className="text-slate-400 font-mono">
                  {characterCount} / {maxCharacters} CHARACTERS
                </span>
              </div>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value.slice(0, maxCharacters))}
                rows={4}
                placeholder="Explain the logic behind this override. Cite specific evidence items (e.g., EV-2 mismatch). Mandatory for audit compliance."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 italic mt-1 leading-normal">
                All reasoning is shared with the merchant and financial regulators during arbitration.
              </p>
            </div>

            {/* Commit Button */}
            <div className="mt-5 space-y-2">
              <button
                disabled={!reasoning.trim() || isSubmitting}
                onClick={handleCommit}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition shadow-sm ${
                  reasoning.trim() && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Recording Immutable Audit Override...' : 'Commit Override Decision'}
              </button>

              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Action will be logged to Marcus Chen (ID: 9921)</span>
              </p>
            </div>

            {isSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
                ✓ Override successfully committed and hashed into Merkle audit log!
              </div>
            )}
          </div>

          {/* Network Risk Comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              NETWORK RISK COMPARISON
            </h3>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500 font-medium">Similar Cases Resolution Rate</span>
                <span className="font-bold text-slate-800 font-mono">12.4%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-[12.4%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500 font-medium">Merchant Dispute Ratio (Monthly)</span>
                <span className="font-bold text-rose-600 font-mono">1.82%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[45%]" />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 cursor-pointer hover:underline flex items-center gap-1 pt-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why is the dispute ratio highlighted?</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
