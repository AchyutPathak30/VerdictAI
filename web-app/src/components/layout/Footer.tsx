import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-3 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-2">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center">
        <span>© 2026 VerdictAI Enterprise Utility</span>
        <span className="hidden sm:inline">•</span>
        <a href="#compliance" className="hover:text-slate-600 transition">Compliance</a>
        <span className="hidden sm:inline">•</span>
        <a href="#privacy" className="hover:text-slate-600 transition">Privacy Policy</a>
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-slate-500">AP-SOUTH-1</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">V4.2.1-STABLE</span>
      </div>
    </footer>
  );
};
