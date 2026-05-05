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
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentPackages } from './pages/agent/AgentPackages';
import { AgentPackagesBrowse } from './pages/agent/AgentPackagesBrowse';
import { AgentPackageDetail } from './pages/agent/AgentPackageDetail';
import { AgentBookings } from './pages/agent/AgentBookings';
import { AgentBookingsNew } from './pages/agent/AgentBookingsNew';
import { AgentBookingDetail } from './pages/agent/AgentBookingDetail';
import { AgentAnalytics } from './pages/agent/AgentAnalytics';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookingsNew } from './pages/admin/AdminBookingsNew';
import { AdminBookingDetail } from './pages/admin/AdminBookingDetail';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminAgents } from './pages/admin/AdminAgents';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminSettings } from './pages/admin/AdminSettings';
import { getHomeRouteForRole, isRoleAllowedForVariant } from './utils/roleRouting';

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
      <Route
        path="/agent/dashboard"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentDashboard /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentPackagesBrowse /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/:id"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentPackageDetail /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentBookingsNew /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings/:id"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentBookingDetail /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/analytics"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentAnalytics /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminBookingsNew /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/bookings/:id"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminBookingDetail /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminPackages /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/agents"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminAgents /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminCustomers /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminPayments /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminAnalytics /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/support"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminSupport /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout><AdminSettings /></AdminLayout>
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
