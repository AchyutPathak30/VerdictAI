import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  PlusCircle,
  X,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { fetchDisputes, createDispute } from '../../services/api';
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

  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTxn, setIngestTxn] = useState('txn_reliance_28500');
  const [ingestReason, setIngestReason] = useState('PRODUCT_DAMAGED_OR_DEFECTIVE');
  const [ingestAmount, setIngestAmount] = useState('28500');
  const [ingestStatement, setIngestStatement] = useState('Screen damaged upon delivery; box arrived pierced by courier.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIngestNewDispute = async () => {
    setIsSubmitting(true);
    const amt = parseFloat(ingestAmount) || 18999;
    const res = await createDispute({
      transaction_id: ingestTxn,
      cardholder_id: 'usr_pooja_01',
      dispute_reason: ingestReason,
      disputed_amount: amt,
      cardholder_statement: ingestStatement,
      merchant_sla_hours: 48
    });
    setIsSubmitting(false);
    setIsIngestModalOpen(false);

    onAddToast?.({
      type: 'success',
      title: 'Dispute Ingested to Queue',
      message: `New dispute registered under ${res.data?.header?.dispute_id?.slice(0, 8) || 'active case'} with 48h SLA.`
    });
    loadQueue();
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Ingest New Case</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
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
                      {item.currency}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

      {/* Ingest Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ingest New Dispute Case</h3>
                  <p className="text-[11px] text-slate-400">Registers cardholder claim into FastAPI triage queue</p>
                </div>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick 1-Click Presets:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIngestTxn('txn_reliance_28500');
                    setIngestReason('PRODUCT_DAMAGED_OR_DEFECTIVE');
                    setIngestAmount('28500');
                    setIngestStatement('Reliance Digital LED TV screen shattered upon unboxing; technician verified delivery transit damage.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    ingestTxn === 'txn_reliance_28500' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Reliance Digital (₹28,500)</p>
                  <p className="text-[10px] text-slate-500">Damaged Goods</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIngestTxn('txn_flipkart_4599');
                    setIngestReason('INCORRECT_AMOUNT_CHARGED');
                    setIngestAmount('4599');
                    setIngestStatement('Flipkart order billed ₹4,599 instead of promo price ₹3,199 displayed at checkout.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    ingestTxn === 'txn_flipkart_4599' ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Flipkart India (₹4,599)</p>
                  <p className="text-[10px] text-slate-500">Incorrect Amount</p>
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={ingestTxn}
                  onChange={(e) => setIngestTxn(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={ingestAmount}
                    onChange={(e) => setIngestAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Dispute Reason</label>
                  <select
                    value={ingestReason}
                    onChange={(e) => setIngestReason(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="PRODUCT_DAMAGED_OR_DEFECTIVE">Product Damaged / Defective</option>
                    <option value="PRODUCT_NOT_RECEIVED">Product Not Received</option>
                    <option value="DUPLICATE_PROCESSING">Duplicate Processing</option>
                    <option value="INCORRECT_AMOUNT_CHARGED">Incorrect Amount</option>
                    <option value="FRAUD_UNRECOGNIZED_CHARGE">Fraudulent / Unrecognized</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cardholder Statement</label>
                <textarea
                  rows={2}
                  value={ingestStatement}
                  onChange={(e) => setIngestStatement(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsIngestModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestNewDispute}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition text-xs flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Submit to Live Queue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
