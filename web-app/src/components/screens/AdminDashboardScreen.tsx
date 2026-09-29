import React from 'react';
import {
  Download,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import { ADMIN_STATS, ACTIVE_CASE_QUEUE } from '../../data/mockData';
import { StatusBadge, RiskDot } from '../common/StatusBadge';
import { CaseQueueItem } from '../../types/dispute';

interface AdminDashboardScreenProps {
  onSelectCase: (caseItem: CaseQueueItem) => void;
  onViewAllQueue: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onSelectCase,
  onViewAllQueue,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Operational Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time dispute metrics and active case queue management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Run AI Batch</span>
          </button>
        </div>
      </div>

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
              {ADMIN_STATS.totalDisputes.value}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{ADMIN_STATS.totalDisputes.change}</span>
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
              {ADMIN_STATS.pendingReview.value}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{ADMIN_STATS.pendingReview.change}</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Auto-Resolved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auto-Resolved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {ADMIN_STATS.autoResolved.value}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{ADMIN_STATS.autoResolved.change}</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Escalated Cases */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Escalated Cases
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {ADMIN_STATS.escalatedCases.value}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{ADMIN_STATS.escalatedCases.change}</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Case Queue (Left) & Right Sidebar Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Case Queue (Span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Case Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized disputes awaiting administrator review.
              </p>
            </div>
            <button
              onClick={onViewAllQueue}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>View Full Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">CASE ID</th>
                  <th className="py-3 px-4">MERCHANT</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">RISK LEVEL</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACTIVE_CASE_QUEUE.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectCase(item)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-blue-600 group-hover:underline">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.merchant}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {item.currency}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        className="text-slate-400 group-hover:text-blue-600 font-semibold text-xs transition"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Recommendations & System Health */}
        <div className="space-y-6">
          {/* AI Recommendations Card */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 shadow-elevated relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 fill-current" />
              <span>AI RECOMMENDATIONS</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              14 Disputes Ready for Auto-Resolution
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Based on current evidence scoring, these cases match high-confidence victory patterns.
            </p>
            <button
              onClick={() => alert('Triggering automated AI resolution batch for 14 verified cases...')}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>RUN AUTO-PILOT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* System Health Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  SYSTEM HEALTH
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                STABLE
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-500 font-medium">AVG RESPONSE TIME</span>
                  <span className="text-slate-800 font-bold font-mono">1.4s</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-500 font-medium">EVIDENCE PROCESSING</span>
                  <span className="text-slate-800 font-bold font-mono">98.2%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-[98.2%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispute Resolution Trends */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              DISPUTE RESOLUTION TRENDS
            </h3>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>AUTO</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>ESCALATED</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Comparison of automated resolutions vs escalations.
          </p>

          {/* Bar chart representation */}
          <div className="h-48 flex items-end justify-between gap-3 px-2 pt-6 border-b border-slate-100 pb-2">
            {[
              { month: 'Jan', autoH: '65%', esc: '12%' },
              { month: 'Feb', autoH: '75%', esc: '10%' },
              { month: 'Mar', autoH: '90%', esc: '14%' },
              { month: 'Apr', autoH: '80%', esc: '11%' },
              { month: 'May', autoH: '85%', esc: '12%' },
              { month: 'Jun', autoH: '98%', esc: '15%' },
            ].map((col) => (
              <div key={col.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[42px] flex items-end justify-center relative h-full">
                  <div
                    style={{ height: col.autoH }}
                    className="w-full bg-emerald-500 rounded-t-md group-hover:bg-emerald-600 transition-all shadow-sm"
                  />
                  {/* Red dot marker for escalation */}
                  <div
                    style={{ bottom: col.esc }}
                    className="absolute w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full shadow-sm"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {col.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume by Merchant Segment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            VOLUME BY MERCHANT SEGMENT
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Distribution across enterprise and small-business tiers.
          </p>

          <div className="h-48 relative flex items-end">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              {/* Enterprise curve (amber) */}
              <path
                d="M 0,130 Q 125,140 250,20 T 500,100 L 500,160 L 0,160 Z"
                fill="rgba(245, 158, 11, 0.08)"
              />
              <path
                d="M 0,130 Q 125,140 250,20 T 500,100"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
              />

              {/* Small business curve (blue) */}
              <path
                d="M 0,90 Q 125,110 250,130 T 500,120"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>
      </div>
    </div>
  );
};
