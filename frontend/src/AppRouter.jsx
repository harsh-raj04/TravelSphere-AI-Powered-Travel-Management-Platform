import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AgentLayout } from './components/agent/AgentLayout';
import { AdminLayout } from './components/admin/AdminLayout';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { AgentLogin } from './pages/AgentLogin';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { MyTrips } from './pages/MyTrips';
import { PlanTrip } from './pages/PlanTrip';
import { Bookings } from './pages/Bookings';
import { Profile } from './pages/Profile';
import { PackageListing } from './pages/PackageListing';
import { PackageDetail } from './pages/PackageDetail';
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AgentPackages } from './pages/agent/AgentPackages';
import { AgentPackageForm } from './pages/agent/AgentPackageForm';
import { AgentBookings } from './pages/agent/AgentBookings';
import { AgentAnalytics } from './pages/agent/AgentAnalytics';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookings } from './pages/admin/AdminBookings';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-light-bg-primary dark:bg-dark-bg-primary">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
      <Route path="/agent/login" element={<AppLayout><AgentLogin /></AppLayout>} />
      <Route path="/register" element={<AppLayout><Register /></AppLayout>} />
      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Dashboard /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><Discover /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <RoleRoute allowedRoles={['customer']}>
            <AppLayout><MyTrips /></AppLayout>
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
            <AgentLayout><AgentPackages /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/new"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentPackageForm /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/:id/edit"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentPackageForm /></AgentLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AgentLayout><AgentBookings /></AgentLayout>
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
            <AdminLayout><AdminBookings /></AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/packages"
        element={
          <ProtectedRoute>
            <AppLayout><PackageListing /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/packages/:id"
        element={
          <ProtectedRoute>
            <AppLayout><PackageDetail /></AppLayout>
          </ProtectedRoute>
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
