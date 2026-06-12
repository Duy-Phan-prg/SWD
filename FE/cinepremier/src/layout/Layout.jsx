import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import AuthModal from '../features/auth/AuthModal';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useMovies } from '../contexts/MoviesContext';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, setToast, showOTP, setShowOTP, showWatchlist, setShowWatchlist } = useUI();
  const { isLoggedIn, currentUser, currentRole, setCurrentRole, handleLoginSuccess } = useAuth();
  const { searchQuery, setSearchQuery, setMoviePagination, selectedCity, setSelectedCity, cinemaLocations, publicCinema, watchlist, handleToggleWatchlist, bookedTickets } = useMovies();

  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/admin')) return 'admin';
    if (p.startsWith('/movies')) return 'explore';
    if (p === '/tickets') return 'my-tickets';
    if (p === '/watchlist') return 'wishlist';
    if (p === '/profile') return 'profile';
    return 'home';
  })();

  const handleTabChange = (tab) => {
    if (tab === 'my-tickets' && !isLoggedIn) return;
    const paths = { home: '/', explore: '/movies', 'my-tickets': '/tickets', wishlist: '/watchlist', profile: '/profile', policies: '/policies', admin: '/admin/overview' };
    navigate(paths[tab] || '/');
  };

  const toastDurationMs = Number.isFinite(Number(toast?.durationMs)) && Number(toast?.durationMs) > 0
    ? Number(toast.durationMs)
    : 4500;
  const toastRemainingMs = Number.isFinite(Number(toast?.remainingMs)) && Number(toast?.remainingMs) >= 0
    ? Number(toast.remainingMs)
    : toastDurationMs;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={toast.tone === 'sad' ? { opacity: 1, y: [0, 2, 0], scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className={`fixed right-4 top-5 z-[120] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden border p-4 text-white backdrop-blur-md sm:right-6 sm:top-6 ${toast.tone === 'sad' ? 'border-rose-300/40 bg-gradient-to-br from-zinc-950/95 via-rose-950/90 to-purple-950/85 shadow-[0_18px_60px_rgba(244,63,94,0.24)]' : 'border-amber-300/40 bg-gradient-to-br from-zinc-900/95 via-neutral-950/95 to-amber-950/90 shadow-[0_18px_50px_rgba(245,158,11,0.22)]'}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${toast.tone === 'sad' ? 'bg-gradient-to-r from-rose-200 via-fuchsia-400 to-indigo-300' : 'bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300'}`} />
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border text-sm font-black ${toast.tone === 'sad' ? 'border-rose-300/40 bg-rose-400/15 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.22)] animate-pulse' : 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)]'}`}>
                  {toast.tone === 'sad' ? '...' : '✓'}
                </span>
                <p className={`whitespace-pre-line text-sm font-bold leading-relaxed ${toast.tone === 'sad' ? 'text-rose-50' : 'text-amber-50'}`}>{toast.text}</p>
              </div>
              <button type="button" onClick={() => setToast(null)} className="shrink-0 rounded-sm px-2 py-1 text-base font-bold leading-none text-amber-100/70 transition hover:bg-white/10 hover:text-white">✕</button>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className={`toast-progress h-full rounded-full origin-left ${toast.tone === 'sad' ? 'bg-gradient-to-r from-rose-300 via-fuchsia-300 to-indigo-300 shadow-[0_0_16px_rgba(244,63,94,0.6)]' : 'bg-gradient-to-r from-emerald-300 via-amber-300 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.65)]'}`} style={{ animationDuration: `${toastDurationMs}ms` }} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/70">Tự tắt sau {Math.ceil(toastRemainingMs / 1000)}s</div>
              {toast.action && (
                <button type="button" onClick={() => { toast.action.onClick(); setToast(null); }} className="border border-rose-300/50 bg-rose-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-50 transition hover:bg-rose-400 hover:text-black">
                  {toast.action.label}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Rail */}
      <div className="hidden md:flex flex-col items-center justify-between py-12 border-r border-white/10 bg-black text-neutral-500 w-[60px] h-screen fixed left-0 top-0 z-40">
        <div className="text-[9px] uppercase tracking-[0.3em] font-sans font-bold whitespace-nowrap rotate-270 -my-8 text-neutral-400 select-none">EST. 2026</div>
        <div className="flex flex-col items-center space-y-4">
          {[['home', '/'], ['explore', '/movies'], ...(isLoggedIn ? [['my-tickets', '/tickets']] : []), ['wishlist', '/watchlist']].map(([tab, path]) => (
            <button
              type="button"
              key={tab}
              onClick={() => navigate(path)}
              className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${activeTab === tab ? 'bg-white scale-150' : 'bg-neutral-800'}`}
              title={tab}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] font-serif italic text-white text-center select-none font-light">C P</div>
      </div>

      {/* Main */}
      <div className="md:pl-[60px] min-h-screen flex flex-col justify-between">
        <div>
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setMoviePagination(prev => ({ ...prev, page: 0 })); if (location.pathname !== '/movies') navigate('/movies'); }}
            selectedCity={selectedCity}
            cinemaLocations={cinemaLocations}
            cinema={publicCinema}
            onCityChange={setSelectedCity}
            onManageCinema={() => navigate('/admin/cinema')}
            onOpenWatchlist={() => setShowWatchlist(true)}
            onOpenOTP={() => setShowOTP(true)}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />
          <main className="relative z-0 overflow-x-hidden">{children}</main>
        </div>
        <Footer onTabChange={handleTabChange} cinema={publicCinema} />
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
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={(v) => { }}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentUser={currentUser}
        setCurrentUser={() => { }}
        onLoginSuccess={handleLoginSuccess}
        onPolicyClick={() => { setShowOTP(false); navigate('/policies'); }}
      />
    </div>
  );
}
