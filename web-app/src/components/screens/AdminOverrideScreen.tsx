import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  History,
  ExternalLink,
  CheckCircle2,
  Sliders,
  Loader2
} from 'lucide-react';
import { CHB_99281_OVERRIDE_DATA } from '../../data/mockData';
import { EvidenceCard } from '../common/EvidenceCard';
import { overrideDisputeDecision } from '../../services/api';
import { ToastMessage } from '../common/Toast';

interface AdminOverrideScreenProps {
  disputeId?: string;
  onBack: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminOverrideScreen: React.FC<AdminOverrideScreenProps> = ({
  disputeId = 'CHB-99281-DX',
  onBack,
  onAddToast
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>('FAVOR_CARDHOLDER');
  const [reasoning, setReasoning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const characterCount = reasoning.length;

  const handleCommit = async () => {
    if (!reasoning.trim() || reasoning.length < 10) {
      onAddToast?.({
        type: 'warning',
        title: 'Mandatory Reason Required',
        message: 'Override requires a detailed mandatory reason (at least 10 characters).'
      });
      return;
    }

    setIsSubmitting(true);
    const res = await overrideDisputeDecision(disputeId, {
      override_decision: selectedOutcome,
      mandatory_reason: reasoning,
      admin_id: 'adm_elena_01',
      admin_name: 'Elena Vance'
    });
    setIsSubmitting(false);

    if (res.data) {
      setIsSuccess(true);
      onAddToast?.({
        type: 'success',
        title: 'Decision Committed',
        message: 'Admin override logged immutably in cryptographic audit chain.'
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner: Low Confidence Warning */}
      <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 fill-slate-950 text-amber-500 shrink-0" />
          <span>⚠️ AI CONFIDENCE WARNING: AI Score Low (44%) – Manual Review Required for Case {disputeId}</span>
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
              {disputeId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>View Case History</span>
          </button>
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Conflict Points & Documents */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              AI Conflict Identification Summary
            </h2>
            <div className="space-y-3">
              {CHB_99281_OVERRIDE_DATA.keyConflictPoints.map((cp, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950">{cp.title}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">
                      {cp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{cp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Decision Engine Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-2 border-blue-600 rounded-xl p-6 shadow-md space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <Sliders className="w-4 h-4" />
              <span className="uppercase tracking-wider">Manual Decision Engine</span>
            </div>

            {isSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Override Decision Committed!</p>
                <p className="text-xs text-slate-600">
                  Decision successfully logged in tamper-evident cryptographic audit chain.
                </p>
                <button
                  onClick={onBack}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Return to Case Queue
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-900 block mb-2">Selected Outcome Target</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="outcome"
                        value="FAVOR_CARDHOLDER"
                        checked={selectedOutcome === 'FAVOR_CARDHOLDER'}
                        onChange={(e) => setSelectedOutcome(e.target.value)}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-bold text-slate-900">Validate & Approve Member Refund</p>
                        <p className="text-[11px] text-slate-500">Overturns automated fraud rejection</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="outcome"
                        value="FAVOR_MERCHANT"
                        checked={selectedOutcome === 'FAVOR_MERCHANT'}
                        onChange={(e) => setSelectedOutcome(e.target.value)}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-bold text-slate-900">Refute & Support Merchant</p>
                        <p className="text-[11px] text-slate-500">Upholds carrier tracking proof</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-900">Mandatory Written Justification</label>
                    <span className="text-[10px] text-slate-400">{characterCount} chars</span>
                  </div>
                  <textarea
                    rows={4}
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Enter detailed audit justification for manual override..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleCommit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Commit Override Decision</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
