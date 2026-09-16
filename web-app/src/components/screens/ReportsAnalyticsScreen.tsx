import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Clock,
  Zap,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileText,
  CheckCircle2,
  MoreVertical,
  Activity,
  Lightbulb
} from 'lucide-react';
import { REPORTS_ANALYTICS_DATA } from '../../data/mockData';

export const ReportsAnalyticsScreen: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [category, setCategory] = useState('All Categories');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredExports = REPORTS_ANALYTICS_DATA.auditExports.filter((item) =>
    item.reportName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Live Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strategic performance insights and compliance audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700">
          <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Live Sync: Active</span>
        </div>
      </div>

      {/* Filter Strip Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Range:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option>Last 30 Days</option>
                <option>This Quarter</option>
                <option>Year to Date</option>
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option>All Categories</option>
                <option>Not Received</option>
                <option>Duplicate Charge</option>
                <option>Defective Product</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(`Filters applied: ${dateRange}, ${category}`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition uppercase tracking-wider"
          >
            Apply Filters
          </button>
          <button
            onClick={() => alert('Exporting comprehensive report payload...')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report ▾</span>
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Resolution Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowDownRight className="w-3 h-3" />
              {REPORTS_ANALYTICS_DATA.kpis.avgResolutionTime.change}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-3">
            AVG RESOLUTION TIME
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {REPORTS_ANALYTICS_DATA.kpis.avgResolutionTime.value}
          </span>
        </div>

        {/* Auto-Resolution Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {REPORTS_ANALYTICS_DATA.kpis.autoResolutionRate.change}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-3">
            AUTO-RESOLUTION RATE
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {REPORTS_ANALYTICS_DATA.kpis.autoResolutionRate.value}
          </span>
        </div>

        {/* False Positive Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowDownRight className="w-3 h-3" />
              {REPORTS_ANALYTICS_DATA.kpis.falsePositiveRate.change}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-3">
            FALSE POSITIVE RATE
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {REPORTS_ANALYTICS_DATA.kpis.falsePositiveRate.value}
          </span>
        </div>

        {/* Merchant Win Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {REPORTS_ANALYTICS_DATA.kpis.merchantWinRate.change}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-3">
            MERCHANT WIN RATE
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {REPORTS_ANALYTICS_DATA.kpis.merchantWinRate.value}
          </span>
        </div>
      </div>

      {/* Middle Grid: Monthly Dispute Volume & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Dispute Volume (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              MONTHLY DISPUTE VOLUME
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
              UNIT: COUNT
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Aggregate chargeback volume trends over the last 6 months.
          </p>

          {/* Bar Chart Representation */}
          <div className="h-52 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2">
            {REPORTS_ANALYTICS_DATA.monthlyVolume.map((item) => {
              const heightPercent = `${(item.volume / 1800) * 100}%`;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {item.volume}
                  </span>
                  <div className="w-full max-w-[48px] flex items-end justify-center h-full">
                    <div
                      style={{ height: heightPercent }}
                      className="w-full bg-blue-600 rounded-t-md group-hover:bg-blue-700 transition-all shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Dispute Volume</span>
          </div>
        </div>

        {/* Dispute Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              DISPUTE CATEGORY BREAKDOWN
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Distribution by reason code category.
            </p>

            <div className="space-y-4">
              {REPORTS_ANALYTICS_DATA.categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cat.percentage}%</span>
                      <span className="text-[10px] text-slate-400">({cat.count} CASES)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight Box */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex gap-3">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block mb-1">
                AI INSIGHT
              </span>
              <p className="text-slate-600 leading-relaxed">
                "{REPORTS_ANALYTICS_DATA.aiInsight}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Exports */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent Audit Exports
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical log of all data extractions for compliance purposes.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">REPORT ID</th>
                <th className="py-3 px-4">REPORT NAME</th>
                <th className="py-3 px-4">FORMAT</th>
                <th className="py-3 px-4">GENERATION DATE</th>
                <th className="py-3 px-4">FILE SIZE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-blue-600">
                    {report.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {report.reportName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                      report.format === 'PDF'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {report.format}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {report.generationDate}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {report.fileSize}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => alert(`Downloading compliance report ${report.id} (${report.format})...`)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Download report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
