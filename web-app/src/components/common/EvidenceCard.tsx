import React from 'react';
import { FileText, MoreVertical } from 'lucide-react';

interface EvidenceCardProps {
  fileName: string;
  type: string;
  fileSize: string;
  uploadedAt?: string;
  status?: string;
  onPreview?: () => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  fileName,
  type,
  fileSize,
  onPreview,
}) => {
  let badgeBg = 'bg-rose-600';
  if (type === 'CSV') badgeBg = 'bg-emerald-600';
  if (type === 'DOCX') badgeBg = 'bg-blue-600';
  if (type === 'JPG' || type === 'PNG') badgeBg = 'bg-amber-600';
  if (type === 'LOG') badgeBg = 'bg-purple-600';

  return (
    <div
      onClick={onPreview}
      className="group relative bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-blue-400 hover:shadow-subtle transition cursor-pointer"
    >
      {/* Three dots header */}
      <div className="flex justify-end items-center mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          title="File actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Large File Representation Graphic */}
      <div className="flex items-center justify-center py-3">
        <div className={`w-14 h-16 ${badgeBg} rounded-lg flex flex-col items-center justify-center text-white shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform`}>
          <FileText className="w-6 h-6 opacity-90 mb-1" />
          <span className="text-[10px] font-black tracking-wider uppercase">
            {type}
          </span>
          <div className="absolute top-0 right-0 w-3 h-3 bg-white/25 rounded-bl" />
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-2 text-left border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">
          <span>{type}</span>
        </div>
        <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          {fileSize}
        </p>
      </div>
    </div>
  );
};
