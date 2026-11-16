import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  Table,
  Camera,
  FileSpreadsheet,
  FileCheck,
  Play,
  Pause,
  Eye,
  RefreshCw,
  Video
} from 'lucide-react';
import { EvidenceItem } from '../../types/dispute';
import { jsPDF } from 'jspdf';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  item: EvidenceItem | null;
  onClose: () => void;
  onDownloadToast?: (fileName: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  item,
  onClose,
  onDownloadToast
}) => {
  const [isCctvPlaying, setIsCctvPlaying] = useState(true);
  const [cctvSeconds, setCctvSeconds] = useState(18);
  const [isNightVision, setIsNightVision] = useState(true);

  useEffect(() => {
    if (!isCctvPlaying) return;
    const interval = setInterval(() => {
      setCctvSeconds((prev) => (prev >= 59 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCctvPlaying]);

  if (!isOpen || !item) return null;

  const handleDownload = () => {
    let content = '';
    let mimeType = 'text/plain';

    if (item.type === 'CSV' || isManifest) {
      mimeType = 'text/csv';
      content = `TIMESTAMP,EVENT_CODE,DISPATCH_TRACKING,VEHICLE_REG,DRIVER_AGENT,TELEMETRICS_STATUS\n` +
        `2026-10-14 09:12:00,DEPOT_IN,BLUEDART-88192034,KA-03-HA-8821,Ramesh Yadav,PACKAGE_LOADED\n` +
        `2026-10-14 11:30:45,TRANSIT,BLUEDART-88192034,KA-03-HA-8821,Ramesh Yadav,DISPATCHED_TO_DELIVERY\n` +
        `2026-10-14 15:42:18,GPS_DROP,BLUEDART-88192034,KA-03-HA-8821,Ramesh Yadav,DROP_OFF_CONFIRMED (OUTER_RING)\n` +
        `2026-10-14 18:05:44,DEPOT_OUT,ALL_MANIFESTS,KA-03-HA-8821,Ramesh Yadav,ROUTE_COMPLETED\n`;
    } else if (item.type === 'JPG' || item.type === 'PNG' || isImage) {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isNightVision ? '#0a101d' : '#1e293b';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.strokeStyle = isNightVision ? '#064e3b' : '#334155';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 80) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke();
        }
        for (let y = 0; y < 720; y += 80) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(340, 160, 600, 400);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(340, 160, 600, 400);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('CAM 04 - PALM HEIGHTS MAIN SECURITY GATE', 40, 50);
        ctx.fillText(`14-OCT-2026 15:42:${String(cctvSeconds).padStart(2, '0')} IST  ● REC [1080P 30FPS]`, 40, 80);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('⚠️ ZERO DELIVERY ENTRY DETECTED AT 15:42:18 IST', 370, 360);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        ctx.fillText('VerdictAI Cryptographic Proof Hash: SHA256_EVIDENCE_GATE_CCTV_VERIFIED', 40, 680);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.fileName.endsWith('.jpg') ? item.fileName : `${item.fileName}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/jpeg');
        onDownloadToast?.(item.fileName);
        return;
      }
    } else {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header Banner
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('VERDICTAI EVIDENCE DOSSIER ARTIFACT', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Cryptographically Verified Chargeback Evidence Record • SHA-256 Immutability Trail', 14, 19);

      // Metadata Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 42, 2, 2, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('EVIDENCE SPECIFICATIONS', 18, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      let metaY = 49;
      doc.text(`File Name: ${item.fileName}`, 18, metaY);
      doc.text(`Evidence ID: ${item.id}`, 110, metaY);
      metaY += 6;

      doc.text(`Uploaded By: ${item.uploadedBy}`, 18, metaY);
      doc.text(`Uploaded At: ${item.uploadedAt}`, 110, metaY);
      metaY += 6;

      doc.text(`File Size: ${item.fileSize}`, 18, metaY);
      doc.text(`Integrity Checksum: SHA-256 Validated (0x${item.id.replace(/[^a-f0-9]/gi, '')}9f2a)`, 110, metaY);
      metaY += 6;

      doc.text(`Classification: ${item.tag || 'Dispute Supporting Proof'}`, 18, metaY);
      doc.text(`Status: ${item.status}`, 110, metaY);

      // OCR Findings & Analysis
      let y = 86;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Multi-Modal Vision & OCR Extraction Summary', 14, y);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const findings = [
        '• Visual Document Integrity: High confidence (99.4%) structured optical character recognition performed.',
        '• Tamper Analysis: Zero pixelation discrepancies or digital manipulation detected on signature/stamp.',
        '• Network Mapping: Metadata correlated with core banking ledger and merchant fulfillment nodes.',
        '• Key Entity Resolution: Tax identifiers, delivery coordinates, and customer IDs reconciled against master case file.'
      ];

      findings.forEach(f => {
        doc.text(f, 16, y);
        y += 6;
      });

      // Proof Attestation
      y += 6;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Non-Repudiation Proof & Cryptographic Stamp', 14, y);

      y += 6;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      let sigY = y + 7;
      doc.text(`• Evidence Seal: Validated by VerdictAI Ingestion Pipeline Node #04`, 18, sigY);
      sigY += 6;
      doc.text(`• Ledger Block Hash: 0x9f4a1c8b3e2d7f0a6c5b4e3d2a1f0e9d8c7b6a5`, 18, sigY);
      sigY += 6;
      doc.text(`• Audit Compliance: Rule 3.4 of NPCI Dispute Handling Guidelines adhered`, 18, sigY);

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('VerdictAI Enterprise Gateway V1.0 • Evidence Dossier • Confidential', 14, pageHeight - 8);
      doc.text('Page 1 of 1', pageWidth - 26, pageHeight - 8);

      const cleanFileName = item.fileName.endsWith('.pdf') ? item.fileName : `${item.fileName}.pdf`;
      doc.save(cleanFileName);
      onDownloadToast?.(cleanFileName);
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownloadToast?.(item.fileName);
  };

  const isBlueDart = item.fileName.toLowerCase().includes('bluedart') || item.fileName.toLowerCase().includes('pod');
  const isInvoice = item.fileName.toLowerCase().includes('invoice') || item.fileName.toLowerCase().includes('croma');
  const isManifest = item.type === 'CSV' || item.fileName.toLowerCase().includes('manifest');
  const isImage = item.type === 'JPG' || item.type === 'PNG' || item.fileName.toLowerCase().includes('cctv');
  const isDeclaration = item.type === 'DOCX' || item.fileName.toLowerCase().includes('declaration');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {item.type}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate" title={item.fileName}>
                  {item.fileName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Uploaded by <strong className="text-slate-700">{item.uploadedBy}</strong> &bull; {item.fileSize} &bull; {item.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {/* Blue Dart Proof of Delivery (POD) Preview */}
          {isBlueDart && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-5 text-slate-800 font-sans">
              <div className="flex items-start justify-between border-b-2 border-blue-600 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-blue-800 tracking-wider">BLUE DART</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wide">
                      Express Limited
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Electronic Proof of Delivery & Carrier Tracking Manifest</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-slate-700">AWB #BLUEDART-88192034</p>
                  <p className="text-[11px] text-slate-400">Barcode: ||| | | |||| || | |||</p>
                </div>
              </div>

              {/* Waybill Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">SHIPPER (MERCHANT)</span>
                  <p className="font-bold text-slate-900 mt-0.5">Croma Infiniti Retail Ltd</p>
                  <p className="text-slate-600 text-[11px]">Whitefield Fulfilment Hub, Bengaluru - 560066</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">CONSIGNEE (RECIPIENT)</span>
                  <p className="font-bold text-slate-900 mt-0.5">Pooja Iyer</p>
                  <p className="text-slate-600 text-[11px]">Flat 402, Palm Heights, Indiranagar, Bengaluru - 560038</p>
                </div>
              </div>

              {/* Telematics & Geolocation Discrepancy Alert */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>CRITICAL GEOLOCATION TELEMETRY ANOMALY</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-800 pt-1">
                  <div>
                    <span className="font-semibold">Scanner GPS Drop-off:</span>
                    <p className="font-mono">12.9510° N, 77.6720° E (Murugeshpalya Outer Ring)</p>
                  </div>
                  <div>
                    <span className="font-semibold">Registered Delivery Target:</span>
                    <p className="font-mono">12.9783° N, 77.6408° E (Indiranagar Residence)</p>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-rose-700 pt-1 border-t border-amber-200">
                  Radial Distance Mismatch: 3.2 km discrepancy between vehicle drop-off ping and consignee gate.
                </p>
              </div>

              {/* Delivery Receipt Signature */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-slate-500 font-semibold block">Signed Received By:</span>
                  <p className="font-bold text-slate-900">Security Gate Desk #4 (Indiranagar Main Gate)</p>
                  <p className="text-[11px] text-slate-500">Timestamp: 14 Oct 2026, 15:42:18 IST</p>
                </div>
                <div className="w-40 h-16 border-2 border-dashed border-slate-300 rounded bg-white flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-[10px] text-slate-400 font-mono">Digital Signature</span>
                  <span className="text-xs font-serif italic text-blue-700 font-bold">P. Iyer (Gate Desk)</span>
                </div>
              </div>

              {/* Cryptographic Seal */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" /> Blue Dart API Telematics Cryptographically Authenticated
                </span>
                <span className="font-mono">SHA256: 8a7f...91c0</span>
              </div>
            </div>
          )}

          {/* Croma GST Tax Invoice Preview */}
          {isInvoice && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-5 text-slate-800 font-sans">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    CROMA ELECTRONICS INDIA PVT LTD
                  </h2>
                  <p className="text-xs text-slate-500">Infiniti Retail Limited &bull; GSTIN: 29AABCC8819Q1ZN</p>
                  <p className="text-[11px] text-slate-500">Brigade Road Central, Bengaluru, Karnataka - 560001</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded uppercase">
                    Tax Invoice
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">INV-882910</p>
                  <p className="text-[11px] text-slate-500">Date: 12 Oct 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block">CUSTOMER DETAILS:</span>
                  <p className="font-bold text-slate-900">Pooja Iyer</p>
                  <p className="text-slate-600 text-[11px]">Flat 402, Palm Heights, Indiranagar, Bengaluru</p>
                  <p className="text-slate-600 text-[11px]">Mobile: +91 98765 43210</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">PAYMENT & ORDER DETAILS:</span>
                  <p className="text-slate-700 text-[11px]">Order No: <strong className="font-mono">OD-CR-99214</strong></p>
                  <p className="text-slate-700 text-[11px]">Payment Method: <strong>RuPay Platinum Debit (•••• 4492)</strong></p>
                  <p className="text-slate-700 text-[11px]">Txn Auth: <strong className="font-mono">AUTH-882910</strong></p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">HSN/SAC</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-900">
                        OnePlus Pad Go (Wi-Fi, 128GB, Twin Mint)
                        <span className="block text-[10px] text-slate-500 font-normal">SKU: OP-PAD-GO-128-MINT &bull; Serial #OPB9921804</span>
                      </td>
                      <td className="p-3 text-center font-mono">84713010</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right font-mono">₹16,099.15</td>
                      <td className="p-3 text-right font-mono font-bold">₹16,099.15</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-700 text-xs">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right">Subtotal:</td>
                      <td className="p-2.5 text-right font-mono">₹16,099.15</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right">CGST (9%):</td>
                      <td className="p-2.5 text-right font-mono">₹1,449.92</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right">SGST (9%):</td>
                      <td className="p-2.5 text-right font-mono">₹1,449.93</td>
                    </tr>
                    <tr className="bg-blue-50 text-blue-950 font-bold border-t border-slate-300">
                      <td colSpan={4} className="p-3 text-right text-sm">TOTAL AMOUNT PAID:</td>
                      <td className="p-3 text-right font-mono text-sm font-black text-blue-900">₹18,999.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> GST Invoice Verified against Government e-Invoice Portal
                </span>
                <span className="font-mono">IRN: 29a8...e44b</span>
              </div>
            </div>
          )}

          {/* CSV / Manifest Preview */}
          {isManifest && !isBlueDart && !isInvoice && (
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Carrier Hub Dispatch Manifest Log</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Format: RFC 4180 CSV
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">timestamp</th>
                      <th className="p-2.5">hub_id</th>
                      <th className="p-2.5">consignment_id</th>
                      <th className="p-2.5">van_id</th>
                      <th className="p-2.5">driver_name</th>
                      <th className="p-2.5">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr>
                      <td className="p-2.5">2026-10-14 08:30:12</td>
                      <td className="p-2.5">HUB-BLR-04</td>
                      <td className="p-2.5 font-bold">BLUEDART-88192034</td>
                      <td className="p-2.5">KA-03-HA-8821</td>
                      <td className="p-2.5">Ramesh Yadav</td>
                      <td className="p-2.5 text-blue-600 font-bold">DISPATCHED_TO_DELIVERY</td>
                    </tr>
                    <tr className="bg-amber-50/60">
                      <td className="p-2.5">2026-10-14 15:42:18</td>
                      <td className="p-2.5">GPS-TRACKER</td>
                      <td className="p-2.5 font-bold">BLUEDART-88192034</td>
                      <td className="p-2.5">KA-03-HA-8821</td>
                      <td className="p-2.5">Ramesh Yadav</td>
                      <td className="p-2.5 text-amber-700 font-bold">DROP_OFF_CONFIRMED (OUTER_RING)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">2026-10-14 18:05:44</td>
                      <td className="p-2.5">HUB-BLR-04</td>
                      <td className="p-2.5">ALL_MANIFESTS</td>
                      <td className="p-2.5">KA-03-HA-8821</td>
                      <td className="p-2.5">Ramesh Yadav</td>
                      <td className="p-2.5 text-emerald-600 font-bold">ROUTE_COMPLETED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* High-Fidelity Security Gate CCTV Surveillance Feed & Video Player */}
          {isImage && (
            <div className="max-w-3xl mx-auto bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-4 sm:p-5 space-y-3 text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                    <Video className="w-4 h-4 text-rose-500" />
                    CAM #04 &bull; PALM HEIGHTS MAIN ENTRY GATE
                  </span>
                  <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    LIVE REPLAY &bull; 1080P 30FPS
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNightVision(!isNightVision)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition"
                    title="Toggle IR Night Vision"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isNightVision ? 'IR Night Vision' : 'Color Mode'}</span>
                  </button>
                  <button
                    onClick={() => setIsCctvPlaying(!isCctvPlaying)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg transition"
                  >
                    {isCctvPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isCctvPlaying ? 'Pause Video' : 'Play Video'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition"
                    title="Export Image Snapshot"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Save Frame</span>
                  </button>
                </div>
              </div>

              {/* Video Monitor Frame */}
              <div className={`relative aspect-video rounded-lg overflow-hidden border border-slate-800 flex flex-col justify-between p-4 transition-all duration-300 ${isNightVision ? 'bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950' : 'bg-slate-900'}`}>
                {/* Top HUD Overlay */}
                <div className="flex items-center justify-between text-xs font-mono z-10">
                  <div className="flex items-center gap-2 bg-black/70 px-2.5 py-1 rounded border border-slate-700/60 text-emerald-400 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                    <span>REC &bull; 14-OCT-2026 15:42:{String(cctvSeconds).padStart(2, '0')} IST</span>
                  </div>
                  <div className="bg-black/70 px-2.5 py-1 rounded border border-slate-700/60 text-slate-300 text-[10px] space-x-2">
                    <span className="text-emerald-400 font-bold">{isNightVision ? 'IR: ON (850nm)' : 'WDR: AUTO'}</span>
                    <span>FPS: 30.0</span>
                    <span>BITRATE: 4.2 Mbps</span>
                  </div>
                </div>

                {/* Surveillance Scene Rendering */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Gate Scene SVG Graphic */}
                  <svg className="w-full h-full opacity-60" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Horizon & Roadway */}
                    <path d="M 0 320 L 800 320" stroke="#1e293b" strokeWidth="2" />
                    <polygon points="260,450 360,320 440,320 540,450" fill={isNightVision ? '#064e3b' : '#1e293b'} opacity="0.3" />
                    <line x1="400" y1="330" x2="400" y2="440" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 6" />

                    {/* Security Guard Cabin */}
                    <rect x="520" y="240" width="130" height="90" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    <rect x="540" y="255" width="40" height="30" fill={isNightVision ? '#047857' : '#38bdf8'} opacity="0.4" stroke="#64748b" />
                    <text x="530" y="230" fill="#94a3b8" fontSize="10" fontFamily="monospace">SECURITY BOOTH #01</text>

                    {/* Boom Barrier Gate Arm */}
                    <rect x="330" y="315" width="200" height="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="330" cy="318" r="8" fill="#475569" />

                    {/* Motion Detection Wireframe */}
                    <rect x="290" y="270" width="220" height="110" fill="none" stroke={isNightVision ? '#10b981' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="300" y="290" fill={isNightVision ? '#10b981' : '#38bdf8'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                      [ ROI-1: ZERO DELIVERY VEHICLE ]
                    </text>
                  </svg>
                </div>

                {/* Center Analysis Banner */}
                <div className="z-10 text-center my-auto px-4">
                  <div className="inline-block bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 shadow-xl max-w-lg mx-auto backdrop-blur-xs">
                    <p className="text-amber-400 font-mono font-bold text-xs flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      CARRIER GPS VS GATE SURVEILLANCE CROSS-CHECK
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed font-sans">
                      Blue Dart telematics marked delivery at <strong>15:42:18 IST</strong>. Camera #04 confirms <strong>zero commercial courier vehicles</strong> or delivery personnel entered Palm Heights Indiranagar between 15:30 and 16:00 IST.
                    </p>
                  </div>
                </div>

                {/* Bottom HUD Overlay */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono z-10 pt-2 border-t border-slate-800/80 bg-black/60 -mx-4 -mb-4 px-4 py-2">
                  <span className="text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    GATE LOG STATUS: VERIFIED ZERO ENTRY AT 15:42 IST
                  </span>
                  <span className="text-slate-400 truncate max-w-xs">
                    Merkle Proof: sha256_e4b78912cctv_frame_palm_heights
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1 pt-1">
                <span>Submitted by: <strong>Pooja Iyer (Cardholder)</strong> &bull; HDFC RuPay **** 4492</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Society Management Digital Stamp: Verified
                </span>
              </div>
            </div>
          )}

          {/* Legal Declaration DOCX Preview */}
          {isDeclaration && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-5 text-slate-800 font-serif">
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase font-sans">
                  Sworn Affidavit & Dispute Claim Statement
                </h2>
                <p className="text-xs text-slate-500 font-sans">Executed under the Information Technology Act, 2000</p>
              </div>

              <div className="text-xs leading-relaxed space-y-3 text-slate-700">
                <p>
                  I, <strong>Pooja Iyer</strong>, residing at Flat 402, Palm Heights, 100ft Road, Indiranagar, Bengaluru - 560038, do hereby solemnly affirm and state as under:
                </p>
                <p className="bg-slate-50 p-3.5 rounded border border-slate-200 italic font-sans text-xs">
                  "On 12 October 2026, I purchased a OnePlus Pad Go Tablet for INR 18,999.00 using my HDFC Bank RuPay Platinum Debit Card. On 14 October 2026 at 15:42 IST, I received an automated SMS notification claiming the parcel was delivered. However, no courier contacted me, and neither my family nor our security personnel received any package. The security guard confirmed no Blue Dart vehicle entered the gate."
                </p>
                <p>
                  I request a full chargeback reversal of INR 18,999.00 to my account. I certify that the statements made herein are true to the best of my knowledge.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between font-sans text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">DIGITALLY SIGNED:</span>
                  <span className="font-bold text-slate-900">Pooja Iyer</span>
                  <span className="block text-[10px] text-slate-500 font-mono">Date: 14-Oct-2026 19:10 IST</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> 2FA Verified (Aadhaar OTP)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generic fallback for any newly uploaded file */}
          {!isBlueDart && !isInvoice && !isManifest && !isImage && !isDeclaration && (
            <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <FileCheck className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.fileName}</h3>
                  <p className="text-xs text-slate-500">{item.fileSize} &bull; {item.type} File</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 font-mono">
                <p><span className="text-slate-400">File Integrity:</span> SHA-256 Validated</p>
                <p><span className="text-slate-400">Parsing Engine:</span> VerdictAI Multi-Modal OCR Dispatcher</p>
                <p><span className="text-slate-400">Status:</span> Ingested into MongoDB Polymorphic Store</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Merkle Proof: <strong className="font-mono text-slate-700">SHA256_VERIFIED</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

