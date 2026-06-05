import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './layout/Header';
import Footer from './layout/Footer';
import HomeView from './pages/HomePage';
import ExploreView from './pages/ExplorePage';
import DetailView from './pages/MovieDetailPage';
import BookingView from './pages/BookingPage';
import ProfileView from './pages/ProfilePage';
import MyTicketsView from './pages/MyTicketsPage';
import WishlistView from './pages/WishlistPage';
import AdminDashboard from './pages/AdminPage';
import PoliciesPage from './pages/PoliciesPage';
import AuthModal from './features/auth/AuthModal';
import { movies, cinemaLocations } from './services/cinemaData';
import { authApi, clearAuthSession, getStoredAuth, hasBackendAdminAccess, normalizeUser, saveAuthSession } from './services/authApi';
import { X, Ticket } from 'lucide-react';

export default function App() {
  const resolveRoute = () => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const adminMatch = path.match(/^\/admin(?:\/([a-z-]+))?$/);
    if (adminMatch) return { tab: 'admin', adminSection: adminMatch[1] || 'overview' };
    if (path === '/movies') return { tab: 'explore', adminSection: 'overview' };
    if (path === '/tickets') return { tab: 'my-tickets', adminSection: 'overview' };
    if (path === '/watchlist') return { tab: 'wishlist', adminSection: 'overview' };
    if (path === '/profile') return { tab: 'profile', adminSection: 'overview' };
    if (path === '/policies') return { tab: 'policies', adminSection: 'overview' };
    return { tab: 'home', adminSection: 'overview' };
  };

  const initialRoute = resolveRoute();
  const [activeTab, setActiveTab] = useState(initialRoute.tab);
  const [moviesList, setMoviesList] = useState(movies);
  const [moviePagination, setMoviePagination] = useState({
    page: 0,
    size: 8,
    totalPages: Math.max(1, Math.ceil(movies.length / 8)),
    totalElements: movies.length
  });
  const [isMoviesLoading, setIsMoviesLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState('user'); // 'user' | 'admin'
  const [adminSection, setAdminSection] = useState(initialRoute.adminSection);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [bookingMovie, setBookingMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [movieDateFilter, setMovieDateFilter] = useState('');
  const [selectedCity, setSelectedCity] = useState(cinemaLocations[0]);

  // Modals state
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [ticketOTP, setTicketOTP] = useState('');

  // Watchlist & Booked Tickets state
  const [watchlist, setWatchlist] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [homepageVideoUrl, setHomepageVideoUrl] = useState(() => (
    localStorage.getItem('cinepremier_homepage_video_url') || 'https://www.youtube.com/watch?v=k8m0SaGQ_1c'
  ));
  const [foodCatalog, setFoodCatalog] = useState([]);
  const [toast, setToast] = useState(null); // { id, text, durationMs, remainingMs, action, tone }
  const toastTimerRef = React.useRef(null);

  const navigateApp = (tab, section = null) => {
    setActiveTab(tab);
    const pagePaths = {
      home: '/',
      explore: '/movies',
      'my-tickets': '/tickets',
      wishlist: '/watchlist',
      profile: '/profile',
      policies: '/policies'
    };

    if (tab === 'admin') {
      const nextSection = section || adminSection || 'overview';
      setAdminSection(nextSection);
      window.history.replaceState(null, '', `/admin/${nextSection}`);
    } else {
      window.history.replaceState(null, '', pagePaths[tab] || '/');
    }
  };

  const showToast = (text, durationMs = 4500, action = null, tone = 'success') => {
    setToast({
      id: Date.now(),
      text,
      durationMs,
      remainingMs: durationMs,
      action,
      tone
    });
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    if (toastTimerRef.current) {
      clearInterval(toastTimerRef.current);
    }

    toastTimerRef.current = setInterval(() => {
      setToast((prev) => {
        if (!prev) return prev;
        const nextRemaining = Math.max(prev.remainingMs - 250, 0);
        if (nextRemaining === 0) {
          clearInterval(toastTimerRef.current);
          toastTimerRef.current = null;
          return null;
        }
        return { ...prev, remainingMs: nextRemaining };
      });
    }, 250);

    return () => {
      if (toastTimerRef.current) {
        clearInterval(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast?.id]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsMoviesLoading(true);
      try {
        const pageData = await authApi.searchMoviesPage({
          keyword: activeTab === 'explore' ? searchQuery.trim() : '',
          fromDate: activeTab === 'explore' ? movieDateFilter : '',
          toDate: activeTab === 'explore' ? movieDateFilter : '',
          page: moviePagination.page,
          size: moviePagination.size
        });
        if (!cancelled) {
          const visibleMovies = pageData.items.filter((movie) => movie.status !== 'INACTIVE' && !movie.isInactive);
          setMoviesList(visibleMovies);
          setMoviePagination((prev) => ({
            ...prev,
            page: pageData.page,
            size: pageData.size,
            totalPages: pageData.totalPages,
            totalElements: pageData.totalElements
          }));
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error.message || 'Không thể tải danh sách phim từ hệ thống. Đang dùng dữ liệu mẫu.', 5000, null, 'sad');
        }
      } finally {
        if (!cancelled) setIsMoviesLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, searchQuery, movieDateFilter, moviePagination.page, moviePagination.size]);

  useEffect(() => {
    const restoreSession = async () => {
      const { accessToken, refreshToken, user } = getStoredAuth();
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setCurrentRole(user.role || 'user');
      }

      if (!accessToken && !refreshToken) return;
      if (accessToken && user) return;

      try {
        let token = accessToken;
        if (!token && refreshToken) {
          const refreshed = await authApi.refresh(refreshToken);
          const refreshedUser = saveAuthSession(refreshed);
          token = refreshed.accessToken;
          setCurrentUser(refreshedUser);
          setCurrentRole(refreshedUser.role || 'user');
          setIsLoggedIn(true);
        }

        let profile;
        try {
          profile = await authApi.getMyProfile(token);
        } catch (error) {
          if (!refreshToken) throw error;
          const refreshed = await authApi.refresh(refreshToken);
          const refreshedUser = saveAuthSession(refreshed);
          token = refreshed.accessToken;
          setCurrentUser(refreshedUser);
          setCurrentRole(refreshedUser.role || 'user');
          profile = await authApi.getMyProfile(token);
        }
        const nextUser = normalizeUser(profile, profile.roles || user?.roles || []);
        localStorage.setItem('cinepremier_auth_user', JSON.stringify(nextUser));
        setCurrentUser(nextUser);
        setCurrentRole(nextUser.role || 'user');
        setIsLoggedIn(true);
      } catch (error) {
        clearAuthSession();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentRole('user');
      }
    };

    restoreSession();
  }, []);

  const performLogout = async () => {
    const { refreshToken } = getStoredAuth();
    if (!refreshToken) {
      showToast("Không tìm thấy refresh token. Vui lòng đăng nhập lại để đồng bộ phiên với server.");
      return;
    }

    try {
      await authApi.logout(refreshToken);
      clearAuthSession();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentRole('user');
      navigateApp('home');
      showToast("Đăng xuất tài khoản thành công.");
    } catch (error) {
      showToast(error.message || "Không thể kết nối BE để đăng xuất. Tài khoản vẫn được giữ đăng nhập trên FE.");
    }
  };

  const handleLogout = () => {
    showToast(
      "Bạn có chắc muốn đăng xuất không?\nCinePremier sẽ nhớ bạn lắm đó...",
      10000,
      {
        label: 'Đăng xuất',
        onClick: performLogout
      },
      'sad'
    );
  };

  // Load sample initial watchlist if empty
  useEffect(() => {
    if (moviesList && moviesList.length >= 3) {
      setWatchlist([
        moviesList[0], // Neon Horizon
        moviesList[2]  // The Last Shadow
      ]);
    }
  }, [moviesList]);

  const normalizeFoodCatalog = (items = [], combos = []) => [
    ...combos.map((item) => ({
      ...item,
      id: `combo-${item.id}`,
      backendId: item.id,
      foodComboId: item.id,
      category: 'combo'
    })),
    ...items.map((item) => ({
      ...item,
      id: `item-${item.id}`,
      backendId: item.id,
      foodItemId: item.id,
      category: 'item'
    }))
  ];

  const fetchPublicFoodCatalog = async () => {
    try {
      const [items, combos] = await Promise.all([
        authApi.getFoodItems(),
        authApi.getFoodCombos()
      ]);
      setFoodCatalog(normalizeFoodCatalog(items || [], combos || []));
    } catch (error) {
      setFoodCatalog([]);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setFoodCatalog([]);
      return;
    }

    fetchPublicFoodCatalog();
  }, [isLoggedIn]);

  // Handle Select Movie Detail
  const handleSelectMovie = (id) => {
    setSelectedMovieId(id);
    setBookingMovie(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Book Movie
  const handleBookMovie = (movie) => {
    setBookingMovie(movie);
    setSelectedMovieId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Confirm Ticket Booking
  const handleConfirmBooking = (booking) => {
    const randomTicketId = 'CP-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket = {
      ...booking,
      ticketId: randomTicketId,
      bookingTime: new Date().toLocaleString()
    };

    setBookedTickets([newTicket, ...bookedTickets]);
    setBookingMovie(null);
    setSelectedMovieId(null);
    setShowWatchlist(true); // Open tickets panel to show success!
    showToast(`Xác thực giao dịch thành công!\nMã vé của bạn là: ${randomTicketId}\nHệ thống đã lưu vé của bạn vào mục "Vé & Watchlist".`);
  };

  const handleToggleWatchlist = (movie) => {
    const exists = watchlist.find(m => m.id === movie.id);
    if (exists) {
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    } else {
      setWatchlist(prev => [...prev, movie]);
    }
  };

  const handleHomepageVideoUrlChange = (url) => {
    setHomepageVideoUrl(url);
    localStorage.setItem('cinepremier_homepage_video_url', url);
    showToast('Đã cập nhật video nền trang chủ.');
  };

  useEffect(() => {
    if (!selectedMovieId) return undefined;

    let cancelled = false;
    const currentFallback = moviesList.find((movie) => movie.id === selectedMovieId);

    const fetchMovieDetail = async () => {
      try {
        const { accessToken, user } = getStoredAuth();
        const detail = currentRole === 'admin' && hasBackendAdminAccess(accessToken, user)
          ? await authApi.getAdminMovieDetail(accessToken, selectedMovieId)
          : await authApi.getMovieDetail(selectedMovieId);

        if (cancelled || !detail?.id) return;
        const nextMovie = { ...currentFallback, ...detail };
        setMoviesList((prev) => {
          const exists = prev.some((movie) => movie.id === selectedMovieId || movie.id === nextMovie.id);
          if (!exists) return [nextMovie, ...prev];
          return prev.map((movie) => (
            movie.id === selectedMovieId || movie.id === nextMovie.id ? { ...movie, ...nextMovie } : movie
          ));
        });
        if (nextMovie.id !== selectedMovieId) {
          setSelectedMovieId(nextMovie.id);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error.message || 'Không thể tải chi tiết phim từ hệ thống.', 4500, null, 'sad');
        }
      }
    };

    fetchMovieDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedMovieId, currentRole]);

  const selectedMovie = moviesList.find(m => m.id === selectedMovieId);

  // OTP login
  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setOtpSent(true);
    showToast("Hệ thống đã gửi mã OTP (123456) giả lập đến số điện thoại của bạn.");
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otpCode === '123456' || otpCode === '000000') {
      setIsLoggedIn(true);
      setShowOTP(false);
      setOtpSent(false);
      showToast("Đăng nhập tài khoản Cinephile VIP thành công!");
    } else {
      showToast("Mã OTP không đúng. Vui lòng nhập mã: 123456 để thử nghiệm.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={toast.tone === 'sad'
              ? { opacity: 1, y: [0, 2, 0], scale: 1 }
              : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className={`fixed right-4 top-5 z-[120] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden border p-4 text-white backdrop-blur-md sm:right-6 sm:top-6 ${toast.tone === 'sad'
              ? 'border-rose-300/40 bg-gradient-to-br from-zinc-950/95 via-rose-950/90 to-purple-950/85 shadow-[0_18px_60px_rgba(244,63,94,0.24)]'
              : 'border-amber-300/40 bg-gradient-to-br from-zinc-900/95 via-neutral-950/95 to-amber-950/90 shadow-[0_18px_50px_rgba(245,158,11,0.22)]'
              }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${toast.tone === 'sad'
              ? 'bg-gradient-to-r from-rose-200 via-fuchsia-400 to-indigo-300'
              : 'bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300'
              }`} />
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border text-sm font-black ${toast.tone === 'sad'
                  ? 'border-rose-300/40 bg-rose-400/15 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.22)] animate-pulse'
                  : 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)]'
                  }`}>
                  {toast.tone === 'sad' ? '...' : '✓'}
                </span>
                <p className={`whitespace-pre-line text-sm font-bold leading-relaxed ${toast.tone === 'sad' ? 'text-rose-50' : 'text-amber-50'}`}>
                  {toast.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="shrink-0 rounded-sm px-2 py-1 text-base font-bold leading-none text-amber-100/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={`toast-progress h-full rounded-full origin-left ${toast.tone === 'sad'
                  ? 'bg-gradient-to-r from-rose-300 via-fuchsia-300 to-indigo-300 shadow-[0_0_16px_rgba(244,63,94,0.6)]'
                  : 'bg-gradient-to-r from-emerald-300 via-amber-300 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.65)]'
                  }`}
                style={{ animationDuration: `${toast.durationMs}ms` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/70">
                Tự tắt sau {Math.ceil(toast.remainingMs / 1000)}s
              </div>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action.onClick();
                    setToast(null);
                  }}
                  className="border border-rose-300/50 bg-rose-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-50 transition hover:bg-rose-400 hover:text-black"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERTICAL LEFT RAIL (Artistic Flair requirement) */}
      <div className="hidden md:flex flex-col items-center justify-between py-12 border-r border-white/10 bg-black text-neutral-500 w-[60px] h-screen fixed left-0 top-0 z-40">
        <div className="text-[9px] uppercase tracking-[0.3em] font-sans font-bold whitespace-nowrap rotate-270 -my-8 text-neutral-400 select-none">
          EST. 2026
        </div>

        {/* Navigation Dot indicators */}
        <div className="flex flex-col items-center space-y-4">
          <div
            onClick={() => { navigateApp('home'); setSelectedMovieId(null); setBookingMovie(null); }}
            className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${activeTab === 'home' && !selectedMovieId && !bookingMovie ? 'bg-white scale-150' : 'bg-neutral-800'}`}
            title="Trang Chủ"
          />
          <div
            onClick={() => { navigateApp('explore'); setSelectedMovieId(null); setBookingMovie(null); }}
            className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${activeTab === 'explore' || selectedMovieId || bookingMovie ? 'bg-white scale-150' : 'bg-neutral-800'}`}
            title="Khám phá"
          />
          <div
            onClick={() => { navigateApp('my-tickets'); setSelectedMovieId(null); setBookingMovie(null); }}
            className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${activeTab === 'my-tickets' ? 'bg-white scale-150' : 'bg-neutral-800'}`}
            title="Vé của tôi"
          />
          <div
            onClick={() => { navigateApp('wishlist'); setSelectedMovieId(null); setBookingMovie(null); }}
            className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${activeTab === 'wishlist' ? 'bg-white scale-150' : 'bg-neutral-800'}`}
            title="Watchlist"
          />
        </div>

        <div className="text-[10px] uppercase tracking-[0.25em] font-serif italic text-white text-center select-none font-light">
          C P
        </div>
      </div>

      {/* Main Container Wrapper with Left Rail Padding */}
      <div className="md:pl-[60px] min-h-screen flex flex-col justify-between">

        <div>
          {/* Header */}
          <Header
            activeTab={activeTab}
            onTabChange={(tab) => {
              navigateApp(tab);
              setSelectedMovieId(null);
              setBookingMovie(null);
            }}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setMoviePagination((prev) => ({ ...prev, page: 0 }));
              if (activeTab !== 'explore') {
                navigateApp('explore');
              }
            }}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            onOpenWatchlist={() => setShowWatchlist(true)}
            onOpenOTP={() => setShowOTP(true)}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            showToast={showToast}
          />

          {/* VIEW ROUTER WITH TRANSITION ANIMATIONS */}
          <main className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={bookingMovie ? `booking-${bookingMovie.id}` : selectedMovieId ? `detail-${selectedMovieId}` : activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {bookingMovie ? (
                  // Step Booking View
                  <BookingView
                    movie={bookingMovie}
                    onBack={() => setBookingMovie(null)}
                    onConfirmBooking={handleConfirmBooking}
                    showToast={showToast}
                    foodCatalog={foodCatalog}
                  />
                ) : selectedMovie ? (
                  // Step Detail View
                  <DetailView
                    movie={selectedMovie}
                    onBack={() => setSelectedMovieId(null)}
                    onBook={handleBookMovie}
                    showToast={showToast}
                  />
                ) : activeTab === 'home' ? (
                  // Step Home View
                  <HomeView
                    onSelectMovie={handleSelectMovie}
                    onBookMovie={handleBookMovie}
                    onTabChange={navigateApp}
                    moviesList={moviesList}
                    homepageVideoUrl={homepageVideoUrl}
                  />
                ) : activeTab === 'explore' ? (
                  // Step Explore Search list View
                  <ExploreView
                    searchQuery={searchQuery}
                    onSearchChange={(q) => {
                      setSearchQuery(q);
                      setMoviePagination((prev) => ({ ...prev, page: 0 }));
                    }}
                    selectedDate={movieDateFilter}
                    onDateChange={(date) => {
                      setMovieDateFilter(date);
                      setMoviePagination((prev) => ({ ...prev, page: 0 }));
                    }}
                    onSelectMovie={handleSelectMovie}
                    onBookMovie={handleBookMovie}
                    moviesList={moviesList}
                    isLoading={isMoviesLoading}
                    pagination={moviePagination}
                    onPageChange={(page) => setMoviePagination((prev) => ({ ...prev, page: page - 1 }))}
                  />
                ) : activeTab === 'profile' ? (
                  // Custom Profile Page - Minh Hong VIP Gold
                  <ProfileView
                    onSelectMovie={handleSelectMovie}
                    onTabChange={navigateApp}
                    bookedTickets={bookedTickets}
                    isLoggedIn={isLoggedIn}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onProfileUpdated={(user) => {
                      setCurrentUser(user);
                      setCurrentRole(user.role || 'user');
                    }}
                    onOpenOTP={() => setShowOTP(true)}
                    showToast={showToast}
                  />
                ) : activeTab === 'my-tickets' ? (
                  // Custom Tickets listing and history page
                  <MyTicketsView
                    bookedTickets={bookedTickets}
                    onSelectMovie={handleSelectMovie}
                    isLoggedIn={isLoggedIn}
                    onOpenOTP={() => setShowOTP(true)}
                    showToast={showToast}
                  />
                ) : activeTab === 'wishlist' ? (
                  // Custom watchlist and newsletter page
                  <WishlistView
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onBookMovie={handleBookMovie}
                    onSelectMovie={handleSelectMovie}
                    showToast={showToast}
                  />
                ) : activeTab === 'admin' ? (
                  // Comprehensive cinema administration control panel
                  <AdminDashboard
                    moviesList={moviesList}
                    setMoviesList={setMoviesList}
                    bookedTickets={bookedTickets}
                    setBookedTickets={setBookedTickets}
                    cinemaLocations={cinemaLocations}
                    onSelectMovie={handleSelectMovie}
                    showToast={showToast}
                    initialSection={adminSection}
                    onSectionChange={setAdminSection}
                    homepageVideoUrl={homepageVideoUrl}
                    onHomepageVideoUrlChange={handleHomepageVideoUrlChange}
                    onFoodCatalogChanged={fetchPublicFoodCatalog}
                    isAdmin={currentRole === 'admin'}
                    currentUser={currentUser}
                  />
                ) : activeTab === 'policies' ? (
                  <PoliciesPage />
                ) : (
                  // Fallback
                  <HomeView
                    onSelectMovie={handleSelectMovie}
                    onBookMovie={handleBookMovie}
                    onTabChange={navigateApp}
                    moviesList={moviesList}
                    homepageVideoUrl={homepageVideoUrl}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Footer */}
        <Footer
          onTabChange={(tab) => {
            navigateApp(tab);
            setSelectedMovieId(null);
            setBookingMovie(null);
          }}
        />

      </div>

      {/* WATCHLIST & BOOKED TICKETS DRAWER MODAL (Sleek minimalist panel) */}
      {showWatchlist && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-md h-full bg-black border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto animate-slide-in relative"
            id="watchlist-drawer"
          >
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-4.5 w-4.5 text-white" />
                  <h3 className="text-base font-serif italic text-white uppercase tracking-wider">CinePremier / Tickets</h3>
                </div>
                <button
                  onClick={() => setShowWatchlist(false)}
                  className="p-1 border border-white/10 hover:border-white text-white shadow"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* SECTION: BOOKED SESSIONS */}
              <div className="space-y-4 mb-8">
                <span className="text-[9px] font-sans tracking-[0.2em] font-bold text-neutral-400 block uppercase border-b border-white/5 pb-1">VÉ CỦA TÔI ({bookedTickets.length})</span>

                {bookedTickets.length > 0 ? (
                  <div className="space-y-4">
                    {bookedTickets.map((tc) => (
                      <div key={tc.ticketId} className="border border-white/20 bg-neutral-950 p-4 space-y-3 font-sans relative">
                        <div className="absolute top-3 right-3 border border-white/20 px-2 py-0.5 text-[8px] font-mono uppercase bg-black text-white font-bold">
                          Verified
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-sm font-serif italic text-white font-bold">{tc.movie.title}</h4>
                          <p className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">{tc.movie.englishTitle}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-300">
                          <div>
                            <span className="block text-neutral-400 font-bold text-[8.5px] tracking-wide">RẠP CHIẾU:</span>
                            <span className="font-bold text-white uppercase">{tc.hall.split('(')[0]}</span>
                          </div>
                          <div>
                            <span className="block text-neutral-400 font-bold text-[8.5px] tracking-wide">SUẤT DIỄN:</span>
                            <span className="font-bold text-white font-mono">{tc.showtime} - {tc.date.split(',')[0]}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-neutral-400 font-bold text-[8.5px] tracking-wide">GHẾ ĐỊNH VỊ:</span>
                            <span className="text-white font-mono font-black">{tc.selectedSeats.map(s => s.id).join(', ')}</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-white/10 pt-3 flex items-center justify-between">
                          <div>
                            <span className="block text-neutral-400 font-bold text-[8.5px] tracking-wide">THANH TOÁN:</span>
                            <span className="text-xs font-mono font-bold text-white">{tc.totalAmount.toLocaleString()}đ</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-neutral-400 font-bold text-[8.5px] tracking-wide">MÃ VÉ TỬ:</span>
                            <span className="text-[11px] font-mono font-black border border-white bg-black px-1.5 py-0.5 text-white">{tc.ticketId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-white/5 bg-[#0a0a0a] uppercase text-[9px] tracking-wider text-neutral-600 space-y-2">
                    <p>Chưa có dữ kiện vé đặt trực tuyến gần đây</p>
                    <p className="text-neutral-500 font-sans font-light">Hãy chọn ghế và trải nghiệm hệ thống AI đặt vé tức thì.</p>
                  </div>
                )}
              </div>

              {/* SECTION: WATCHLIST */}
              <div className="space-y-4">
                <span className="text-[10px] font-sans tracking-[0.2em] font-extrabold text-neutral-300 block uppercase border-b border-white/10 pb-1">BẢN LƯU WATCHLIST ({watchlist.length})</span>

                {watchlist.length > 0 ? (
                  <div className="space-y-3">
                    {watchlist.filter((mv) => mv.status !== 'INACTIVE' && !mv.isInactive).map((mv) => (
                      <div key={mv.id} className="flex gap-3 bg-[#0a0a0a] border border-white/10 p-2 items-center justify-between">
                        <div className="flex gap-3 items-center min-w-0">
                          <img
                            src={mv.posterUrl}
                            alt={mv.title}
                            className="w-10 h-14 object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-serif italic text-white font-bold truncate">{mv.title}</h4>
                            <p className="text-[9.5px] text-neutral-300 font-bold uppercase tracking-widest truncate">{mv.englishTitle}</p>
                            <span className="text-[9.5px] text-white/70 font-semibold border border-white/20 px-1 py-0.5 mt-1 inline-block">{mv.duration} MIN</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {!mv.isUpcoming ? (
                            <button
                              onClick={() => {
                                handleBookMovie(mv);
                                setShowWatchlist(false);
                              }}
                              className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-[9.5px] uppercase tracking-wider font-sans font-extrabold transition"
                            >
                              Đặt vé
                            </button>
                          ) : (
                            <span className="border border-white/10 text-neutral-300 py-1 px-2.5 font-bold text-[8.5px] uppercase tracking-wider">Upcoming</span>
                          )}
                          <button
                            onClick={() => handleToggleWatchlist(mv)}
                            className="text-[10px] text-neutral-400 hover:text-white uppercase font-sans font-extrabold tracking-wider transition decoration-solid underline decoration-neutral-500 hover:decoration-white underline-offset-2"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-white/5 bg-[#0a0a0a] uppercase text-[9px] tracking-wider text-neutral-400 font-bold">
                    Danh mục lưu trữ điện ảnh trống
                  </div>
                )}
              </div>

            </div>

            <div className="border-t border-white/10 pt-4 mt-8 space-y-3 font-sans">
              <p className="text-[11px] text-neutral-300 leading-relaxed font-semibold">
                Quý khách có thể xuất trình <b>mã vé kĩ thuật số</b> tại phòng kịch rạp để in trực tiếp và hưởng các đặc quyền CinePremier VIP Club.
              </p>
              <button
                onClick={() => setShowWatchlist(false)}
                className="w-full text-center border-2 border-white bg-black hover:bg-white hover:text-black text-white text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 transition duration-300 cursor-pointer"
              >
                QUAY KHÔNG GIAN CHÍNH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERN MULTI-EFFECT PREMIUM AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        onLoginSuccess={(userData) => {
          setIsLoggedIn(true);
          if (userData) {
            setCurrentUser(userData);
            setCurrentRole(userData.role || 'user');
            if (userData.role === 'admin') {
              navigateApp('admin');
            } else {
              navigateApp('home');
            }
          }
        }}
        onPolicyClick={() => {
          setShowOTP(false);
          navigateApp('policies');
          setSelectedMovieId(null);
          setBookingMovie(null);
        }}
      />

    </div>
  );
}
