import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { isLoggedIn, currentRole } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (currentRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}
