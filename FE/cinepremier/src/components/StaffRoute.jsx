import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStoredAuth, hasBackendStaffAccess } from '../services/authApi';

export default function StaffRoute({ children }) {
  const { isLoggedIn, currentRole, currentUser } = useAuth();
  const { accessToken, user } = getStoredAuth();
  const hasStoredStaff = hasBackendStaffAccess(accessToken, user);
  const hasContextStaff = currentRole === 'staff' || currentUser?.role === 'staff' || hasBackendStaffAccess(accessToken, currentUser);

  if (!isLoggedIn && !accessToken) return <Navigate to="/" replace />;
  if (!hasStoredStaff && !hasContextStaff) return <Navigate to="/" replace />;
  return children;
}
