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
import { CardholderPortalScreen } from './components/screens/CardholderPortalScreen';
import { LoginScreen, UserPersona } from './components/screens/LoginScreen';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { CaseQueueItem } from './types/dispute';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [activeCaseId, setActiveCaseId] = useState<string>('DSP-1041');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentUser, setCurrentUser] = useState({
    name: 'Priya Sharma',
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveScreen('dashboard');
    addToast({
      type: 'info',
      title: 'Session Locked',
      message: 'Signed out securely. Please authenticate to access the workspace.'
    });
  };

  // If user is not authenticated and hasn't navigated to Password Recovery
  if (!isAuthenticated && activeScreen !== 'password-recovery') {
    return (
      <div className="min-h-screen w-screen bg-slate-950">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <LoginScreen
          onLogin={(user: UserPersona, targetScreen: ScreenId) => {
            setCurrentUser({
              name: user.name,
              role: user.role,
              avatar: user.avatar,
            });
            setActiveScreen(targetScreen);
            setIsAuthenticated(true);
          }}
          onNavigateToForgotPassword={() => {
            setActiveScreen('password-recovery');
          }}
          onAddToast={addToast}
        />
      </div>
    );
  }

  // If user is accessing Password Recovery directly from Login
  if (!isAuthenticated && activeScreen === 'password-recovery') {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <div className="w-full max-w-md">
          <PasswordRecoveryScreen
            onBackToLogin={() => setActiveScreen('dashboard')}
            onAddToast={addToast}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-bg text-slate-800">
      {/* Global Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Fixed Navy Sidebar with Dynamic RBAC */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          setActiveScreen(screen);
          setMobileMenuOpen(false);
        }}
        currentUser={currentUser}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Sticky Top Header */}
        <TopHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            setMobileMenuOpen(false);
            addToast({
              type: 'info',
              title: 'Role Switch',
              message: `Switched active persona to ${user.name} (${user.role})`
            });
            const r = user.role.toLowerCase();
            if (r.includes('cardholder')) {
              setActiveScreen('cardholder-portal');
            } else if (r.includes('merchant') || r.includes('store')) {
              setActiveScreen('merchant-portal');
            } else if (r.includes('investigator')) {
              setActiveScreen('case-queue');
            } else {
              setActiveScreen('dashboard');
            }
          }}
          onNavigateToScreen={(screen, caseId) => {
            if (caseId) setActiveCaseId(caseId);
            setActiveScreen(screen);
            setMobileMenuOpen(false);
            addToast({
              type: 'info',
              title: 'Navigating',
              message: `Opened ${screen}${caseId ? ` for ${caseId}` : ''}`
            });
          }}
        />

        {/* Scrollable Screen Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
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

            {activeScreen === 'cardholder-portal' && (
              <CardholderPortalScreen
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
