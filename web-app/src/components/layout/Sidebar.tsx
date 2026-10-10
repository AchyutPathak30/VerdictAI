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
  Sliders,
  Sparkles,
  UserCheck,
  Lock,
  Inbox,
  AlertOctagon
} from 'lucide-react';

export type ScreenId = 
  | 'dashboard'
  | 'case-queue'
  | 'case-detail'
  | 'evidence-review'
  | 'override-console'
  | 'merchant-portal'
  | 'merchant-profile'
  | 'reports'
  | 'system-config'
  | 'empty-state'
  | 'password-recovery'
  | 'not-found';

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
      id: 'evidence-review' as ScreenId,
      label: 'NLP Evidence Review',
      icon: Sparkles,
    },
    {
      id: 'merchant-portal' as ScreenId,
      label: 'Merchant Portal',
      icon: Store,
    },
    {
      id: 'merchant-profile' as ScreenId,
      label: 'Merchant Profile',
      icon: UserCheck,
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
    {
      id: 'system-config' as ScreenId,
      label: 'System Config',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-900 h-screen">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight leading-none">
              VerdictAI
            </span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1">
              Gateway v1.0
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800/80 my-2 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">System States</p>
            <button
              onClick={() => onSelectScreen('empty-state')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeScreen === 'empty-state' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>WEB-13: Zero State</span>
            </button>
            <button
              onClick={() => onSelectScreen('password-recovery')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeScreen === 'password-recovery' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>WEB-02: Auth Reset</span>
            </button>
            <button
              onClick={() => onSelectScreen('not-found')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeScreen === 'not-found' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>WEB-14: 404 Page</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Support */}
      <div className="p-3 border-t border-slate-900">
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>REST API: 8000/api/v1</span>
        </div>
      </div>
    </aside>
  );
};
