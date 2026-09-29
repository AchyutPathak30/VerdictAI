import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ACTIVE_CASE_QUEUE } from '../../data/mockData';
import { StatusBadge, RiskDot } from '../common/StatusBadge';
import { CaseQueueItem } from '../../types/dispute';

interface CaseQueueScreenProps {
  onSelectCase: (caseItem: CaseQueueItem) => void;
}

export const CaseQueueScreen: React.FC<CaseQueueScreenProps> = ({ onSelectCase }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredCases = ACTIVE_CASE_QUEUE.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.merchant.toLowerCase().includes(search.toLowerCase()) ||
      c.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Case Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized dispute intake and resolution worklist.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting all filtered cases to CSV...')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
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
            placeholder="Search Case ID, Merchant..."
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
        </div>
      </div>

      {/* Paginated Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
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
              {filteredCases.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectCase(item)}
                  className="hover:bg-slate-50 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-blue-600 group-hover:underline">
                    {item.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {item.filedDate}
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
                      {item.action} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1–{filteredCases.length} of 247 cases</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded border border-slate-200 hover:bg-white text-slate-400 hover:text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold">1</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-white text-slate-600">2</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 hover:bg-white text-slate-600">3</button>
            <button className="p-1 rounded border border-slate-200 hover:bg-white text-slate-400 hover:text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
