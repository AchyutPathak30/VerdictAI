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
import { CaseQueueItem } from './types/dispute';

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [currentUser, setCurrentUser] = useState({
    name: 'Elena Vance',
    role: 'Admin Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  });

  const handleSelectCase = (caseItem: CaseQueueItem) => {
    if (caseItem.id === 'DS-8812' || caseItem.action === 'Override') {
      setActiveScreen('override-console');
    } else {
      setActiveScreen('case-detail');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-bg text-slate-800">
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
              />
            )}

            {activeScreen === 'case-queue' && (
              <CaseQueueScreen
                onSelectCase={handleSelectCase}
              />
            )}

            {activeScreen === 'case-detail' && (
              <CaseDetailScreen
                onBack={() => setActiveScreen('dashboard')}
                onNavigateToOverride={() => setActiveScreen('override-console')}
              />
            )}

            {activeScreen === 'override-console' && (
              <AdminOverrideScreen
                onBack={() => setActiveScreen('case-detail')}
              />
            )}

            {activeScreen === 'merchant-portal' && (
              <MerchantPortalScreen />
            )}

            {activeScreen === 'reports' && (
              <ReportsAnalyticsScreen />
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
