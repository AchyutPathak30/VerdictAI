import React, { useState } from 'react';
import {
  Store,
  Download,
  Plus,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UploadCloud,
  ChevronRight,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
  Lightbulb
} from 'lucide-react';
import { MERCHANT_PORTAL_DATA } from '../../data/mockData';
import { EvidenceCard } from '../common/EvidenceCard';

export const MerchantPortalScreen: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DS-8812');
  const [certified, setCertified] = useState<boolean>(true);
  const [checklist, setChecklist] = useState(MERCHANT_PORTAL_DATA.submissionModule.checklist);
  const [attachedFiles, setAttachedFiles] = useState(MERCHANT_PORTAL_DATA.submissionModule.attachedFiles);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleToggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleFileUpload = () => {
    const newFile = {
      fileName: 'Customer_Signature_Proof.pdf',
      type: 'PDF',
      size: '1.2 MB'
    };
    setAttachedFiles([...attachedFiles, newFile]);
  };

  const handleSubmitEvidence = () => {
    if (!certified) {
      alert('Please certify that the evidence documents are authentic.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMessage(`Evidence for Case ${selectedCaseId} submitted successfully to DisputeOps.`);
    }, 700);
  };

  const filteredDisputes = MERCHANT_PORTAL_DATA.disputesRequiringEvidence.filter((d) =>
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reasonCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Merchant Profile Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            GRG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {MERCHANT_PORTAL_DATA.merchant.name}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {MERCHANT_PORTAL_DATA.merchant.tier}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Merchant ID: <strong className="text-slate-600 font-mono">{MERCHANT_PORTAL_DATA.merchant.merchantId}</strong> • Last sync: {MERCHANT_PORTAL_DATA.merchant.lastSync}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Quarterly Report</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
            <Plus className="w-3.5 h-3.5" />
            <span>Submit New Dispute</span>
          </button>
        </div>
      </div>

      {/* 4 Merchant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Disputes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Disputes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {MERCHANT_PORTAL_DATA.stats.activeDisputes.count}
            </span>
            <span className="text-xs font-bold text-rose-600">
              {MERCHANT_PORTAL_DATA.stats.activeDisputes.change}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate merchant attention</p>
        </div>

        {/* Win Rate (MTD) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Win Rate (MTD)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {MERCHANT_PORTAL_DATA.stats.winRate.rate}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {MERCHANT_PORTAL_DATA.stats.winRate.change}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Increase vs. previous month baseline</p>
        </div>

        {/* Pending Evidence */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Evidence
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {MERCHANT_PORTAL_DATA.stats.pendingEvidence.count} Cases
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{MERCHANT_PORTAL_DATA.stats.pendingEvidence.timeframe}</p>
        </div>

        {/* At Risk Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              At Risk Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {MERCHANT_PORTAL_DATA.stats.atRiskVolume.formatted}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total disputed funds in current cycle</p>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (Disputes Table) & Right (Submission Module) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Disputes Requiring Evidence */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Disputes Requiring Evidence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and provide documentation to fight chargebacks.
              </p>

              {/* Search filter input */}
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Case ID..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredDisputes.map((dispute) => {
                const isSelected = selectedCaseId === dispute.id;
                let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
                if (dispute.status === 'CRITICAL') {
                  badgeStyle = 'bg-red-50 text-red-700 border-red-300 font-bold';
                } else if (dispute.status === 'WARNING') {
                  badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
                }

                return (
                  <div
                    key={dispute.id}
                    onClick={() => setSelectedCaseId(dispute.id)}
                    className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between relative ${
                      isSelected ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-600">
                          {dispute.id}
                        </span>
                        <span className="font-mono font-semibold text-xs text-slate-900">
                          ${dispute.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {dispute.reasonCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${badgeStyle}`}>
                          {dispute.status}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{dispute.deadline}</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Showing 5 of 12 urgent cases</span>
              <button className="text-blue-600 hover:underline font-semibold">
                View All Disputes
              </button>
            </div>
          </div>

          {/* Evidence Quality Tips Box */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex gap-3 text-xs">
            <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 block font-bold mb-1">
                Evidence Quality Tips
              </strong>
              <p className="text-slate-600 leading-relaxed">
                High-resolution signature captures from shipping partners increase win rates by <strong>34%</strong>. Ensure the customer's full name is visible on the order confirmation document.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Evidence Submission Module */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
            {/* Header Module Strip */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  SUBMISSION MODULE
                </span>
                <h2 className="text-base font-bold text-white">
                  Evidence Submission
                </h2>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-800 px-3 py-1 rounded-md text-slate-200 border border-slate-700">
                Case Ref: {selectedCaseId}
              </span>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-500 font-medium">
                {MERCHANT_PORTAL_DATA.submissionModule.reasonTitle}
              </p>

              {/* Documentation Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 font-semibold">Documentation Progress</span>
                  <span className="font-mono font-bold text-blue-600">40%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[40%]" />
                </div>
              </div>

              {/* Requirement Checklist */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  REQUIREMENT CHECKLIST
                </span>
                <div className="space-y-2 text-xs">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                        <span className={`font-medium ${item.checked ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                          {item.title} {item.required && <strong className="text-rose-500">*</strong>}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.status === 'Attached'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Evidence Drop Zone */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  UPLOAD EVIDENCE
                </span>
                <div
                  onClick={handleFileUpload}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-sm">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Drag and drop files here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supported: PDF, JPG, PNG (Max 10MB each)
                  </p>
                  <button className="mt-3 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-sm hover:bg-slate-50 transition">
                    Browse Local Files
                  </button>
                </div>
              </div>

              {/* Currently Attached Files */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  CURRENTLY ATTACHED ({attachedFiles.length})
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {attachedFiles.map((file, idx) => (
                    <EvidenceCard
                      key={idx}
                      fileName={file.fileName}
                      type={file.type}
                      fileSize={file.size}
                    />
                  ))}
                </div>
              </div>

              {/* Certification Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={certified}
                  onChange={(e) => setCertified(e.target.checked)}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-600 leading-relaxed">
                  I certify that these documents are authentic and related specifically to Case <strong>{selectedCaseId}</strong>. Inaccurate submissions may affect account standing.
                </span>
              </label>

              {/* Bottom Action Controls */}
              <div className="flex items-center justify-between pt-2">
                <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm">
                  Save Draft
                </button>
                <button
                  onClick={handleSubmitEvidence}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  {isSubmitting ? 'Submitting to DisputeOps...' : 'Submit To DisputeOps'}
                </button>
              </div>

              {submittedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
                  ✓ {submittedMessage}
                </div>
              )}
            </div>

            {/* Sub-footer inside submission card */}
            <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="cursor-pointer hover:underline">Documentation Guide</span>
                <span>•</span>
                <span className="cursor-pointer hover:underline">Network Regulations</span>
              </div>
              <span className="cursor-pointer hover:underline">Dismiss Module ✕</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
