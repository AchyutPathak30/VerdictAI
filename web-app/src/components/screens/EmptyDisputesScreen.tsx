import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';

interface EmptyDisputesScreenProps {
  onRefresh?: () => void;
  onViewReports?: () => void;
}

export const EmptyDisputesScreen: React.FC<EmptyDisputesScreenProps> = ({
  onRefresh,
  onViewReports
}) => {
  return (
    <div className="max-w-3xl mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-md p-10 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          WEB-13: ZERO ACTIVE DISPUTES
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
          No Active Disputes — Revenue 100% Protected!
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Your merchant queue is completely clear. All transactions are currently undisputed, and your revenue is protected by VerdictAI real-time monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-xl mx-auto text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900">Fraud Protection</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Active</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900">Open SLA Claims</p>
          <p className="text-[10px] text-slate-500 mt-0.5">0 Cases Pending</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900">Win Recovery Rate</p>
          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">68.4% Average</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Dashboard</span>
          </button>
        )}
        {onViewReports && (
          <button
            onClick={onViewReports}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <BarChart2 className="w-4 h-4" />
            <span>View Historical Reports</span>
          </button>
        )}
      </div>
    </div>
  );
};
