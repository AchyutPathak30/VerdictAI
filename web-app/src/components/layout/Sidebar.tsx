import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Store,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Sliders
} from 'lucide-react';

export type ScreenId = 
  | 'dashboard'
  | 'case-queue'
  | 'case-detail'
  | 'override-console'
  | 'merchant-portal'
  | 'reports';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onSelectScreen }) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'case-queue' as ScreenId,
      label: 'Case Queue',
      icon: FileSpreadsheet,
    },
    {
      id: 'merchant-portal' as ScreenId,
      label: 'Merchant Portal',
      icon: Store,
    },
    {
      id: 'reports' as ScreenId,
      label: 'Reports & Analytics',
      icon: BarChart3,
    },
    {
      id: 'override-console' as ScreenId,
      label: 'Admin Override',
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-900">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight leading-none">
              DisputeOps
            </span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1">
              Enterprise v4.2
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800/80 my-3">
            <button
              onClick={() => onSelectScreen('case-detail')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeScreen === 'case-detail'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Case DSP-1041</span>
              </div>
              {activeScreen === 'case-detail' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-all mt-1"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Support */}
      <div className="p-4 border-t border-slate-900">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
};
