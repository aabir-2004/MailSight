import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/appStore';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Notifications from './components/Common/Notifications';
import './App.css';

const HomePage      = React.lazy(() => import('./pages/HomePage'));
const SearchPage    = React.lazy(() => import('./pages/SearchPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AnalysePage   = React.lazy(() => import('./pages/AnalysePage'));
const SettingsPage  = React.lazy(() => import('./pages/SettingsPage'));
const AuthPage      = React.lazy(() => import('./pages/AuthPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

const PageSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[1, 2, 3].map((i) => (
      <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
    ))}
  </div>
);

const AppLayout: React.FC = () => {
  const { activePage, sidebarCollapsed, isAuthenticated, setUser } = useAppStore();

  // Handle OAuth callback: parse ?user_id= from URL after Google login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    if (userId && !isAuthenticated) {
      // Set user as authenticated with the returned ID
      setUser({
        id: userId,
        email: '',
        name: 'User',
        picture: '',
      });
      // Clean the URL so ?user_id= doesn't persist
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <AuthPage />
      </Suspense>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home':      return <HomePage />;
      case 'search':    return <SearchPage />;
      case 'dashboard': return <DashboardPage />;
      case 'analyse':   return <AnalysePage />;
      case 'settings':  return <SettingsPage />;
      default:          return <HomePage />;
    }
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar />
      <Topbar />

      <main className="app-main" id="app-main-content" role="main">
        <Suspense fallback={<PageSkeleton />}>
          {renderPage()}
        </Suspense>
      </main>

      <Notifications />
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppLayout />
  </QueryClientProvider>
);

export default App;
