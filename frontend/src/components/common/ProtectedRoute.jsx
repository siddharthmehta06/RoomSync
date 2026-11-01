import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
        <p className="text-xs text-ink-secondary mt-3">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Role Guard
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink-primary mb-3">Owner Access Required</h1>
        <p className="text-xs text-ink-secondary max-w-md mx-auto mb-8 leading-relaxed">
          You are currently signed in as a <strong>Room Seeker</strong>. To list properties, manage rental listings, or review booking requests, you must complete the Room Owner identity verification.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/owner/verify">
            <Button variant="primary" size="lg">
              Start Owner Verification
            </Button>
          </a>
          <a href="/explore">
            <Button variant="secondary" size="lg">
              Explore Rooms
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return children;
};
