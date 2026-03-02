import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Placeholders for seller */}
        <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
          <Route path="/seller/*" element={<SellerDashboard />} />
        </Route>

        {/* Placeholders for buyer */}
        <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
          <Route path="/buyer/*" element={<BuyerDashboard />} />
        </Route>

        {/* Placeholders for admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Admin Dashboard</h2></div>} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
