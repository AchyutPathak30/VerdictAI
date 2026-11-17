import React, { useState } from 'react';
import { Search, Bell, ChevronDown, CheckCircle2, Shield, User, LogOut, Menu } from 'lucide-react';
import { ScreenId } from './Sidebar';

interface TopHeaderProps {
  onSearch?: (query: string) => void;
  currentUser: {
    name: string;
    role: string;
    avatar: string;
    email?: string;
    userId?: string;
  };
  onSwitchUser?: (user: { name: string; role: string; avatar: string; email?: string; userId?: string }) => void;
  onNavigateToScreen?: (screen: ScreenId, caseId?: string) => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

const USERS = [
  {
    name: 'Priya Sharma',
    role: 'Admin Lead',
    email: 'priya.sharma@verdictai-bank.com',
    userId: 'usr_priya_01',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rohan Mehta',
    role: 'Senior Administrator',
    email: 'rohan.mehta@verdictai-bank.com',
    userId: 'usr_rohan_01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rajesh Verma',
    role: 'Senior Dispute Investigator',
    email: 'rajesh.verma@verdictai-bank.com',
    userId: 'usr_rajesh_01',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Amit Patel',
    role: 'Store Operations Manager',
    email: 'amit.patel@croma.infiniti.com',
    userId: 'usr_amit_01',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pooja Iyer',
    role: 'Cardholder (Customer)',
    email: 'pooja.iyer@gmail.com',
    userId: 'usr_pooja_01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  }
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  onSearch,
  currentUser,
  onSwitchUser,
  onNavigateToScreen,
  onLogout,
  onToggleMobileMenu,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Mobile Menu Toggle & Brand / Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand indicator visible on mobile when sidebar is closed */}
        <div className="flex md:hidden items-center gap-2 text-slate-900 font-bold text-sm">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <span className="leading-none">VerdictAI</span>
        </div>

        {/* Global Search Input (visible on tablet and desktop) */}
        <div className="hidden md:block w-64 lg:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search disputes, cases, or merchants..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live sync indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sync: <strong className="text-slate-700">Active</strong></span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            )}
          </button>

          {showNotification && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-elevated p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Notifications ({unreadCount})</span>
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[11px] text-blue-600 cursor-pointer hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    onNavigateToScreen?.('override-console', 'CHB-99281-DX');
                    setShowNotification(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 transition cursor-pointer"
                >
                  <p className="font-semibold flex items-center justify-between">
                    <span>Case CHB-99281-DX Flagged</span>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold">Review</span>
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Low confidence score (44%) escalated for override.</p>
                </button>
                <button
                  onClick={() => {
                    onNavigateToScreen?.('case-detail', 'DS-8812');
                    setShowNotification(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition cursor-pointer"
                >
                  <p className="font-semibold flex items-center justify-between">
                    <span>Merchant Evidence Submitted</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">View</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Case DS-8812 received carrier dispatch receipt.</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Role / Persona
              </div>
              <div className="py-1 space-y-1">
                {USERS.map((user) => (
                  <button
                    key={user.name}
                    onClick={() => {
                      onSwitchUser?.(user);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                      currentUser.name === user.name
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" />
                      <div className="text-left">
                        <p className="leading-tight">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{user.role}</p>
                      </div>
                    </div>
                    {currentUser.name === user.name && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {onLogout && (
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out (Lock Session)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Sign Out Action */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out to Login Portal"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
