import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import { UIProvider } from './contexts/UIContext';
import { AuthProvider } from './contexts/AuthContext';
import { MoviesProvider } from './contexts/MoviesContext';
import Layout from './layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import MyTicketsPage from './pages/MyTicketsPage';
import WishlistPage from './pages/WishlistPage';
import AdminPage from './pages/AdminPage';
import PoliciesPage from './pages/PoliciesPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<ExplorePage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/movies/:id/book" element={<BookingPage />} />
          <Route path="/watchlist" element={<WishlistPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/payment-callback" element={<PaymentCallbackPage />} />
          <Route path="/tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/:section" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <MoviesProvider>
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </MoviesProvider>
      </AuthProvider>
    </UIProvider>
  );
}
