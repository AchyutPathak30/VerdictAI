import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Clock,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileText,
  CheckCircle2,
  Activity,
  Lightbulb,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchAuditReports } from '../../services/api';
import { ToastMessage } from '../common/Toast';

interface ReportsAnalyticsScreenProps {
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ReportsAnalyticsScreen: React.FC<ReportsAnalyticsScreenProps> = ({ onAddToast }) => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [category, setCategory] = useState('All Categories');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    const res = await fetchAuditReports();
    if (res.data) setReportData(res.data);
    setIsBackendConnected(res.isBackendConnected);
    setLoading(false);
  };

  const handleExportPackage = (name: string) => {
    onAddToast?.({
      type: 'success',
      title: 'Report Download Started',
      message: `Downloading audit package ${name}...`
    });
  };

  const exportsList = reportData?.exports || [];
  const filteredExports = exportsList.filter((item: any) =>
    item.reportName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Live Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports & Compliance Analytics
            </h1>
            {!isBackendConnected && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                OFFLINE FALLBACK
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strategic performance metrics, audit compliance summaries, and export packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Audit Chain: Verified 100%</span>
          </div>
        </div>
      </div>

      {/* Filter Strip Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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

        <button
          onClick={() => handleExportPackage('Full_Compliance_Summary.pdf')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Master Audit Report</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Generating Audit Reports & KPI Summary...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Resolution Time</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block">4.2 min</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> -12.5% vs benchmark
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Auto-Resolution Rate</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block">92.7%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +4.1% STP rate
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">False Positive Rate</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block">1.3%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Beats NFR-14 &lt; 2% target
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Merchant Win Rate</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-2 block">38.0%</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.2% recovery improvement
              </span>
            </div>
          </div>

          {/* Downloadable Audit Exports */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Downloadable Audit Packages</h2>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search export package..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">REPORT ID</th>
                    <th className="py-3 px-4">PACKAGE NAME</th>
                    <th className="py-3 px-4">FORMAT</th>
                    <th className="py-3 px-4">GENERATED DATE</th>
                    <th className="py-3 px-4">FILE SIZE</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExports.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.reportName}</td>
                      <td className="py-3 px-4 font-bold text-slate-600">{item.format}</td>
                      <td className="py-3 px-4 text-slate-500">{item.generationDate}</td>
                      <td className="py-3 px-4 text-slate-500">{item.fileSize}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleExportPackage(item.reportName)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 rounded transition"
                        >
                          Download &darr;
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
