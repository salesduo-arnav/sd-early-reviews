import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Placeholders for auth */}
        <Route path="/login" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Login</h2></div>} />
        <Route path="/signup" element={<div className="container" style={{ paddingTop: '120px' }}><h2>Signup</h2></div>} />

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
