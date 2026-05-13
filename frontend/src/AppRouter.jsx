import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookingEventProvider } from './contexts/BookingEventContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AgentLayout } from './components/agent/AgentLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Customer pages — eager loaded
import { Home } from './pages/Home';
import { AgentHome } from './pages/AgentHome';
import { AdminHome } from './pages/AdminHome';
import { Login } from './pages/Login';
import { AgentLogin } from './pages/AgentLogin';
import { AdminLogin } from './pages/AdminLogin';
import { Register } from './pages/Register';
import { AgentRegister } from './pages/AgentRegister';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { PlanTrip } from './pages/PlanTrip';
import { Bookings } from './pages/Bookings';
import { Profile } from './pages/Profile';
import { PackageListing } from './pages/PackageListing';
import { PackageDetail } from './pages/PackageDetail';
import { Packages } from './pages/Packages';

import { getHomeRouteForRole, isRoleAllowedForVariant } from './utils/roleRouting';

// Lazy-load agent pages
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard').then(m => ({ default: m.AgentDashboard })));
const AgentPackages = lazy(() => import('./pages/agent/AgentPackages').then(m => ({ default: m.AgentPackages })));
const AgentPackagesBrowse = lazy(() => import('./pages/agent/AgentPackagesBrowse').then(m => ({ default: m.AgentPackagesBrowse })));
const AgentPackageDetail = lazy(() => import('./pages/agent/AgentPackageDetail').then(m => ({ default: m.AgentPackageDetail })));
const AgentBookings = lazy(() => import('./pages/agent/AgentBookings').then(m => ({ default: m.AgentBookings })));
const AgentBookingsNew = lazy(() => import('./pages/agent/AgentBookingsNew').then(m => ({ default: m.AgentBookingsNew })));
const AgentBookingDetail = lazy(() => import('./pages/agent/AgentBookingDetail').then(m => ({ default: m.AgentBookingDetail })));
const AgentAnalytics = lazy(() => import('./pages/agent/AgentAnalytics').then(m => ({ default: m.AgentAnalytics })));
const AgentPayments = lazy(() => import('./pages/agent/AgentPayments').then(m => ({ default: m.AgentPayments })));
const AgentProfile = lazy(() => import('./pages/agent/AgentProfile').then(m => ({ default: m.AgentProfile })));
const AgentSettings = lazy(() => import('./pages/agent/AgentSettings').then(m => ({ default: m.AgentSettings })));
const AgentNotifications = lazy(() => import('./pages/agent/AgentNotifications').then(m => ({ default: m.AgentNotifications })));
const AgentDocuments = lazy(() => import('./pages/agent/AgentDocuments').then(m => ({ default: m.AgentDocuments })));
const AgentSecurity = lazy(() => import('./pages/agent/AgentSecurity').then(m => ({ default: m.AgentSecurity })));
const AgentSupport = lazy(() => import('./pages/agent/AgentSupport').then(m => ({ default: m.AgentSupport })));

