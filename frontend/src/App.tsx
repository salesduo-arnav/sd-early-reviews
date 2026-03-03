/// <reference types="vite/client" />
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { Toaster } from '@/components/ui/sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

function App() {
  const { isAuthenticated, tokens, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      authApi.me(tokens.accessToken).catch(() => {
        logout(); // Auto-logout if token is invalid or user was deleted from DB
      });
    }
  }, [isAuthenticated, tokens, logout]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Onboarding */}
          <Route element={<ProtectedRoute requireProfile={false} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Placeholders for seller */}
          <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
            <Route path="/seller/*" element={<SellerDashboard />} />
          </Route>

          {/* Placeholders for buyer */}
          <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
            <Route path="/buyer/*" element={<BuyerDashboard />} />
          </Route>

          {/* Admin Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
