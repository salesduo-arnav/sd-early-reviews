import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Placeholders for seller */}
        <Route path="/seller/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Seller Dashboard</h2></div>} />

        {/* Placeholders for buyer */}
        <Route path="/buyer/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Buyer Dashboard</h2></div>} />

        {/* Placeholders for admin */}
        <Route path="/admin/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Admin Dashboard</h2></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
