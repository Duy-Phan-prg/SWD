import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStoredAuth, hasBackendAdminAccess } from '../services/authApi';

export default function AdminRoute({ children }) {
  const { isLoggedIn, currentRole } = useAuth();
  const { accessToken, user } = getStoredAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (currentRole !== 'admin' || !hasBackendAdminAccess(accessToken, user)) return <Navigate to="/" replace />;
  return children;
}
