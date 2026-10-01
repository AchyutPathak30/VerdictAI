import React, { useState } from 'react';
import { Sidebar, ScreenId } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Footer } from './components/layout/Footer';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { CaseDetailScreen } from './components/screens/CaseDetailScreen';
import { AdminOverrideScreen } from './components/screens/AdminOverrideScreen';
import { MerchantPortalScreen } from './components/screens/MerchantPortalScreen';
import { ReportsAnalyticsScreen } from './components/screens/ReportsAnalyticsScreen';
import { CaseQueueScreen } from './components/screens/CaseQueueScreen';
import { EvidenceReviewScreen } from './components/screens/EvidenceReviewScreen';
import { SystemConfigScreen } from './components/screens/SystemConfigScreen';
import { MerchantProfileScreen } from './components/screens/MerchantProfileScreen';
import { PasswordRecoveryScreen } from './components/screens/PasswordRecoveryScreen';
import { EmptyDisputesScreen } from './components/screens/EmptyDisputesScreen';
import { NotFoundScreen } from './components/screens/NotFoundScreen';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { CaseQueueItem } from './types/dispute';

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [activeCaseId, setActiveCaseId] = useState<string>('DSP-1041');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentUser, setCurrentUser] = useState({
    name: 'Elena Vance',
    role: 'Admin Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  });

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectCase = (caseItem: CaseQueueItem) => {
    setActiveCaseId(caseItem.id);
    if (caseItem.id === 'DS-8812' || caseItem.action === 'Override') {
      setActiveScreen('override-console');
    } else {
      setActiveScreen('case-detail');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-bg text-slate-800">
      {/* Global Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Fixed Navy Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => setActiveScreen(screen)}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Sticky Top Header */}
        <TopHeader
          currentUser={currentUser}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            addToast({
              type: 'info',
              title: 'Role Switch',
              message: `Switched active persona to ${user.name} (${user.role})`
            });
            if (user.role.toLowerCase().includes('merchant') || user.role.toLowerCase().includes('store')) {
              setActiveScreen('merchant-portal');
            } else if (user.role.toLowerCase().includes('investigator')) {
              setActiveScreen('override-console');
            } else {
              setActiveScreen('dashboard');
            }
          }}
        />

        {/* Scrollable Screen Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto pb-10">
            {activeScreen === 'dashboard' && (
              <AdminDashboardScreen
                onSelectCase={handleSelectCase}
                onViewAllQueue={() => setActiveScreen('case-queue')}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'case-queue' && (
              <CaseQueueScreen
                onSelectCase={handleSelectCase}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'case-detail' && (
              <CaseDetailScreen
                disputeId={activeCaseId}
                onBack={() => setActiveScreen('dashboard')}
                onNavigateToOverride={() => setActiveScreen('override-console')}
                onNavigateToEvidenceReview={() => setActiveScreen('evidence-review')}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'evidence-review' && (
              <EvidenceReviewScreen
                disputeId={activeCaseId}
                onBack={() => setActiveScreen('case-detail')}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'override-console' && (
              <AdminOverrideScreen
                disputeId={activeCaseId}
                onBack={() => setActiveScreen('case-detail')}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'merchant-portal' && (
              <MerchantPortalScreen
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'merchant-profile' && (
              <MerchantProfileScreen
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'reports' && (
              <ReportsAnalyticsScreen
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'system-config' && (
              <SystemConfigScreen
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'password-recovery' && (
              <PasswordRecoveryScreen
                onBackToLogin={() => setActiveScreen('dashboard')}
                onAddToast={addToast}
              />
            )}

            {activeScreen === 'empty-state' && (
              <EmptyDisputesScreen
                onRefresh={() => setActiveScreen('dashboard')}
                onViewReports={() => setActiveScreen('reports')}
              />
            )}

            {activeScreen === 'not-found' && (
              <NotFoundScreen
                onReturnHome={() => setActiveScreen('dashboard')}
              />
            )}
          </div>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default App;
