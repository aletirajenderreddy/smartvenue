import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import FloatingSOS from '../components/common/FloatingSOS';
import Skeleton from '../components/ui/skeleton';
import { useAuth } from '../hooks/useAuth';

/* ──────────────────────────────────────────── Lazy pages */
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RoleSelectionPage = lazy(() => import('../pages/auth/RoleSelectionPage'));
const AdminOnboardingPage = lazy(() => import('../pages/onboarding/AdminOnboardingPage'));
const ParticipantOnboardingPage = lazy(() => import('../pages/onboarding/ParticipantOnboardingPage'));
const VendorOnboardingPage = lazy(() => import('../pages/onboarding/VendorOnboardingPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

// Admin sub-pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminCrowdPage = lazy(() => import('../pages/admin/AdminCrowdPage'));
const AdminSosPage = lazy(() => import('../pages/admin/AdminSosPage'));
const AdminStallsPage = lazy(() => import('../pages/admin/AdminStallsPage'));
const AdminSchedulePage = lazy(() => import('../pages/admin/AdminSchedulePage'));

// Participant pages
const FoodPage = lazy(() => import('../pages/food/FoodPage'));
const OrdersPage = lazy(() => import('../pages/food/OrdersPage'));
const ZonesPage = lazy(() => import('../pages/crowd/ZonesPage'));
const QrPassPage = lazy(() => import('../pages/ticket/QrPassPage'));
const NotificationsListPage = lazy(() => import('../pages/home/NotificationsListPage'));

// Vendor pages
const VendorOrdersPage = lazy(() => import('../pages/dashboard/VendorOrdersPage'));

/* ──────────────────────────────────────────── Loading skeleton */
function PageFallback() {
  return (
    <main className='space-y-3 p-4' aria-label='Loading page'>
      <Skeleton className='h-8 w-3/5' />
      <Skeleton className='h-28 w-full' />
      <Skeleton className='h-16 w-full' />
    </main>
  );
}

/* ──────────────────────────────────────────── Route helpers */
function nextPath(user, profile) {
  if (!user) return '/login';
  if (!profile?.role) return '/role-select';
  if (!profile?.onboarding_completed) return `/onboarding/${profile.role}`;
  return '/dashboard';
}

function GuestOnly({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (user) return <Navigate to={nextPath(user, profile)} replace />;
  return children;
}

function Authenticated({ children, allowRoleSelection = false, expectedRole = null, requireComplete = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageFallback />;
  if (!user) return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  if (!profile?.role) {
    return allowRoleSelection ? children : <Navigate to='/role-select' replace />;
  }
  if (allowRoleSelection) return <Navigate to={nextPath(user, profile)} replace />;
  if (expectedRole && profile.role !== expectedRole) return <Navigate to={nextPath(user, profile)} replace />;
  if (requireComplete && !profile.onboarding_completed) return <Navigate to={`/onboarding/${profile.role}`} replace />;
  if (!requireComplete && profile.onboarding_completed) return <Navigate to='/dashboard' replace />;
  return children;
}

/* Wrapper that adds AppShell and optionally FloatingSOS */
function ShellPage({ children, role }) {
  const { profile } = useAuth();
  const showSos = profile?.role === 'participant';
  return (
    <AppShell>
      {children}
      {showSos && role !== 'admin' ? <FloatingSOS /> : null}
    </AppShell>
  );
}

export default function Router() {
  const { profile } = useAuth();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public */}
        <Route path='/login' element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path='/role-select' element={<Authenticated allowRoleSelection><RoleSelectionPage /></Authenticated>} />

        {/* Onboarding */}
        <Route path='/onboarding/admin' element={<Authenticated expectedRole='admin'><AdminOnboardingPage /></Authenticated>} />
        <Route path='/onboarding/participant' element={<Authenticated expectedRole='participant'><ParticipantOnboardingPage /></Authenticated>} />
        <Route path='/onboarding/vendor' element={<Authenticated expectedRole='vendor'><VendorOnboardingPage /></Authenticated>} />

        {/* Main dashboard (role-based) */}
        <Route
          path='/dashboard'
          element={
            <Authenticated requireComplete>
              <ShellPage>
                {profile?.role === 'admin' ? <AdminDashboard /> : <DashboardPage />}
              </ShellPage>
            </Authenticated>
          }
        />

        {/* ── Admin sub-routes ── */}
        <Route path='/admin/crowd' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><AdminCrowdPage /></ShellPage></Authenticated>} />
        <Route path='/admin/sos' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><AdminSosPage /></ShellPage></Authenticated>} />
        <Route path='/admin/stalls' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><AdminStallsPage /></ShellPage></Authenticated>} />
        <Route path='/admin/schedule' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><AdminSchedulePage /></ShellPage></Authenticated>} />
        <Route path='/admin/participants' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><DashboardPage /></ShellPage></Authenticated>} />
        <Route path='/admin/notifications' element={<Authenticated requireComplete expectedRole='admin'><ShellPage><DashboardPage /></ShellPage></Authenticated>} />

        {/* ── Participant routes ── */}
        <Route path='/food' element={<Authenticated requireComplete expectedRole='participant'><ShellPage><FoodPage /></ShellPage></Authenticated>} />
        <Route path='/orders' element={<Authenticated requireComplete><ShellPage>{profile?.role === 'vendor' ? <VendorOrdersPage /> : <OrdersPage />}</ShellPage></Authenticated>} />
        <Route path='/zones' element={<Authenticated requireComplete expectedRole='participant'><ShellPage><ZonesPage /></ShellPage></Authenticated>} />
        <Route path='/qr-pass' element={<Authenticated requireComplete expectedRole='participant'><ShellPage><QrPassPage /></ShellPage></Authenticated>} />
        <Route path='/notifications-list' element={<Authenticated requireComplete><ShellPage><NotificationsListPage /></ShellPage></Authenticated>} />

        {/* ── Vendor routes ── */}
        <Route path='/stall' element={<Authenticated requireComplete expectedRole='vendor'><ShellPage><VendorOrdersPage /></ShellPage></Authenticated>} />

        {/* Landing */}
        <Route path='/' element={<GuestOnly><LandingPage /></GuestOnly>} />

        {/* Fallbacks */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Suspense>
  );
}
