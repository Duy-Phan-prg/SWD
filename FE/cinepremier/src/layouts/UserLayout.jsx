import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Ticket, User, LogOut, Search, MapPin, Home, Compass, Heart, ChevronDown } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AuthModal from '@/pages/auth/AuthModal';
import { Toast } from '../components/common';
import { useMovies } from '../stores/useMovieStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUiStore } from '../stores/useUiStore';

export default function UserLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useUiStore((state) => state.toast);
  const setToast = useUiStore((state) => state.setToast);
  const showOTP = useUiStore((state) => state.showOTP);
  const setShowOTP = useUiStore((state) => state.setShowOTP);
  const authMode = useUiStore((state) => state.authMode);
  const setAuthMode = useUiStore((state) => state.setAuthMode);
  const showWatchlist = useUiStore((state) => state.showWatchlist);
  const setShowWatchlist = useUiStore((state) => state.setShowWatchlist);
  const showToast = useUiStore((state) => state.showToast);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentRole = useAuthStore((state) => state.currentRole);
  const setCurrentRole = useAuthStore((state) => state.setCurrentRole);
  const handleLogout = useAuthStore((state) => state.handleLogout);
  const {
    searchQuery, setSearchQuery, setMoviePagination, publicCinema, watchlist, handleToggleWatchlist, bookedTickets,
    moviesList, setMovieDateFilter, setSelectedGenreId
  } = useMovies();
  const isAdmin = currentRole === 'admin' || currentUser?.role === 'admin';
  const isStaff = currentRole === 'staff' || currentUser?.role === 'staff';
  const isWishlistRestricted = isAdmin || isStaff;

  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/staff')) return 'staff';
    if (p.startsWith('/admin')) return 'admin';
    if (p.startsWith('/movies')) return 'explore';
    if (p === '/concessions') return 'concessions';
    if (p === '/showtimes') return 'showtimes';
    if (p === '/tickets') return 'my-tickets';
    if (p === '/watchlist') return 'wishlist';
    if (p === '/profile') return 'profile';
    return 'home';
  })();

  // Admin/Staff dùng layout riêng — không hiển thị header/footer/rail của khách.
  const isBackoffice = activeTab === 'admin' || activeTab === 'staff';
  const backofficeNavItems = [
    { id: 'home', label: 'TRANG CHỦ', icon: Home },
    { id: 'explore', label: 'KHÁM PHÁ', icon: Compass },
    { id: 'my-tickets', label: 'ĐƠN CỦA TÔI', icon: Ticket },
    { id: 'wishlist', label: 'WATCHLIST', icon: Heart },
    { id: 'profile', label: 'CÁ NHÂN', icon: User },
  ].filter(({ id }) => {
    if (isAdmin && (id === 'my-tickets' || id === 'wishlist')) return false;
    if (isStaff && id === 'wishlist') return false;
    return true;
  });

  const handleTabChange = (tab) => {
    // Guest bấm "Đơn của tôi" → mở modal đăng nhập.
    if (tab === 'my-tickets' && !isLoggedIn) { setAuthMode('login'); setShowOTP(true); return; }
    if (tab === 'wishlist' && isWishlistRestricted) return;
    const paths = { home: '/', explore: '/movies', concessions: '/concessions', showtimes: '/showtimes', 'my-tickets': '/tickets', wishlist: '/watchlist', profile: '/profile', policies: '/policies', staff: '/staff', admin: '/admin/overview' };
    navigate(paths[tab] || '/');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-black text-white selection:bg-amber-400 selection:text-white">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header cố định cho admin/staff */}
      {isBackoffice && (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
          <div className="mx-auto flex min-h-16 w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
            <button
              type="button"
              onClick={() => handleTabChange('home')}
              className="group flex shrink-0 items-center gap-3.5 pr-2 text-left"
              aria-label="CinePremier home"
            >
              <span className="relative flex h-10 w-10 items-center justify-center border border-white/15 bg-zinc-950 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.05)] transition group-hover:border-amber-400/45">
                <span className="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t border-white/35"></span>
                <span className="absolute right-1 top-1 h-1.5 w-1.5 border-r border-t border-white/35"></span>
                <span className="absolute bottom-1 left-1 h-1.5 w-1.5 border-b border-l border-white/35"></span>
                <span className="absolute bottom-1 right-1 h-1.5 w-1.5 border-b border-r border-white/35"></span>
                <span className="font-serif text-lg font-black italic text-amber-100">C</span>
              </span>
              <span className="hidden flex-col sm:flex">
                <span className="text-sm font-black leading-none tracking-[0.22em] text-white">
                  CINE<span className="text-amber-400">PREMIER</span>
                </span>
                <span className="mt-1 text-[7.5px] font-mono uppercase leading-none tracking-[0.45em] text-neutral-300">
                  STUDIOS
                </span>
              </span>
            </button>

            <nav className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] lg:order-none lg:w-auto lg:flex-1 lg:justify-center [&::-webkit-scrollbar]:hidden">
              {backofficeNavItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`flex h-10 shrink-0 items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] transition ${activeTab === id
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-white'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
              <div className="relative hidden h-10 w-48 xl:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setMoviePagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  onFocus={() => {
                    if (location.pathname !== '/movies') navigate('/movies');
                  }}
                  placeholder="TÌM PHIM..."
                  className="h-full w-full border border-white/10 bg-black/60 pl-9 pr-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                />
              </div>

              <button
                type="button"
                onClick={() => activeTab === 'admin' ? navigate('/admin/cinema') : handleTabChange('explore')}
                className="hidden h-10 items-center gap-2 border border-white/10 bg-black/60 px-3.5 text-left text-[9px] uppercase tracking-[0.14em] text-neutral-300 transition hover:border-amber-500/40 hover:text-white md:flex"
              >
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span className="max-w-[150px] truncate">
                  <span className="block text-[10px] font-black leading-tight text-white">{publicCinema?.name || 'CINEAI CENTRAL'}</span>
                  <span className="block text-[7px] font-bold leading-tight text-neutral-500">{publicCinema?.city || 'HO CHI MINH CITY'}</span>
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-500" />
              </button>

              {isLoggedIn && (
                <>
                  <button
                    type="button"
                    onClick={() => handleTabChange(activeTab === 'admin' ? 'admin' : 'staff')}
                    className="flex h-10 items-center gap-1.5 border border-yellow-500/40 bg-yellow-500/10 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-yellow-500 transition hover:bg-yellow-500 hover:text-black"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{activeTab === 'admin' ? 'CINEMAAI ADMIN' : currentUser?.name || 'CINEMAAI STAFF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogout({ navigate, showToast })}
                    className="flex h-10 w-10 items-center justify-center border border-white/10 bg-black/60 text-white transition hover:bg-white hover:text-black"
                    aria-label="Đăng xuất"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Left Rail */}
      <div className="hidden">
        {/* Left Rail hidden */}
      </div>

      {/* Main */}
      <div className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col justify-between`}>
        <div>
          {!isBackoffice && (
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            moviesList={moviesList}
            onSearchCommit={(q) => {
              // Commit tìm kiếm mới: bỏ lọc ngày/thể loại cũ để không rơi vào "0 phim" vì filter tồn dư
              setSearchQuery(q);
              setMovieDateFilter('');
              setSelectedGenreId('');
              setMoviePagination(prev => ({ ...prev, page: 0 }));
              if (location.pathname !== '/movies') navigate('/movies');
            }}
            cinema={publicCinema}
            onManageCinema={() => navigate('/admin/cinema')}
            onOpenWatchlist={() => setShowWatchlist(true)}
            onOpenOTP={() => { setAuthMode('login'); setShowOTP(true); }}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            currentRole={currentRole}
            loyaltyRefreshKey={location.key}
            onRoleChange={setCurrentRole}
            handleLogout={handleLogout}
            navigate={navigate}
            showToast={showToast}
          />
          )}
          <main className="relative z-0 min-w-0 max-w-full overflow-x-clip">{children}</main>
        </div>
        {!isBackoffice && <Footer onTabChange={handleTabChange} cinema={publicCinema} />}
      </div>

      {/* Watchlist Drawer */}
      {showWatchlist && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-black border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto animate-slide-in relative">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-4.5 w-4.5 text-white" />
                  <h3 className="text-base font-serif italic text-white uppercase tracking-wider">CinePremier / Tickets</h3>
                </div>
                <button onClick={() => setShowWatchlist(false)} className="p-1 border border-white/10 hover:border-white text-white shadow"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4 mb-8">
                <span className="text-[9px] font-sans tracking-[0.2em] font-bold text-neutral-400 block uppercase border-b border-white/5 pb-1">VÉ CỦA TÔI ({bookedTickets.length})</span>
                {bookedTickets.length === 0 && (
                  <div className="text-center py-6 border border-white/5 bg-[#0a0a0a] uppercase text-[9px] tracking-wider text-neutral-600 space-y-2">
                    <p>Chưa có vé đặt trực tuyến gần đây</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-sans tracking-[0.2em] font-extrabold text-neutral-300 block uppercase border-b border-white/10 pb-1">WATCHLIST ({watchlist.length})</span>
                {watchlist.length > 0 ? (
                  <div className="space-y-3">
                    {watchlist.filter(mv => mv.status !== 'INACTIVE' && !mv.isInactive).map(mv => (
                      <div key={mv.id} className="flex gap-3 bg-[#0a0a0a] border border-white/10 p-2 items-center justify-between">
                        <div className="flex gap-3 items-center min-w-0">
                          <img src={mv.posterUrl} alt={mv.title} className="w-10 h-14 object-cover border border-white/10" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-serif italic text-white font-bold truncate">{mv.title}</h4>
                            <p className="text-[9.5px] text-neutral-300 font-bold uppercase tracking-widest truncate">{mv.englishTitle}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {!mv.isUpcoming ? (
                            <button onClick={() => { navigate(`/movies/${mv.id}/book`); setShowWatchlist(false); }} className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-[9.5px] uppercase tracking-wider font-sans font-extrabold transition">Đặt vé</button>
                          ) : (
                            <span className="border border-white/10 text-neutral-300 py-1 px-2.5 font-bold text-[8.5px] uppercase tracking-wider">Upcoming</span>
                          )}
                          <button onClick={() => handleToggleWatchlist(mv)} className="text-[10px] text-neutral-400 hover:text-white uppercase font-sans font-extrabold tracking-wider transition underline underline-offset-2">Xóa</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-white/5 bg-[#0a0a0a] uppercase text-[9px] tracking-wider text-neutral-400 font-bold">Danh mục lưu trữ điện ảnh trống</div>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 mt-8">
              <button onClick={() => setShowWatchlist(false)} className="w-full text-center border-2 border-white bg-black hover:bg-white hover:text-black text-white text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 transition duration-300 cursor-pointer">QUAY KHÔNG GIAN CHÍNH</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        initialTab={authMode}
        onPolicyClick={() => { setShowOTP(false); navigate('/policies'); }}
      />
    </div>
  );
}
