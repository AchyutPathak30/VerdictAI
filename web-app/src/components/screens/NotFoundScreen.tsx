import React from 'react';
import { AlertTriangle, Home, ArrowLeft, Search, ShieldCheck } from 'lucide-react';

interface NotFoundScreenProps {
  onReturnHome?: () => void;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({ onReturnHome }) => {
  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-md p-10 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
          WEB-14: 404 PAGE NOT FOUND
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
          Requested Dispute Resource Not Found
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The requested case file or screen URL does not exist or has been archived. Rest assured, your merchant data and active disputes remain completely secure.
        </p>
      </div>

      <div className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search for a specific case ID (e.g., DSP-1041)..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>ERROR CODE: 404_NOT_FOUND</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Gateway Operational
        </span>
      </div>
    </div>
  );
};
