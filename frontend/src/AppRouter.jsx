import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { PackageListing } from './pages/PackageListing';
import './AppRouter.css';

function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">TravelSphere</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span className="user-email">{user.email}</span>
            <Link to="/packages">Packages</Link>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <PackageListing />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/packages" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
