import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import BLOKLanding from './BLOKLanding';
import SignIn from './SignIn';
import SignUp from './pages/SignUp';
import Lobby from './pages/Lobby';
import Interview from './pages/Interview';
import LiveSession from './pages/LiveSession';
import Report from './pages/Report';
import Profile from './pages/Profile';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import DocsPage from './pages/DocsPage';
import AboutPage from './pages/AboutPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/signin" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BLOKLanding />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Auth-protected routes */}
      <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/session/:sessionId" element={<ProtectedRoute><LiveSession /></ProtectedRoute>} />
      <Route path="/report/:sessionId" element={<ProtectedRoute><Report /></ProtectedRoute>} />

      {/* Legacy practice interview (no auth required) */}
      <Route path="/interview" element={<Interview />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
