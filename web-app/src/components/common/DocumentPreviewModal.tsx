import React from 'react';
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
  FileCheck
} from 'lucide-react';
import { EvidenceItem } from '../../types/dispute';

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
  if (!isOpen || !item) return null;

  const handleDownload = () => {
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

          {/* Security Gate CCTV Frame Preview */}
          {isImage && (
            <div className="max-w-2xl mx-auto bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-4 space-y-3 text-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Camera className="w-4 h-4 text-rose-500" />
                  SOCIETY GATE CCTV LOG &bull; CAMERA #04
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">REC &bull; 1080P 30FPS</span>
              </div>

              {/* Simulated CCTV Frame */}
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                <div className="absolute top-3 left-3 font-mono text-[11px] text-emerald-400 bg-black/60 px-2 py-1 rounded">
                  CAM 04 - PALM HEIGHTS MAIN GATE &bull; 14-OCT-2026 15:42:18 IST
                </div>
                <div className="absolute top-3 right-3 font-mono text-[10px] text-white/70 bg-black/60 px-2 py-1 rounded">
                  IR FILTER: ACTIVE
                </div>

                {/* CCTV Visual Illustration */}
                <div className="text-center p-6 space-y-2">
                  <Camera className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">
                    [ CCTV FOOTAGE STILL CAPTURE ]
                  </p>
                  <p className="text-[11px] text-slate-300 max-w-md mx-auto">
                    During recorded Blue Dart drop-off timestamp (15:42:18 IST), security gate log shows no commercial delivery vans entered Palm Heights premises.
                  </p>
                </div>

                <div className="absolute bottom-3 left-3 font-mono text-[10px] text-amber-400 bg-black/70 px-2 py-1 rounded border border-amber-500/30">
                  ⚠️ ZERO DELIVERY ENTRY DETECTED AT 15:42:18 IST
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Submitted by: Cardholder (Pooja Iyer)</span>
                <span className="font-mono">Security Desk Signature: Logged</span>
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
