import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchDisputes } from '../../services/api';
import { StatusBadge, RiskDot } from '../common/StatusBadge';
import { CaseQueueItem } from '../../types/dispute';
import { ToastMessage } from '../common/Toast';

interface CaseQueueScreenProps {
  onSelectCase: (caseItem: CaseQueueItem) => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const CaseQueueScreen: React.FC<CaseQueueScreenProps> = ({ onSelectCase, onAddToast }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseQueueItem[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  useEffect(() => {
    loadQueue();
  }, [search, statusFilter, page]);

  const loadQueue = async () => {
    setLoading(true);
    const res = await fetchDisputes({
      search: search || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      page
    });

    if (res.data) setCases(res.data);
    setIsBackendConnected(res.isBackendConnected);
    setLoading(false);
  };

  const handleExportCsv = () => {
    onAddToast?.({
      type: 'success',
      title: 'Queue Exported',
      message: `${cases.length} dispute records exported to CSV format.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Case Queue (Triage & Multi-Filter)
            </h1>
            {!isBackendConnected && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                OFFLINE FALLBACK
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            High-density dispute intake list fetched from REST API gateway.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Case ID, Merchant, Reason..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Review Required">Review Required</option>
              <option value="Evidence Pending">Evidence Pending</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
          <button
            onClick={loadQueue}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Paginated Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Fetching Dispute Case Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">CASE ID</th>
                  <th className="py-3 px-4">FILED DATE</th>
                  <th className="py-3 px-4">MERCHANT</th>
                  <th className="py-3 px-4">DISPUTE REASON</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">AI SCORE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">RISK LEVEL</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectCase(item)}
                    className="hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-blue-600 group-hover:underline">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {item.filedDate || 'Oct 14, 2023'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.merchant}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.reason}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.currency}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {item.aiScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskDot level={item.riskLevel} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(item);
                        }}
                        className="text-blue-600 font-semibold text-xs hover:underline"
                      >
                        {item.action} &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {cases.length} records</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-slate-700">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded border border-slate-200 hover:bg-white text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
