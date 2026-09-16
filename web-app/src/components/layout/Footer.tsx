import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-3.5 px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
      <div className="flex items-center gap-4">
        <span>© 2026 DisputeOps Enterprise Utility</span>
        <span className="hidden md:inline">•</span>
        <a href="#compliance" className="hover:text-slate-600 transition">Legal Compliance</a>
        <span className="hidden md:inline">•</span>
        <a href="#privacy" className="hover:text-slate-600 transition">Data Privacy Policy</a>
      </div>
      <div className="flex items-center gap-2 mt-2 sm:mt-0 font-mono text-[11px]">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-slate-500">REPORTING NODE: US-EAST-1</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">V4.2.1-STABLE</span>
      </div>
    </footer>
  );
};
