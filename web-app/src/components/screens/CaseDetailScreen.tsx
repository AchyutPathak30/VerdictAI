import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  History,
  MessageSquare,
  MoreVertical,
  ExternalLink,
  UploadCloud,
  CheckCircle,
  XCircle,
  Zap,
  Info,
  ShieldAlert,
  Scale
} from 'lucide-react';
import { DSP_1041_DETAILS } from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreGauge } from '../common/ScoreGauge';
import { ProgressBar } from '../common/ProgressBar';
import { EvidenceCard } from '../common/EvidenceCard';
import { EvidenceItem } from '../../types/dispute';

interface CaseDetailScreenProps {
  onBack: () => void;
  onNavigateToOverride?: () => void;
}

export const CaseDetailScreen: React.FC<CaseDetailScreenProps> = ({
  onBack,
  onNavigateToOverride,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(DSP_1041_DETAILS.evidence);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleManualUpload = () => {
    const newDoc: EvidenceItem = {
      id: `EV-${Date.now()}`,
      fileName: 'Carrier_Telematics_Log.pdf',
      type: 'PDF',
      fileSize: '620 KB',
      uploadedAt: 'Oct 17, 2023',
      uploadedBy: 'System',
      status: 'Parsed',
      tag: 'GPS Coordinates'
    };
    setEvidenceList([...evidenceList, newDoc]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Case Queue</span>
          </button>
          <span>›</span>
          <span className="text-slate-800 font-semibold">{DSP_1041_DETAILS.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToOverride}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Log</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>Communication</span>
          </button>
          <button className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Case Header & Deadline Banner */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {DSP_1041_DETAILS.title}
          </h1>
          <StatusBadge status="Pending Review" />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Dispute initiated on {DSP_1041_DETAILS.initiatedDate}. Deadline for resolution:{' '}
          <strong className="text-rose-600 font-bold">
            {DSP_1041_DETAILS.deadline} ({DSP_1041_DETAILS.deadlineDaysLeft} days left)
          </strong>
        </p>
      </div>

      {/* Two-Column Grid: Left (Case Data & Evidence), Right (AI Intelligence) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Transaction Overview
                </h2>
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                ID: {DSP_1041_DETAILS.transaction.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Merchant</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {DSP_1041_DETAILS.transaction.merchant}
                </p>
                <p className="text-[11px] text-slate-400">
                  Merchant ID: {DSP_1041_DETAILS.transaction.merchantId}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Total Amount</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  ${DSP_1041_DETAILS.transaction.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-400">
                  {DSP_1041_DETAILS.transaction.currency} Currency
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Member Name</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {DSP_1041_DETAILS.transaction.memberName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Acc: {DSP_1041_DETAILS.transaction.memberAccount}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Txn Date</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {DSP_1041_DETAILS.transaction.txnDate}
                </p>
              </div>
            </div>

            {/* Dispute Reason Quote Box */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>DISPUTE REASON</span>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "{DSP_1041_DETAILS.transaction.disputeReason}"
              </p>
            </div>
          </div>

          {/* Merchant Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Merchant Profile
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-50/75 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  GLH
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-xs">
                      {DSP_1041_DETAILS.merchantProfile.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {DSP_1041_DETAILS.merchantProfile.tier}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Risk Rating</span>
                  <span className="font-bold text-emerald-600">
                    {DSP_1041_DETAILS.merchantProfile.riskRating}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Historical Dispute Rate</span>
                  <span className="font-bold text-slate-800">
                    {DSP_1041_DETAILS.merchantProfile.historicalDisputeRate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collected Evidence Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Collected Evidence
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {evidenceList.length} Files
                </span>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs font-medium">
                <button className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold">
                  Grid View
                </button>
                <button className="px-2.5 py-1 text-slate-500 hover:text-slate-800">
                  Details
                </button>
              </div>
            </div>

            {/* Evidence Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {evidenceList.map((item) => (
                <EvidenceCard
                  key={item.id}
                  fileName={item.fileName}
                  type={item.type}
                  fileSize={item.fileSize}
                  status={item.status}
                  onPreview={() => setSelectedEvidence(item)}
                />
              ))}

              {/* Upload Manual Slot */}
              <button
                onClick={handleManualUpload}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition group min-h-[140px]"
              >
                <UploadCloud className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                  Upload Manual
                </span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG &le; 25MB</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Resolution Intelligence Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Zap className="w-4 h-4 text-blue-600 fill-current" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Resolution Intelligence
            </h2>
          </div>

          {/* Radial Semi-Circle Gauge */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <ScoreGauge
              score={DSP_1041_DETAILS.aiScoring.score}
              label="FAVOUR MEMBER"
              favourText="MEMBER"
            />
          </div>

          {/* Primary Reasoning Factors */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>PRIMARY REASONING FACTORS</span>
            </div>
            <div className="space-y-3">
              {DSP_1041_DETAILS.aiScoring.factors.map((factor) => (
                <ProgressBar
                  key={factor.label}
                  label={factor.label}
                  value={factor.weight}
                  color={factor.weight > 70 ? 'green' : factor.weight > 40 ? 'blue' : 'amber'}
                />
              ))}
            </div>
          </div>

          {/* AI Narrative Summary Box */}
          <div className="border-l-4 border-blue-500 bg-blue-50/40 p-3.5 rounded-r-lg space-y-1.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              AI NARRATIVE SUMMARY
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {DSP_1041_DETAILS.aiScoring.narrativeSummary}
            </p>
          </div>

          {/* Recommendation Box */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Recommendation</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {DSP_1041_DETAILS.aiScoring.recommendation}
            </p>
          </div>

          {/* Actions Bar */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResolutionStatus('rejected')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Dispute</span>
              </button>
              <button
                onClick={() => setResolutionStatus('accepted')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Accept Dispute</span>
              </button>
            </div>

            <button
              onClick={() => {
                alert(`Case DSP-1041 resolved with status: ${resolutionStatus.toUpperCase()} and closed.`);
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Execute Resolution & Close Case</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center italic">
              Final action will be logged under administrator: {DSP_1041_DETAILS.aiScoring.assignedAdmin}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Lightbox for Evidence Preview */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">{selectedEvidence.fileName}</h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Simulated Secure Document Viewer</p>
              <div className="py-8 text-slate-400 font-mono text-xs">
                [Verified SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb924]
              </div>
              <p className="text-xs font-semibold text-emerald-600">
                ✓ Cryptographically Sealed & Verified by Audit Engine
              </p>
            </div>
            <button
              onClick={() => setSelectedEvidence(null)}
              className="w-full py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
