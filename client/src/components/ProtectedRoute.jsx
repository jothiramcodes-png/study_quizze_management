import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">Loading...</div>;
  }

  if (!user) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes((user.role || '').toLowerCase())) {
    // Role not authorized, redirect to their specific dashboard
    return <Navigate to={`/dashboard/${(user.role || '').toLowerCase()}`} replace />;
  }

  return children;
}
