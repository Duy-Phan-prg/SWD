import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Ticket } from 'lucide-react';
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
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentRole = useAuthStore((state) => state.currentRole);
  const setCurrentRole = useAuthStore((state) => state.setCurrentRole);
  const { searchQuery, setSearchQuery, setMoviePagination, publicCinema, watchlist, handleToggleWatchlist, bookedTickets } = useMovies();

  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/staff')) return 'staff';
    if (p.startsWith('/admin')) return 'admin';
    if (p.startsWith('/movies')) return 'explore';
    if (p === '/tickets') return 'my-tickets';
    if (p === '/watchlist') return 'wishlist';
    if (p === '/profile') return 'profile';
    return 'home';
  })();

  const handleTabChange = (tab) => {
    if (tab === 'my-tickets' && !isLoggedIn) return;
    const paths = { home: '/', explore: '/movies', 'my-tickets': '/tickets', wishlist: '/watchlist', profile: '/profile', policies: '/policies', staff: '/staff', admin: '/admin/overview' };
    navigate(paths[tab] || '/');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-black text-white selection:bg-white selection:text-black">
      <Toast toast={toast} onClose={() => setToast(null)} />

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
      <div className="min-h-screen w-full max-w-full overflow-x-clip md:pl-[60px] flex flex-col justify-between">
        <div>
          <Header
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setMoviePagination(prev => ({ ...prev, page: 0 })); if (location.pathname !== '/movies') navigate('/movies'); }}
            cinema={publicCinema}
            onManageCinema={() => navigate('/admin/cinema')}
            onOpenWatchlist={() => setShowWatchlist(true)}
            onOpenOTP={() => { setAuthMode('login'); setShowOTP(true); }}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
          />
          <main className="relative z-0 min-w-0 max-w-full overflow-x-clip">{children}</main>
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
        initialTab={authMode}
        onPolicyClick={() => { setShowOTP(false); navigate('/policies'); }}
      />
    </div>
  );
}
