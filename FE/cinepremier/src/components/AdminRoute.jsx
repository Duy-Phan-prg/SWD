import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStoredAuth, hasBackendAdminAccess } from '../services/authApi';

export default function AdminRoute({ children }) {
  const { isLoggedIn, isAuthReady, currentRole, currentUser } = useAuth();
  const { accessToken, user } = getStoredAuth();
  const hasStoredAdmin = hasBackendAdminAccess(accessToken, user);
  const hasContextAdmin = currentRole === 'admin' || currentUser?.role === 'admin' || hasBackendAdminAccess(accessToken, currentUser);

  if (!isAuthReady) return null;
  if (!isLoggedIn && !accessToken) return <Navigate to="/" replace />;
  if (!hasStoredAdmin && !hasContextAdmin) return <Navigate to="/" replace />;
  return children;
}
