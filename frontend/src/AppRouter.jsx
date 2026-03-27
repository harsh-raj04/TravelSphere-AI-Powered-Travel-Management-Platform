import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
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
            <AppLayout><AgentDashboard /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AppLayout><AgentPackages /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/new"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AppLayout><AgentPackageForm /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/packages/:id/edit"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AppLayout><AgentPackageForm /></AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/agent/bookings"
        element={
          <RoleRoute allowedRoles={['agent']}>
            <AppLayout><AgentBookings /></AppLayout>
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
