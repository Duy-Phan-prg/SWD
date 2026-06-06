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
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MoviesProvider, useMovies } from './contexts/MoviesContext';

function AppShell({ children }) {
  return <Layout>{children}</Layout>;
}

function HomeRoute() {
  const navigate = useNavigate();
  const { moviesList, homepageVideoUrl } = useMovies();

  const goToTab = (tab) => {
    const paths = { home: '/', explore: '/movies', 'my-tickets': '/tickets', wishlist: '/watchlist', profile: '/profile', policies: '/policies' };
    navigate(paths[tab] || '/');
  };

  return (
    <HomeView
      moviesList={moviesList}
      homepageVideoUrl={homepageVideoUrl}
      onSelectMovie={(id) => navigate(`/movies/${id}`)}
      onBookMovie={(movie) => navigate(`/movies/${movie.id}/book`)}
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
    homepageVideoUrl,
    handleHomepageVideoUrlChange,
    fetchPublicFoodCatalog,
    cinemaLocations,
    fetchPublicCinema,
  } = useMovies();

  return (
    <AdminRoute>
      <AdminDashboard
        moviesList={moviesList}
        setMoviesList={setMoviesList}
        bookedTickets={bookedTickets}
        setBookedTickets={setBookedTickets}
        cinemaLocations={cinemaLocations}
        onCinemaChanged={fetchPublicCinema}
        onSelectMovie={(id) => navigate(`/movies/${id}`)}
        showToast={showToast}
        initialSection={section}
        onSectionChange={(nextSection) => navigate(`/admin/${nextSection}`)}
        homepageVideoUrl={homepageVideoUrl}
        onHomepageVideoUrlChange={handleHomepageVideoUrlChange}
        onFoodCatalogChanged={fetchPublicFoodCatalog}
        isAdmin={currentRole === 'admin'}
        currentUser={currentUser}
      />
    </AdminRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/payment-callback" element={<PaymentCallbackPage />} />
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
