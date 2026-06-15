import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        {/* Modern animated loading spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-navy/5"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-green border-r-green/30 animate-spin"></div>
        </div>
        <p className="text-text-secondary text-sm font-semibold tracking-widest uppercase animate-pulse">
          Securing Session...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login while saving the attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
