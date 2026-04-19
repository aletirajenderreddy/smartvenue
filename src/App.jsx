import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineBanner from './components/common/OfflineBanner';
import NotifBanner from './components/notifications/NotifBanner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Router from './router';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <OfflineBanner />
            <NotifBanner />
            <Router />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
