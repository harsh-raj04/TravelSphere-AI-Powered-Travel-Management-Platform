import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PackageListing } from './pages/PackageListing';
import { PackageDetail } from './pages/PackageDetail';

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
