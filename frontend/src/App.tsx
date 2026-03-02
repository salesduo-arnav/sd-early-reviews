import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
          <Route path="/seller/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Seller Dashboard</h2></div>} />
        </Route>

        {/* Placeholders for buyer */}
        <Route element={<ProtectedRoute allowedRoles={['BUYER']} />}>
          <Route path="/buyer/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Buyer Dashboard</h2></div>} />
        </Route>

        {/* Placeholders for admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Admin Dashboard</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
