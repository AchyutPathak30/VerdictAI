import React, { useState } from 'react';
import {
  Store,
  Download,
  Plus,
  Clock,
  UploadCloud,
  CheckSquare,
  Square,
  Loader2,
  FileCheck
} from 'lucide-react';
import { MERCHANT_PORTAL_DATA } from '../../data/mockData';
import { uploadEvidenceFile, submitStatement } from '../../services/api';
import { ToastMessage } from '../common/Toast';

interface MerchantPortalScreenProps {
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const MerchantPortalScreen: React.FC<MerchantPortalScreenProps> = ({ onAddToast }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DS-8812');
  const [certified, setCertified] = useState<boolean>(true);
  const [checklist, setChecklist] = useState(MERCHANT_PORTAL_DATA.submissionModule.checklist);
  const [attachedFiles, setAttachedFiles] = useState(MERCHANT_PORTAL_DATA.submissionModule.attachedFiles);
  const [statementText, setStatementText] = useState<string>('Carrier tracking number confirms delivery with recipient signature.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleToggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    const res = await uploadEvidenceFile(selectedCaseId, 'MERCHANT_PROOF', 'MERCHANT', file);
    setIsUploading(false);

    if (res.data) {
      const uploadedData = res.data;
      setAttachedFiles(prev => [
        ...prev,
        { fileName: file.name, type: uploadedData.type, size: uploadedData.fileSize }
      ]);
      onAddToast?.({
        type: 'success',
        title: 'Evidence Uploaded',
        message: `${file.name} SHA-256 hash registered in MongoDB.`
      });
    }
  };

  const handleSubmitEvidence = async () => {
    if (!certified) {
      onAddToast?.({
        type: 'warning',
        title: 'Certification Required',
        message: 'Please certify that evidence documents are authentic.'
      });
      return;
    }

    setIsSubmitting(true);
    await submitStatement({
      dispute_id: selectedCaseId,
      statement_type: 'MERCHANT',
      statement_text: statementText,
      author: 'Global Retail Group Ops'
    });
    setIsSubmitting(false);

    onAddToast?.({
      type: 'success',
      title: 'Counter-Evidence Submitted',
      message: `Evidence dossier for ${selectedCaseId} submitted to DisputeOps before SLA deadline.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Merchant Profile Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            GRG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {MERCHANT_PORTAL_DATA.merchant.name}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {MERCHANT_PORTAL_DATA.merchant.tier}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Merchant ID: <strong className="text-slate-600 font-mono">{MERCHANT_PORTAL_DATA.merchant.merchantId}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Disputes List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Contested Charges Requiring Response
            </h2>
            <div className="space-y-2">
              {MERCHANT_PORTAL_DATA.disputesRequiringEvidence.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedCaseId(d.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedCaseId === d.id
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-600">{d.id}</span>
                    <span className="text-xs font-bold text-slate-900">${d.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">{d.reasonCode}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-bold mt-2">
                    <Clock className="w-3 h-3" />
                    <span>SLA: {d.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Evidence Drag and Drop Module */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Evidence Dossier Submission: {selectedCaseId}
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                SLA Window Open
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Required Evidence Checklist
              </label>
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition"
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs ${item.checked ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Narrative Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Merchant Statement Narrative
              </label>
              <textarea
                rows={3}
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center bg-blue-50/30 hover:bg-blue-50/60 transition">
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Drag & drop evidence files or click to upload</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 25MB per file</p>
              <input
                type="file"
                onChange={handleFileDrop}
                className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            {/* Attached Files List */}
            <div className="space-y-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                  <span className="font-semibold text-slate-800">{file.fileName} ({file.size})</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Attached</span>
                </div>
              ))}
            </div>

            {/* Legal Certification */}
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                className="w-4 h-4 text-blue-600 accent-blue-600"
              />
              <span>I certify that all attached documentation is authentic and accurate.</span>
            </label>

            <button
              onClick={handleSubmitEvidence}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>Submit Counter-Evidence to DisputeOps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
