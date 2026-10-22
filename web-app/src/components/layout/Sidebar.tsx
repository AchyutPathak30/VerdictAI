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
  AlertOctagon,
  CreditCard
} from 'lucide-react';

export type ScreenId = 
  | 'dashboard'
  | 'case-queue'
  | 'case-detail'
  | 'evidence-review'
  | 'override-console'
  | 'merchant-portal'
  | 'merchant-profile'
  | 'cardholder-portal'
  | 'reports'
  | 'system-config'
  | 'empty-state'
  | 'password-recovery'
  | 'not-found';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  currentUser?: {
    name: string;
    role: string;
    avatar: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onSelectScreen, currentUser }) => {
  const roleLower = (currentUser?.role || 'admin').toLowerCase();

  // Role-based navigation filtering
  let navItems: Array<{ id: ScreenId; label: string; icon: any }> = [];
  let rbacBadge = { label: 'BANK ADMIN CORE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };

  if (roleLower.includes('cardholder')) {
    rbacBadge = { label: 'CONSUMER CARDHOLDER', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    navItems = [
      { id: 'cardholder-portal', label: 'My Disputes & Claims', icon: CreditCard },
    ];
  } else if (roleLower.includes('merchant') || roleLower.includes('store')) {
    rbacBadge = { label: 'STORE OPERATIONS (MERCHANT)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    navItems = [
      { id: 'merchant-portal', label: 'Merchant Portal', icon: Store },
      { id: 'merchant-profile', label: 'Merchant Profile', icon: UserCheck },
    ];
  } else if (roleLower.includes('investigator')) {
    rbacBadge = { label: 'DISPUTE INVESTIGATOR', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    navItems = [
      { id: 'case-queue', label: 'Case Queue', icon: FileSpreadsheet },
      { id: 'evidence-review', label: 'NLP Evidence Review', icon: Sparkles },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ];
  } else {
    // Admin (Priya Sharma, Rohan Mehta)
    rbacBadge = { label: 'BANK ADMIN CORE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'case-queue', label: 'Case Queue', icon: FileSpreadsheet },
      { id: 'evidence-review', label: 'NLP Evidence Review', icon: Sparkles },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      { id: 'override-console', label: 'Admin Override', icon: Sliders },
      { id: 'system-config', label: 'System Config', icon: Settings },
    ];
  }

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

        {/* Dynamic RBAC Security Scope Pill */}
        <div className="px-4 pt-3 pb-1">
          <div className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 ${rbacBadge.color}`}>
            <Lock className="w-3 h-3" />
            <span className="truncate">{rbacBadge.label}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
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

          {/* System States only visible to Admins */}
          {roleLower.includes('admin') && (
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
          )}
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