// Lazy-load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminBookingsNew = lazy(() => import('./pages/admin/AdminBookingsNew').then(m => ({ default: m.AdminBookingsNew })));
const AdminBookingDetail = lazy(() => import('./pages/admin/AdminBookingDetail').then(m => ({ default: m.AdminBookingDetail })));
const AdminPackages = lazy(() => import('./pages/admin/AdminPackages').then(m => ({ default: m.AdminPackages })));
const AdminPackageDetail = lazy(() => import('./pages/admin/AdminPackageDetail').then(m => ({ default: m.AdminPackageDetail })));
const AdminCustomerProfile = lazy(() => import('./pages/admin/AdminCustomerProfile').then(m => ({ default: m.AdminCustomerProfile })));
const AdminAgentProfile = lazy(() => import('./pages/admin/AdminAgentProfile').then(m => ({ default: m.AdminAgentProfile })));
const AdminAgents = lazy(() => import('./pages/admin/AdminAgents').then(m => ({ default: m.AdminAgents })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport').then(m => ({ default: m.AdminSupport })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

// Suspense fallback spinner
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="travel-ui min-h-screen flex flex-col bg-[#F0FDFA] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const variant = (import.meta.env.VITE_APP_VARIANT || 'customer').toLowerCase();
  const variantLoginRoute =
    variant === 'admin' ? '/admin/login' : variant === 'agent' ? '/agent/login' : '/login';

  const RootHome = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-light-bg-primary dark:bg-dark-bg-primary">
          <div className="w-8 h-8 border-4 border-light-border dark:border-dark-border border-t-brand-primary dark:border-t-brand-secondary rounded-full animate-spin" />
        </div>
      );
    }

    if (user?.role) {
      if (!isRoleAllowedForVariant(user.role, variant)) {
        return <Navigate to={variantLoginRoute} replace />;
      }

      return <Navigate to={getHomeRouteForRole(user.role)} replace />;
    }

    if (variant === 'agent') return <AgentHome />;
    if (variant === 'admin') return <AdminHome />;
    return <AppLayout><Home /></AppLayout>;
  };

  return (
    <Routes>
      <Route path="/" element={<RootHome />} />
      <Route
        path="/login"
        element={
          variant === 'customer'
            ? <AppLayout><Login /></AppLayout>
            : <Navigate to={variantLoginRoute} replace />
        }
      />
      <Route
        path="/agent/login"
        element={
          variant === 'agent'
            ? <AppLayout><AgentLogin /></AppLayout>
            : <Navigate to={variantLoginRoute} replace />
        }
      />
      <Route
        path="/admin/login"
        element={
          variant === 'admin'
            ? <AppLayout><AdminLogin /></AppLayout>
            : <Navigate to={variantLoginRoute} replace />
        }
      />
      <Route
        path="/agent/register"
        element={
          variant === 'agent'
            ? <AppLayout><AgentRegister /></AppLayout>
            : <Navigate to={variantLoginRoute} replace />
        }
      />
      <Route
        path="/register"
        element={
          variant === 'customer'
            ? <AppLayout><Register /></AppLayout>
            : <Navigate to={variantLoginRoute} replace />
        }
      />
      <Route
        path="/home"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Dashboard /></AppLayout>
          </RoleRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route
        path="/discover"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Discover /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><PlanTrip /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Bookings /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Profile /></AppLayout>
          </RoleRoute>
        }
      />

      {/* Agent routes — lazy loaded */}
      <Route
        path="/agent/dashboard"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentDashboard /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentPackagesBrowse /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/:id"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentPackageDetail /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentBookingsNew /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings/:id"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentBookingDetail /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/analytics"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentAnalytics /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/payments"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentPayments /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/profile"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentProfile /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/settings"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentSettings /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/notifications"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentNotifications /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/documents"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentDocuments /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/security"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentSecurity /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/support"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <Suspense fallback={<PageLoader />}>
              <AgentLayout><AgentSupport /></AgentLayout>
            </Suspense>
          </RoleRoute>
        }
      />

      {/* Admin routes — lazy loaded */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminBookingsNew /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/bookings/:id"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminBookingDetail /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminPackages /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/packages/:id"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminPackageDetail /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/customers/:id"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminCustomerProfile /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/agents/:id"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminAgentProfile /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminAgents /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminCustomers /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminTransactions /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminWithdrawals /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminAnalytics /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/support"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminSupport /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminLayout><AdminSettings /></AdminLayout>
            </Suspense>
          </RoleRoute>
        }
      />
      <Route
        path="/packages"
        element={
          variant === 'customer'
            ? <AppLayout><Packages /></AppLayout>
            : <AppLayout><PackageListing /></AppLayout>
        }
      />
      <Route
        path="/packages/:id"
        element={
          variant === 'customer'
            ? <AppLayout><PackageDetail /></AppLayout>
            : <ProtectedRoute><AppLayout><PackageDetail /></AppLayout></ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <BookingEventProvider>
              <AppRoutes />
            </BookingEventProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
