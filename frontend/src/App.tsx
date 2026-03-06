/// <reference types="vite/client" />
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import MarketplacePage from './pages/buyer/MarketplacePage';
import MyClaimsPage from './pages/buyer/MyClaimsPage';
import AccountPage from './pages/buyer/AccountPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import CampaignsPage from './pages/seller/CampaignsPage';
import CampaignDetailPage from './pages/seller/CampaignDetailPage';
import ReviewsPage from './pages/seller/ReviewsPage';
import BillingPage from './pages/seller/BillingPage';
import { SellerLayout } from './components/layout/SellerLayout';
import { BuyerLayout } from './components/layout/BuyerLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import NotFoundPage from './pages/NotFound';
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
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
          </Route>

          {/* Buyer Portal */}
          <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
            <Route path="/buyer" element={<BuyerLayout />}>
              <Route index element={<MarketplacePage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="claims" element={<MyClaimsPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
          </Route>

          {/* Admin Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
