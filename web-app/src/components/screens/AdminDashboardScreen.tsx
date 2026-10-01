import React, { useState, useEffect } from 'react';
import {
  Download,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  Layers,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchDashboardStats, fetchDisputes } from '../../services/api';
import { StatusBadge, RiskDot } from '../common/StatusBadge';
import { CaseQueueItem } from '../../types/dispute';
import { ToastMessage } from '../common/Toast';

interface AdminDashboardScreenProps {
  onSelectCase: (caseItem: CaseQueueItem) => void;
  onViewAllQueue: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onSelectCase,
  onViewAllQueue,
  onAddToast
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [caseQueue, setCaseQueue] = useState<CaseQueueItem[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [statsRes, queueRes] = await Promise.all([
      fetchDashboardStats(),
      fetchDisputes({ page: 1 })
    ]);

    if (statsRes.data) setStats(statsRes.data);
    if (queueRes.data) setCaseQueue(queueRes.data.slice(0, 5));
    setIsBackendConnected(statsRes.isBackendConnected);
    setLoading(false);
  };

  const handleRunBatch = () => {
    onAddToast?.({
      type: 'info',
      title: 'AI Auto-Pilot Initiated',
      message: 'Processing straight-through disputes using Fair-Weighing scoring model...'
    });

    setTimeout(() => {
      onAddToast?.({
        type: 'success',
        title: 'Batch Complete',
        message: '14 low-risk cases automatically evaluated and resolved.'
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operational Overview
            </h1>
            {!isBackendConnected && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                OFFLINE FALLBACK
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time dispute metrics and active case queue management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleRunBatch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Run AI Batch</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Real-Time Dashboard Data...</p>
        </div>
      ) : (
        <>
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Disputes */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Disputes
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.totalDisputes?.value || '1,247'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{stats?.totalDisputes?.change || '+12.5%'}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Pending Review */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Review
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.pendingReview?.value || '38'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{stats?.pendingReview?.change || '-2.4%'}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Auto-Resolved */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Auto-Resolved Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.autoResolved?.value || '92.7%'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{stats?.autoResolved?.change || '+8.1%'}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Escalated Cases */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Escalated Cases
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.escalatedCases?.value || '53'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-purple-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{stats?.escalatedCases?.change || '+14.2%'}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Priority Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Priority Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Top urgent cases requiring dispute operations intervention</p>
              </div>
              <button
                onClick={onViewAllQueue}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
              >
                <span>View Full Queue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-5">Case ID</th>
                    <th className="p-3.5">Merchant</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Risk Level</th>
                    <th className="p-3.5 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {caseQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-5 font-mono font-bold text-blue-600">{item.id}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{item.merchant}</td>
                      <td className="p-3.5 text-slate-600">{item.reason}</td>
                      <td className="p-3.5 font-bold text-slate-900">${item.amount.toFixed(2)}</td>
                      <td className="p-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-3.5">
                        <RiskDot level={item.riskLevel} />
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => onSelectCase(item)}
                          className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          {item.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
