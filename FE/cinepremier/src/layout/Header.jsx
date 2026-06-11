import React, { useState } from 'react';
import {
  Search, MapPin, Ticket, User, Heart, Compass, Home, ShieldAlert,
  Building2, ChevronDown, Phone, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCity,
  cinemaLocations = [],
  cinema = null,
  onCityChange = () => { },
  onManageCinema = () => { },
  onOpenWatchlist,
  onOpenOTP,
  isLoggedIn,
  currentUser,
  currentRole = 'user',
  onRoleChange = () => { },
  showToast = () => { }
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full overflow-visible border-b border-white/10 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">

        {/* Logo CINEPREMIER */}
        <motion.div
          onClick={() => onTabChange('home')}
          className="flex cursor-pointer items-center space-x-3.5 group select-none mr-4"
          id="header-logo"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          {/* Animated luxury brand monogram C with gold accenting and shimmering reflex */}
          <motion.div
            className="relative h-10 w-10 flex items-center justify-center bg-zinc-950 border border-white/15 overflow-hidden shadow-[inset_0_0_12px_rgba(255,255,255,0.05)] group-hover:border-amber-400/40 transition-all duration-300"
            animate={{
              boxShadow: ["inset 0 0 10px rgba(255,255,255,0.02)", "inset 0 0 10px rgba(245,158,11,0.08)", "inset 0 0 10px rgba(255,255,255,0.02)"]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            {/* Golden Corner Brackets with expanding motion on parent Group Hover */}
            <span className="absolute top-1 left-1 h-1.5 w-1.5 border-t border-l border-white/30 group-hover:border-amber-400 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"></span>
            <span className="absolute top-1 right-1 h-1.5 w-1.5 border-t border-r border-white/30 group-hover:border-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"></span>
            <span className="absolute bottom-1 left-1 h-1.5 w-1.5 border-b border-l border-white/30 group-hover:border-amber-400 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-all duration-300"></span>
            <span className="absolute bottom-1 right-1 h-1.5 w-1.5 border-b border-r border-white/30 group-hover:border-amber-400 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all duration-300"></span>

            {/* Golden radial background flow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Dynamic sweep mask highlight across logo C */}
            <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-sweep pointer-events-none" />

            {/* Main Letter C with gorgeous drop shadow glow and rich Gold Gradient Style */}
            <span className="relative font-serif text-lg italic font-extrabold tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-400 group-hover:from-white group-hover:via-amber-200 group-hover:to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] transition-all duration-300 select-none">
              C
            </span>
          </motion.div>

          <div className="flex flex-col justify-center">
            <span className="font-sans font-black tracking-[0.22em] text-xs sm:text-sm text-white uppercase leading-none group-hover:text-amber-400 transition-colors duration-300">
              CINE<span className="text-amber-400">PREMIER</span>
            </span>
            <span className="text-[7.5px] font-mono tracking-[0.45em] text-neutral-500 uppercase mt-1 leading-none group-hover:text-neutral-400 transition-colors">
              STUDIOS
            </span>
          </div>
        </motion.div>

        {/* Categories Tab list matching screenshot 2 & 3 navigation style */}
        <nav className="hidden lg:flex items-center space-x-0.5" id="main-nav-bar">
          <button
            onClick={() => onTabChange('home')}
            className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'home'
              ? 'text-white border-white font-bold'
              : 'text-neutral-400 hover:text-white border-transparent'
              }`}
            id="nav-home"
          >
            <Home className="h-3.5 w-3.5" />
            <span>TRANG CHỦ</span>
          </button>

          <button
            onClick={() => onTabChange('explore')}
            className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'explore'
              ? 'text-white border-white font-bold'
              : 'text-neutral-400 hover:text-white border-transparent'
              }`}
            id="nav-explore"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>KHÁM PHÁ</span>
          </button>

          <button
            onClick={() => onTabChange('my-tickets')}
            className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'my-tickets'
              ? 'text-white border-white font-bold'
              : 'text-neutral-400 hover:text-white border-transparent'
              }`}
            id="nav-my-bookings"
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>VỀ CỦA TÔI</span>
          </button>

          <button
            onClick={() => onTabChange('wishlist')}
            className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'wishlist'
              ? 'text-white border-white font-bold'
              : 'text-neutral-400 hover:text-white border-transparent'
              }`}
            id="nav-wishlist"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>WATCHLIST</span>
          </button>

          {isLoggedIn && (
            <button
              onClick={() => onTabChange('profile')}
              className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'profile'
                ? 'text-white border-white font-bold'
                : 'text-neutral-400 hover:text-white border-transparent'
                }`}
              id="nav-profile-tab"
            >
              <User className="h-3.5 w-3.5" />
              <span>CÁ NHÂN</span>
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`px-3.5 py-1.5 text-[10px] font-sans uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${activeTab === 'admin'
                ? 'text-amber-500 border-amber-500 font-extrabold'
                : 'text-neutral-400 hover:text-amber-500 border-transparent'
                }`}
              id="nav-admin-tab"
            >
              <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>QUẢN TRỊ VIÊN</span>
            </button>
          )}
        </nav>

        {/* Right Header Section */}
        <div className="mr-4 flex items-center space-x-2.5">

          {/* Search Box */}
          <div className="relative hidden xl:block w-40 xl:w-48 h-9 flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600 pointer-events-none" />
            <input
              type="text"
              placeholder="TÌM PHIM..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={() => {
                if (activeTab !== 'explore') onTabChange('explore');
              }}
              className="w-full h-full border border-white/10 bg-neutral-950/80 pl-9 pr-4 text-[9.5px] font-semibold text-white tracking-widest placeholder:font-semibold placeholder-neutral-600 uppercase focus:border-white/30 focus:bg-neutral-900/60 focus:outline-none transition-all duration-300"
              id="search-input"
            />
          </div>

          {/* Location Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex h-10 items-center justify-center gap-2 whitespace-nowrap border border-white/10 bg-black/40 px-3.5 text-[10px] font-sans uppercase tracking-[0.15em] text-neutral-300 transition-all duration-300 hover:border-white/30 hover:bg-neutral-900/50 hover:text-white"
              id="location-button"
            >
              <span className="flex h-6 w-6 items-center justify-center border border-white/10 text-neutral-400">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="hidden max-w-[120px] text-left sm:block">
                <span className="block truncate font-black text-white">
                  {cinema?.name || (selectedCity ? selectedCity.split('(')[0].trim() : 'Chưa có rạp')}
                </span>
                <span className="mt-0.5 block truncate text-[7px] font-bold tracking-[0.18em] text-neutral-400">
                  {cinema?.city || 'ĐỊA ĐIỂM CHIẾU'}
                </span>
              </span>
              <ChevronDown className={`h-3 w-3 text-neutral-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-white/15 bg-[#070707]/98 shadow-[0_22px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl animate-slide-in"
                id="location-dropdown"
              >
                <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-amber-500/15 via-neutral-950 to-black p-4">
                  <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" />
                  <div className="relative flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-500/35 bg-amber-500/10 text-amber-400">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-400">
                        Rạp chiếu hiện tại
                      </div>
                      <div className="mt-1 truncate text-sm font-black uppercase tracking-wide text-white">
                        {cinema?.name || 'Chưa cấu hình rạp'}
                      </div>
                      <div className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-neutral-400">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                        <span>{[cinema?.address, cinema?.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ rạp'}</span>
                      </div>
                      {cinema?.phone && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
                          <Phone className="h-3 w-3 text-amber-400" />
                          <span>{cinema.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {cinemaLocations.length > 0 && (
                  <div className="px-3 pb-1 pt-2 text-[8px] font-black uppercase tracking-[0.22em] text-neutral-600">Danh sách địa điểm</div>
                )}
                {cinemaLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      onCityChange(loc);
                      onSearchChange(''); // Reset search
                      onTabChange('home'); // Reset to home
                      showToast(`Đã đổi rạp chiếu hoạt động sang: ${loc}`);
                      setDropdownOpen(false);
                    }}
                    className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 border-l-2 border-transparent px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-neutral-400 transition hover:border-amber-400 hover:bg-neutral-900 hover:text-white"
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-neutral-600" />
                    {loc}
                  </button>
                ))}
                {cinemaLocations.length === 0 && (
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500">Chưa có rạp đang hoạt động</div>
                )}
                {currentRole === 'admin' && (
                  <div className="mt-1 border-t border-white/10 p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onManageCinema();
                      }}
                      className="group flex w-full items-center justify-between border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-left transition hover:border-amber-400 hover:bg-amber-500/20"
                    >
                      <span className="flex items-center gap-2.5">
                        <Settings2 className="h-4 w-4 text-amber-400 transition-transform group-hover:rotate-45" />
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Quản lý rạp chiếu</span>
                          <span className="mt-1 block text-[8px] uppercase tracking-wider text-neutral-500">Chỉnh sửa thông tin và trạng thái rạp</span>
                        </span>
                      </span>
                      <span className="text-sm text-amber-400">→</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Signin Profile Indicator */}
          <button
            onClick={() => {
              if (isLoggedIn) {
                onTabChange('profile');
              } else {
                onOpenOTP();
              }
            }}
            className={`flex h-9 items-center justify-center space-x-1.5 border px-3.5 text-[10px] font-sans uppercase tracking-[0.15em] font-bold shadow-md transition-all duration-300 whitespace-nowrap ${isLoggedIn
              ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.05)]'
              : 'border-white bg-white text-black hover:bg-black hover:text-white'
              }`}
            id="signin-button"
          >
            <User className="h-3.5 w-3.5" />
            <span>
              {isLoggedIn ? (currentUser?.name) : 'ĐĂNG NHẬP'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}
