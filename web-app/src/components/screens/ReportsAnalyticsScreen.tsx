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
  RefreshCw,
  ShieldCheck,
  Shield,
  KeyRound,
  ExternalLink,
  X,
  Copy,
  Check
} from 'lucide-react';
import { fetchAuditReports } from '../../services/api';
import { ToastMessage } from '../common/Toast';
import { REPORTS_ANALYTICS_DATA, AUDIT_EXPORTS } from '../../data/mockData';
import { BarChart, BarSeries } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { MiniSparkline } from '../charts/MiniSparkline';

interface ReportsAnalyticsScreenProps {
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ReportsAnalyticsScreen: React.FC<ReportsAnalyticsScreenProps> = ({ onAddToast }) => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [category, setCategory] = useState('All Categories');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [copiedRoot, setCopiedRoot] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange, category]);

  const loadReports = async () => {
    setLoading(true);
    const res = await fetchAuditReports();
    if (res.data) setReportData(res.data);
    setIsBackendConnected(res.isBackendConnected);
    setTimeout(() => {
      setLoading(false);
    }, 350);
  };

  const handleRefreshClick = () => {
    loadReports();
    onAddToast?.({
      type: 'info',
      title: 'Audit Analytics Refreshed',
      message: 'Synchronized with latest ledger transactions and Fair-Weighing ML statistics.'
    });
  };

  const handleExportPackage = (itemOrName: any) => {
    const reportName = typeof itemOrName === 'string' ? itemOrName : itemOrName.reportName;
    const format = typeof itemOrName === 'string'
      ? (reportName.endsWith('.csv') ? 'CSV' : 'PDF')
      : (itemOrName.format || 'PDF');
    const reportId = typeof itemOrName === 'object' ? itemOrName.id : 'EXP-IN-9921';

    let content = '';
    let mimeType = 'text/plain';
    const fileExtension = format.toLowerCase();

    if (format === 'CSV') {
      mimeType = 'text/csv';
      content = `REPORT_ID,TRANSACTION_ID,MERCHANT,CATEGORY,DISPUTED_SUM_INR,STP_SCORE,DECISION,TIMESTAMP,RBI_COMPLIANCE_STATUS,MERKLE_ROOT\n` +
        `${reportId},TXN-882910,Croma Electronics India,Non-Delivery of Goods,18999.00,87,APPROVED_CUSTOMER,2026-10-14 15:42:18,RBI_DPSS_COMPLIANT,0x7f9a2b8c4d1e3a6f\n` +
        `${reportId},TXN-104200,Swiggy Instamart,Duplicate Billing,1499.00,97,APPROVED_CUSTOMER,2026-10-18 11:20:10,RBI_DPSS_COMPLIANT,0x8b3e1c9d2f4a5b6c\n` +
        `${reportId},TXN-992810,Tata CLiQ Luxury,Unrecognized Online Charge,24999.00,91,APPROVED_CUSTOMER,2026-10-12 19:44:00,RBI_DPSS_COMPLIANT,0x9c4f2d0e3a5b6c7d\n` +
        `${reportId},TXN-902100,Reliance Digital Retail Ltd,Defective Product,14999.00,84,APPROVED_CUSTOMER,2026-10-14 16:10:00,RBI_DPSS_COMPLIANT,0x0d5a3e1f4b6c7d8e\n` +
        `${reportId},TXN-894200,Flipkart India Pvt Ltd,Fraudulent Transaction,4499.00,89,APPROVED_CUSTOMER,2026-10-13 14:05:00,RBI_DPSS_COMPLIANT,0x1e6b4f2a5c7d8e9f\n` +
        `${reportId},TXN-881200,Taj Hotels & Resorts (IHCL),Service Not Provided,28500.00,44,ADMIN_OVERRIDE_RESOLVED,2026-10-11 20:30:00,RBI_DPSS_COMPLIANT,0x2f7c5a3b6d8e9f0a\n` +
        `${reportId},TXN-875500,Swiggy Instamart India,Duplicate Charge,849.00,61,AUTO_RESOLVED_REFUND,2026-10-10 12:15:00,RBI_DPSS_COMPLIANT,0x3a8d6b4c7e9f0a1b\n` +
        `${reportId},TXN-870100,Zomato Dining & Gold,Wrong Item Delivered,1299.00,58,AUTO_RESOLVED_REFUND,2026-10-09 18:50:00,RBI_DPSS_COMPLIANT,0x4b9e7c5d8f0a1b2c\n`;
    } else {
      mimeType = 'application/pdf';
      content = `%PDF-1.4\n% VerdictAI Enterprise Regulatory Audit Package\n` +
        `========================================================================================\n` +
        `VERDICTAI REGULATORY COMPLIANCE AUDIT REPORT (${reportId})\n` +
        `PACKAGE NAME: ${reportName}\n` +
        `GOVERNING CIRCULAR: RBI/2020-21/74 DPSS.CO.PD.No.1164/02.14.003/2020-21\n` +
        `GENERATION TIMESTAMP: ${new Date().toISOString()} IST\n` +
        `EVALUATION PERIOD: ${dateRange} | CATEGORY FILTER: ${category}\n` +
        `CRYPTOGRAPHIC MERKLE ROOT: 0x7f9a2b8c4d1e3a6f882941992810a4b7\n` +
        `AUDIT LEDGER INTEGRITY: 100% NON-REPUDIABLE SHA-256 SIGNED\n` +
        `========================================================================================\n\n` +
        `1. EXECUTIVE SUMMARY\n` +
        `During the audit window (${dateRange}), VerdictAI monitored and processed automated dispute\n` +
        `and chargeback claims across NPCI UPI AutoPay, RuPay Card-Not-Present, and POS Gateway networks.\n` +
        `Straight-Through Processing (STP) rate achieved: 92.7%.\n` +
        `Average case turnaround time: 4.2 minutes (Exceeds RBI 48-hour SLA mandate by 99.1%).\n` +
        `Model False Positive Rate: 1.3% (Beats NFR-14 < 2% threshold).\n\n` +
        `2. MANDATORY STATUTORY RECONCILIATIONS\n` +
        `* Section 4.1: Customer Zero-Liability turnaround verified across HDFC Bank, SBI, ICICI issuing feeds.\n` +
        `* Section 4.2: Merchant rebuttal 48h SLA notification delivered with 100% delivery acknowledgment.\n` +
        `* Section 4.3: Carrier physical drop-off telematics verified via Blue Dart & Delhivery GPS logs.\n\n` +
        `3. CRYPTOGRAPHIC SIGNATURES\n` +
        `Issuing Bank Auditor Signature: VALIDATED (HDFC Bank Enterprise PKI - KeyID: 0x9812)\n` +
        `Acquiring Network Auditor Signature: VALIDATED (NPCI RuPay Core Switch Node #3)\n` +
        `VerdictAI AI Model Attestation: Fair-Weighing ML Calibration Hash: sha256_fw_model_v1.4\n` +
        `========================================================================================\n` +
        `END OF OFFICIAL COMPLIANCE AUDIT RECORD - VERDICTAI GATEWAY V1.0\n`;
    }

    const cleanFileName = reportName.includes('.') ? reportName : `${reportName}.${fileExtension}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onAddToast?.({
      type: 'success',
      title: 'Audit Package Downloaded',
      message: `${cleanFileName} (${format}) generated and saved to your local downloads.`
    });
  };

  const handleCopyMerkleRoot = () => {
    navigator.clipboard.writeText('0x7f9a2b8c4d1e3a6f882941992810a4b7');
    setCopiedRoot(true);
    setTimeout(() => setCopiedRoot(false), 2000);
    onAddToast?.({
      type: 'info',
      title: 'Merkle Root Copied',
      message: 'Cryptographic SHA-256 root hash copied to clipboard.'
    });
  };

  // Dynamic metrics based on active dateRange selection
  const kpiMetrics = {
    resolutionTime: dateRange === 'This Quarter' ? '3.8 min' : dateRange === 'Year to Date' ? '4.6 min' : '4.2 min',
    resolutionDelta: dateRange === 'This Quarter' ? '-14.8%' : dateRange === 'Year to Date' ? '-11.2%' : '-12.5%',
    stpRate: dateRange === 'This Quarter' ? '94.1%' : dateRange === 'Year to Date' ? '90.4%' : '92.7%',
    stpDelta: dateRange === 'This Quarter' ? '+5.4%' : dateRange === 'Year to Date' ? '+2.9%' : '+4.1%',
    falsePositive: dateRange === 'This Quarter' ? '1.1%' : dateRange === 'Year to Date' ? '1.5%' : '1.3%',
    merchantWinRate: dateRange === 'This Quarter' ? '41.5%' : dateRange === 'Year to Date' ? '36.2%' : '38.0%',
    merchantDelta: dateRange === 'This Quarter' ? '+3.8%' : dateRange === 'Year to Date' ? '+1.4%' : '+2.2%',
  };

  const exportsList = reportData?.auditExports || reportData?.exports || AUDIT_EXPORTS;
  const filteredExports = exportsList.filter((item: any) => {
    const matchesSearch =
      item.reportName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.id.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;
    if (category === 'All Categories') return true;
    if (category === 'Not Received') return item.reportName.toLowerCase().includes('chargeback') || item.reportName.toLowerCase().includes('regulatory');
    if (category === 'Duplicate Charge') return item.reportName.toLowerCase().includes('npci') || item.reportName.toLowerCase().includes('trend');
    if (category === 'Defective Product') return item.reportName.toLowerCase().includes('risk') || item.reportName.toLowerCase().includes('ledger');
    return true;
  });

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
            onClick={handleRefreshClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Refresh Ledger Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 transition shadow-xs cursor-pointer group"
            title="Inspect Cryptographic Merkle Root"
          >
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse group-hover:scale-110 transition-transform" />
            <span>Audit Chain: Verified 100%</span>
          </button>
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
              onChange={(e) => {
                setDateRange(e.target.value);
                onAddToast?.({
                  type: 'info',
                  title: 'Date Filter Applied',
                  message: `Re-aggregated analytics for: ${e.target.value}`
                });
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                onAddToast?.({
                  type: 'info',
                  title: 'Category Filter Applied',
                  message: `Showing metrics filtered by: ${e.target.value}`
                });
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="Not Received">Not Received</option>
              <option value="Duplicate Charge">Duplicate Charge</option>
              <option value="Defective Product">Defective Product</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleExportPackage(`Master_Audit_Report_${dateRange.replace(/\s+/g, '_')}_${category.replace(/\s+/g, '_')}.pdf`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
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
          {/* KPI Cards with Visual Trend Sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Resolution Time</span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">{kpiMetrics.resolutionTime}</span>
                </div>
                <MiniSparkline data={[5.8, 5.2, 4.9, 4.6, 4.4, 4.2]} isPositive={true} />
              </div>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" /> {kpiMetrics.resolutionDelta} vs benchmark
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Auto-Resolution Rate</span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">{kpiMetrics.stpRate}</span>
                </div>
                <MiniSparkline data={[84, 86, 88, 89.5, 91.2, 92.7]} color="#10B981" isPositive={true} />
              </div>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" /> {kpiMetrics.stpDelta} STP rate
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">False Positive Rate</span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">{kpiMetrics.falsePositive}</span>
                </div>
                <MiniSparkline data={[2.1, 1.9, 1.7, 1.5, 1.4, 1.3]} color="#3B82F6" isPositive={true} />
              </div>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Beats NFR-14 &lt; 2% target
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Merchant Win Rate</span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-2 block font-mono">{kpiMetrics.merchantWinRate}</span>
                </div>
                <MiniSparkline data={[32, 34, 33, 36, 37.2, 38.0]} color="#2563EB" isPositive={true} />
              </div>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" /> {kpiMetrics.merchantDelta} recovery improvement
              </span>
            </div>
          </div>

          {/* Interactive Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Dispute Intake vs STP Volume Bar Chart (7 Cols) */}
            <div className="lg:col-span-7">
              <BarChart
                title="Monthly Dispute Ingestion & Auto-Resolution Trends"
                subtitle={`Volume comparison between automated Straight-Through Processing and escalated cases (${dateRange} • ${category})`}
                data={REPORTS_ANALYTICS_DATA.monthlyVolume.map((m) => ({
                  label: m.month,
                  volume: m.volume,
                  auto: m.auto,
                  escalated: m.escalated,
                }))}
                series={[
                  { key: 'volume', label: 'Total Inflow', color: '#2563EB', gradientTo: '#3B82F6' },
                  { key: 'auto', label: 'Auto-Resolved', color: '#10B981', gradientTo: '#34D399' },
                  { key: 'escalated', label: 'Escalated Ops', color: '#F59E0B', gradientTo: '#FBBF24' },
                ]}
                valueFormatter={(v) => `${v.toLocaleString()} cases`}
              />
            </div>

            {/* Dispute Category Distribution Donut Chart (5 Cols) */}
            <div className="lg:col-span-5">
              <DonutChart
                title="Dispute Category Distribution"
                subtitle={`Normalized dispute composition filtered by ${category}`}
                data={REPORTS_ANALYTICS_DATA.categoryBreakdown.map((c) => ({
                  label: c.category,
                  value: c.count,
                  percentage: c.percentage,
                  count: c.count,
                  color: c.color,
                }))}
                totalLabel="Total Claims"
                aiInsight={REPORTS_ANALYTICS_DATA.aiInsight}
              />
            </div>
          </div>

          {/* Downloadable Audit Exports */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Downloadable Audit Packages</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredExports.length} audit artifacts for {dateRange} ({category})
                </p>
              </div>
              <div className="relative w-full sm:w-64">
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
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          item.format === 'CSV' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.format}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.generationDate}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{item.fileSize}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleExportPackage(item)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 font-bold hover:bg-blue-600 hover:text-white rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
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

      {/* Cryptographic Audit Chain & Merkle Root Verification Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Cryptographic Audit Chain Verification</h3>
                  <p className="text-xs text-slate-500">Tamper-Proof Merkle Tree State Ledger (RBI Zero-Trust Compliant)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Merkle Root (SHA-256)</span>
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-800 text-[11px]">
                  <span className="truncate">0x7f9a2b8c4d1e3a6f882941992810a4b7c8d9e0f1a2b3c4d5</span>
                  <button
                    onClick={handleCopyMerkleRoot}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition shrink-0"
                    title="Copy Root Hash"
                  >
                    {copiedRoot ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Sealed Blocks</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono block mt-0.5">8,914,203</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">&bull; 0 Fork / 0 Rollback</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Validator Nodes</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono block mt-0.5">7 Distributed</span>
                  <span className="text-[10px] text-blue-600 font-semibold mt-1 block">&bull; NPCI + Bank Feeds</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Audit Chain Integrity: 100% Cryptographically Intact</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Every dispute submission, automated Fair-Weighing ML inference, and administrator override decision is sealed into an immutable append-only hash tree compliant with RBI statutory guidelines.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleExportPackage('Cryptographic_Merkle_Audit_Trail_Package.pdf');
                  setIsAuditModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Verification Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
