import React from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Layout from './layout/Layout';
import HomeView from './pages/HomePage';
import ExploreView from './pages/ExplorePage';
import DetailView from './pages/MovieDetailPage';
import BookingView from './pages/BookingPage';
import ProfileView from './pages/ProfilePage';
import MyTicketsView from './pages/MyTicketsPage';
import WishlistView from './pages/WishlistPage';
import AdminDashboard from './pages/AdminPage';
import PoliciesPage from './pages/PoliciesPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import StaffCheckInPage from './pages/StaffCheckInPage';
import GooglePasswordSetupPage from './pages/GooglePasswordSetupPage';
import AdminRoute from './components/AdminRoute';
import StaffRoute from './components/StaffRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MoviesProvider, useMovies } from './contexts/MoviesContext';

function AppShell({ children }) {
  return <Layout>{children}</Layout>;
}

function HomeRoute() {
  const navigate = useNavigate();
  const { moviesList } = useMovies();
  const { showToast } = useUI();

  const goToTab = (tab) => {
    const paths = { home: '/', explore: '/movies', 'my-tickets': '/tickets', wishlist: '/watchlist', profile: '/profile', policies: '/policies' };
    navigate(paths[tab] || '/');
  };

  const handleBookMovie = (movie) => {
    const isBookable = movie?.status === 'NOW_SHOWING' || (!movie?.status && !movie?.isUpcoming);
    if (!isBookable) {
      showToast('Phim sắp chiếu chưa mở bán vé.');
      navigate(`/movies/${movie.id}`);
      return;
    }
    navigate(`/movies/${movie.id}/book`);
  };

  return (
    <HomeView
      moviesList={moviesList}
      onSelectMovie={(id) => navigate(`/movies/${id}`)}
      onBookMovie={handleBookMovie}
      onTabChange={goToTab}
    />
  );
}

function AdminRouteView() {
  const navigate = useNavigate();
  const { section = 'overview' } = useParams();
  const { showToast } = useUI();
  const { currentRole, currentUser } = useAuth();
  const {
    moviesList,
    setMoviesList,
    bookedTickets,
    setBookedTickets,
    fetchPublicFoodCatalog,
    publicCinema,
    fetchPublicCinema,
  } = useMovies();

  return (
    <AdminRoute>
      <AdminDashboard
        moviesList={moviesList}
        setMoviesList={setMoviesList}
        bookedTickets={bookedTickets}
        setBookedTickets={setBookedTickets}
        publicCinema={publicCinema}
        onCinemaChanged={fetchPublicCinema}
        onSelectMovie={(id) => navigate(`/movies/${id}`)}
        showToast={showToast}
        initialSection={section}
        onSectionChange={(nextSection) => navigate(`/admin/${nextSection}`)}
        onFoodCatalogChanged={() => fetchPublicFoodCatalog({ force: true })}
        isAdmin={currentRole === 'admin'}
        currentUser={currentUser}
      />
    </AdminRoute>
  );
}

function AppRoutes() {
  const { currentUser } = useAuth();
  const mustSetupPassword = currentUser?.passwordChangeRequired;

  return (
    <Routes>
      <Route path="/setup-password" element={<GooglePasswordSetupPage />} />
      {mustSetupPassword && <Route path="*" element={<Navigate to="/setup-password" replace />} />}
      <Route path="/payment-callback" element={<PaymentCallbackPage />} />
      <Route path="/staff" element={<AppShell><StaffRoute><StaffCheckInPage /></StaffRoute></AppShell>} />
      <Route path="/" element={<AppShell><HomeRoute /></AppShell>} />
      <Route path="/movies" element={<AppShell><ExploreView /></AppShell>} />
      <Route path="/movies/:id" element={<AppShell><DetailView /></AppShell>} />
      <Route path="/movies/:id/book" element={<AppShell><ProtectedRoute><BookingView /></ProtectedRoute></AppShell>} />
      <Route path="/tickets" element={<AppShell><ProtectedRoute><MyTicketsView /></ProtectedRoute></AppShell>} />
      <Route path="/watchlist" element={<AppShell><ProtectedRoute><WishlistView /></ProtectedRoute></AppShell>} />
      <Route path="/profile" element={<AppShell><ProtectedRoute><ProfileView /></ProtectedRoute></AppShell>} />
      <Route path="/policies" element={<AppShell><PoliciesPage /></AppShell>} />
      <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
      <Route path="/admin/:section" element={<AppShell><AdminRouteView /></AppShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <MoviesProvider>
          <AppRoutes />
        </MoviesProvider>
      </AuthProvider>
    </UIProvider>
  );
}
