import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  History,
  MessageSquare,
  MoreVertical,
  UploadCloud,
  CheckCircle,
  XCircle,
  Zap,
  Info,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { fetchDisputeDetail, fetchEvidenceItems, scoreDisputeCase } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreGauge } from '../common/ScoreGauge';
import { ProgressBar } from '../common/ProgressBar';
import { EvidenceCard } from '../common/EvidenceCard';
import { EvidenceItem } from '../../types/dispute';
import { ToastMessage } from '../common/Toast';

interface CaseDetailScreenProps {
  disputeId?: string;
  onBack: () => void;
  onNavigateToOverride?: () => void;
  onNavigateToEvidenceReview?: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const CaseDetailScreen: React.FC<CaseDetailScreenProps> = ({
  disputeId = 'DSP-1041',
  onBack,
  onNavigateToOverride,
  onNavigateToEvidenceReview,
  onAddToast
}) => {
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [resolutionStatus, setResolutionStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  useEffect(() => {
    loadCaseData();
  }, [disputeId]);

  const loadCaseData = async () => {
    setLoading(true);
    const [detailRes, evidenceRes] = await Promise.all([
      fetchDisputeDetail(disputeId),
      fetchEvidenceItems(disputeId)
    ]);

    if (detailRes.data) setCaseDetails(detailRes.data);
    if (evidenceRes.data) setEvidenceList(evidenceRes.data);
    setIsBackendConnected(detailRes.isBackendConnected);
    setLoading(false);
  };

  const handleRunAiEvaluation = async () => {
    setScoring(true);
    onAddToast?.({
      type: 'info',
      title: 'Evaluating Model Scoring',
      message: 'Running Fair-Weighing ML engine against category rubric...'
    });

    const res = await scoreDisputeCase(disputeId);
    setScoring(false);

    if (res.data) {
      onAddToast?.({
        type: 'success',
        title: 'ML Inference Evaluated',
        message: 'Dispute confidence score and XAI rationale generated.'
      });
      loadCaseData();
    }
  };

  const handleManualUpload = () => {
    const newDoc: EvidenceItem = {
      id: `EV-${Date.now()}`,
      fileName: 'Carrier_Telematics_Log.pdf',
      type: 'PDF',
      fileSize: '620 KB',
      uploadedAt: 'Just now',
      uploadedBy: 'System',
      status: 'Parsed',
      tag: 'GPS Coordinates'
    };
    setEvidenceList([...evidenceList, newDoc]);
    onAddToast?.({ type: 'success', title: 'File Attached', message: 'Carrier_Telematics_Log.pdf added to evidence bucket.' });
  };

  if (loading || !caseDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Unified Case File & Evidence...</p>
      </div>
    );
  }

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
          <span className="text-slate-800 font-semibold">{caseDetails.id}</span>
          {!isBackendConnected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              OFFLINE FALLBACK
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToEvidenceReview && (
            <button
              onClick={onNavigateToEvidenceReview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>NLP Side-by-Side Review</span>
            </button>
          )}
          {onNavigateToOverride && (
            <button
              onClick={onNavigateToOverride}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Admin Override Console</span>
            </button>
          )}
        </div>
      </div>

      {/* Case Header & Deadline Banner */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {caseDetails.title}
          </h1>
          <StatusBadge status={caseDetails.status} />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Dispute initiated on {caseDetails.initiatedDate}. Deadline for resolution:{' '}
          <strong className="text-rose-600 font-bold">
            {caseDetails.deadline} ({caseDetails.deadlineDaysLeft} days left)
          </strong>
        </p>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cardholder Statement & Transaction Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Transaction Overview & Claim
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{caseDetails.transaction.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Disputed Sum</span>
                <span className="font-mono font-bold text-slate-900">${caseDetails.transaction.totalAmount.toFixed(2)} USD</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Member Account</span>
                <span className="font-mono text-slate-800">{caseDetails.transaction.memberName} ({caseDetails.transaction.memberAccount})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Merchant</span>
                <span className="font-bold text-slate-800">{caseDetails.transaction.merchant}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-blue-950">Cardholder Statement Narrative:</p>
              <p className="italic bg-white p-3 rounded-lg border border-blue-100">
                "{caseDetails.transaction.disputeReason}"
              </p>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Attached Polymorphic Evidence ({evidenceList.length} Files)
              </h2>
              <button
                onClick={handleManualUpload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Manual Proof</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidenceList.map((item) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  onView={() => onAddToast?.({ type: 'info', title: 'Document Lightbox', message: `Previewing ${item.fileName}` })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Score Intelligence */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Fair-Weighing ML Rating</h2>
              <button
                onClick={handleRunAiEvaluation}
                disabled={scoring}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scoring ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <ScoreGauge score={72} label="Confidence Score" recommendation="FAVOUR MEMBER" />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Factor Contribution</h3>
              <ProgressBar label="Carrier Tracking Delivery Proof" value={88} color="emerald" />
              <ProgressBar label="Member Account Credibility" value={94} color="emerald" />
              <ProgressBar label="Geospatial Delivery Coordinate Match" value={22} color="amber" />
              <ProgressBar label="Historical Merchant Dispute Ratio" value={65} color="blue" />
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" /> XAI Rationale Summary
              </p>
              <p className="text-[11px] leading-relaxed">
                Carrier tracking confirms delivery, but GPS telematics show parcel was dropped off 0.4 miles away from member address. High confidence recommendation to approve member refund.
              </p>
            </div>

            {/* Decision CTAs */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {resolutionStatus === 'accepted' ? (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
                  Dispute Accepted (Member Refunded)
                </div>
              ) : resolutionStatus === 'rejected' ? (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold text-center border border-rose-200">
                  Dispute Refuted (Merchant Upheld)
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setResolutionStatus('rejected');
                      onAddToast?.({ type: 'error', title: 'Dispute Refuted', message: 'Case status set to REJECTED.' });
                    }}
                    className="flex-1 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold text-slate-700 transition"
                  >
                    Refute Claim
                  </button>
                  <button
                    onClick={() => {
                      setResolutionStatus('accepted');
                      onAddToast?.({ type: 'success', title: 'Dispute Approved', message: 'Case status set to ACCEPTED.' });
                    }}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                  >
                    Approve Dispute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
