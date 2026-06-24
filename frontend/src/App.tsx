import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import DashboardStub from './pages/DashboardStub';
import ProtectedRoute from './routes/ProtectedRoute';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GDPRCompliance from './pages/GDPRCompliance';
import SecurityAudit from './pages/SecurityAudit';

import { PopupProvider } from './context/PopupContext';

function App() {
  return (
    <PopupProvider>
      <AuthProvider>
        <BusinessProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/gdpr" element={<GDPRCompliance />} />
            <Route path="/security" element={<SecurityAudit />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardStub />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </BusinessProvider>
    </AuthProvider>
  </PopupProvider>
  );
}

export default App;
