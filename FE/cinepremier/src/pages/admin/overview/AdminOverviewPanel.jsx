import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';

export default function AdminOverviewPanel({ ctx }) {
  const {
    activeTab,
    setActiveTab,
    activeChartPoint,
    setActiveChartPoint,
    searchQuery,
    setSearchQuery,
    filmFilter,
    setFilmFilter,
    adminMoviePagination,
    setAdminMoviePagination,
    editingMovie,
    setEditingMovie,
    showMovieForm,
    setShowMovieForm,
    formData,
    setFormData,
    newShowtime,
    setNewShowtime,
    isAddingShowtime,
    setIsAddingShowtime,
    showtimeSuccessMessage,
    setShowtimeSuccessMessage,
    genres,
    setGenres,
    genreSearch,
    setGenreSearch,
    genreForm,
    setGenreForm,
    genreErrors,
    setGenreErrors,
    editingGenreId,
    setEditingGenreId,
    isGenreLoading,
    setIsGenreLoading,
    isGenreSaving,
    setIsGenreSaving,
    foodItems,
    setFoodItems,
    foodCombos,
    setFoodCombos,
    foodSearch,
    setFoodSearch,
    foodKind,
    setFoodKind,
    editingFood,
    setEditingFood,
    foodForm,
    setFoodForm,
    foodErrors,
    setFoodErrors,
    isFoodLoading,
    setIsFoodLoading,
    isFoodSaving,
    setIsFoodSaving,
    visibleFoods,
    HALL_OPTIONS,
    TIME_OPTIONS,
    playPulseSound,
    auditLogs,
    setAuditLogs,
    addAuditLog,
    resetFoodForm,
    validateFoodForm,
    fetchFoods,
    handleFoodSubmit,
    handleEditFood,
    handleToggleFoodStatus,
    getAdminToken,
    changeAdminSection,
    validateGenreForm,
    fetchGenres,
    resetGenreForm,
    handleGenreSubmit,
    handleEditGenre,
    performDeleteGenre,
    handleDeleteGenre,
    totalBookingsCount,
    calculatedRevenue,
    averageFillRate,
    handleCreateMovieSubmit,
    handleDeleteMovie,
    handleAddShowtimeSubmit,
    handleRefundTicket,
    filteredMovies,
    filteredGenres,
    moviesList,
    setMoviesList,
    bookedTickets,
    setBookedTickets,
    publicCinema,
    onSelectMovie,
    showToast,
    initialSection,
    onSectionChange,
    onFoodCatalogChanged,
    isAdmin
  } = ctx;

  return (
    <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="panel-overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. Interactive Area Line Chart (Revenue Trend) */}
                    <div className="col-span-1 lg:col-span-2 border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono tracking-widest text-amber-500 uppercase font-black">LƯU LƯỢNG GIAO DỊCH TRỰC TIẾP</span>
                          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Biểu đồ biến động doanh thu 7 ngày gần nhất</h3>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-[#88959C]">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                          <span>Hàng tuần</span>
                        </div>
                      </div>

                      {/* High fidelity interactive area line chart */}
                      <div className="relative pt-2" id="revenue-line-chart-box">
                        <div className="absolute right-4 top-1 bg-black/80 border border-neutral-800 p-2 text-[10.5px] font-mono rounded shadow-lg text-neutral-300 pointer-events-none z-10">
                          {[
                            { day: 'Thứ Hai', rev: 5200000, desc: 'Lượng vé rạp thường ổn định' },
                            { day: 'Thứ Ba', rev: 6800000, desc: 'Happy Tuesday ưu đãi thành viên' },
                            { day: 'Thứ Tư', rev: 8400000, desc: 'Giờ vàng phim Noir & Art' },
                            { day: 'Thứ Năm', rev: 7900000, desc: 'Suất chiếu sớm sneak show' },
                            { day: 'Thứ Sáu', rev: 12500000, desc: 'Bắt đầu làn sóng cuối tuần' },
                            { day: 'Thứ Bảy', rev: 18900000, desc: 'Cao điểm tối thứ Bảy quá tải' },
                            { day: 'Chủ Nhật', rev: 15450000, desc: 'Gia đình đặt vé giải trí sớm' }
                          ][activeChartPoint] ? (
                            <>
                              <div className="text-amber-400 font-extrabold flex justify-between gap-4">
                                <span>{[
                                  { day: 'Thứ Hai' }, { day: 'Thứ Ba' }, { day: 'Thứ Tư' }, { day: 'Thứ Năm' }, { day: 'Thứ Sáu' }, { day: 'Thứ Bảy' }, { day: 'Chủ Nhật' }
                                ][activeChartPoint].day}</span>
                                <span>▲ {(([
                                  5200000, 6800000, 8400000, 7900000, 12500000, 18900000, 15450000
                                ][activeChartPoint] / calculatedRevenue) * 100).toFixed(1)}% Tổng</span>
                              </div>
                              <div className="text-white text-xs font-bold font-mono mt-0.5">
                                {([
                                  5200000, 6800000, 8400000, 7900000, 12500000, 18900000, 15450000
                                ][activeChartPoint]).toLocaleString()}đ
                              </div>
                              <p className="text-[9px] text-[#556268] mt-0.5">
                                {[
                                  { desc: 'Lượng vé rạp thường ổn định' },
                                  { desc: 'Happy Tuesday ưu đãi thành viên' },
                                  { desc: 'Giờ vàng phim Noir & Art' },
                                  { desc: 'Suất chiếu sớm sneak show' },
                                  { desc: 'Bắt đầu làn sóng cuối tuần' },
                                  { desc: 'Cao điểm tối thứ Bảy quá tải' },
                                  { desc: 'Gia đình đặt vé giải trí sớm' }
                                ][activeChartPoint].desc}
                              </p>
                            </>
                          ) : (
                            <span className="text-neutral-500">Rê chuột lên điểm biểu đồ</span>
                          )}
                        </div>

                        <svg viewBox="0 0 600 200" className="w-full h-auto overflow-visible select-none">
                          <defs>
                            {/* Area gradient */}
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                            {/* Glow Filter */}
                            <filter id="neonGlowLine" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* X and Y grid lines */}
                          <line x1="40" y1="30" x2="570" y2="30" stroke="#1d1d21" strokeDasharray="3,3" />
                          <line x1="40" y1="70" x2="570" y2="70" stroke="#1d1d21" strokeDasharray="3,3" />
                          <line x1="40" y1="110" x2="570" y2="110" stroke="#1d1d21" strokeDasharray="3,3" />
                          <line x1="40" y1="150" x2="570" y2="150" stroke="#1d1d21" strokeDasharray="3,3" />
                          <line x1="40" y1="180" x2="570" y2="180" stroke="#2a2a30" strokeWidth="1" />

                          {/* Y-axis Label notations */}
                          <text x="12" y="34" className="text-[8px] font-mono fill-neutral-600 text-right">24Mđ</text>
                          <text x="12" y="74" className="text-[8px] font-mono fill-neutral-600">16Mđ</text>
                          <text x="12" y="114" className="text-[8px] font-mono fill-neutral-600">8Mđ</text>
                          <text x="12" y="154" className="text-[8px] font-mono fill-neutral-600">4Mđ</text>
                          <text x="12" y="184" className="text-[8px] font-mono fill-neutral-500">0đ</text>

                          {/* AREA FILL */}
                          <path
                            d="M 50 180 L 50 165 L 130 152 L 210 135 L 290 140 L 370 95 L 450 45 L 530 68 L 530 180 Z"
                            fill="url(#chartGradient)"
                          />

                          {/* GLOWING LINE GRAPH */}
                          <path
                            d="M 50 165 L 130 152 L 210 135 L 290 140 L 370 95 L 450 45 L 530 68"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                            filter="url(#neonGlowLine)"
                          />

                          {/* Interactive active line vertical bar */}
                          {activeChartPoint !== -1 && (
                            <line
                              x1={[50, 130, 210, 290, 370, 450, 530][activeChartPoint]}
                              y1="30"
                              x2={[50, 130, 210, 290, 370, 450, 530][activeChartPoint]}
                              y2="180"
                              stroke="#eab308"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                          )}

                          {/* DOTS of days and hover anchors */}
                          {[
                            { x: 50, y: 165, idx: 0, label: 'Th.2' },
                            { x: 130, y: 152, idx: 1, label: 'Th.3' },
                            { x: 210, y: 135, idx: 2, label: 'Th.4' },
                            { x: 290, y: 140, idx: 3, label: 'Th.5' },
                            { x: 370, y: 95, idx: 4, label: 'Th.6' },
                            { x: 450, y: 45, idx: 5, label: 'Th.7' },
                            { x: 530, y: 68, idx: 6, label: 'CN' }
                          ].map((dot) => (
                            <g key={dot.idx}>
                              {/* Inner circle anchor point */}
                              <circle
                                cx={dot.x}
                                cy={dot.y}
                                r={activeChartPoint === dot.idx ? "6" : "3.5"}
                                fill={activeChartPoint === dot.idx ? "#ffffff" : "#f59e0b"}
                                stroke="#000000"
                                strokeWidth="1.5"
                                className="transition-all duration-300 cursor-pointer"
                                onMouseEnter={() => {
                                  playPulseSound(500 + dot.idx * 50, 'sine', 0.03);
                                  setActiveChartPoint(dot.idx);
                                }}
                              />
                              {/* invisible safe hover area for touch screens */}
                              <circle
                                cx={dot.x}
                                cy={dot.y}
                                r="15"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => {
                                  setActiveChartPoint(dot.idx);
                                }}
                              />
                              {/* X-axis labels */}
                              <text
                                x={dot.x}
                                y="194"
                                textAnchor="middle"
                                className={`text-[9.5px] font-mono font-bold ${activeChartPoint === dot.idx ? 'fill-amber-400 font-extrabold' : 'fill-neutral-500'}`}
                              >
                                {dot.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>

                      {/* Regional breakdown chart under the line graph */}
                      <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8.5px] font-mono text-neutral-500 uppercase block font-bold mb-2">Doanh thu tại rạp</span>
                          <div className="space-y-3 pt-1">
                            {[
                              {
                                city: publicCinema?.name || 'Rạp chưa được cấu hình',
                                revenue: calculatedRevenue,
                                percentage: 100,
                                color: 'bg-amber-400'
                              }
                            ].map((row) => (
                              <div key={row.city} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-sans">
                                  <span className="text-zinc-400">{row.city}</span>
                                  <span className="font-mono text-zinc-200 font-bold">{row.revenue.toLocaleString()}đ</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-950 border border-neutral-900 relative">
                                  <div
                                    className={`h-full ${row.color} transition-all duration-1000`}
                                    style={{ width: `${row.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center bg-amber-950/5 border border-amber-500/10 p-3 text-[11px] leading-relaxed text-neutral-300">
                          <div className="flex items-center space-x-1 mb-1 font-bold text-amber-400">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>GỢI Ý VẬN HÀNH RẠP</span>
                          </div>
                          Điểm trũng doanh thu rơi vào <span className="underline font-bold text-white">Thứ Hai đầu tuần</span>. Khuyến nghị thiết lập suất chiếu ưu đãi <b>"Cinephile Night" sau 21h</b> để khai thác hạ tầng nhàn rỗi thu lợi nhuận rạp tối đa.
                        </div>
                      </div>
                    </div>

                    {/* 2. Donut Chart - Ticket Class Purchases */}
                    <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="border-b border-zinc-900 pb-3 mb-4">
                          <span className="text-[8px] font-mono tracking-widest text-[#a855f7] uppercase font-black">PHÂN DÒNG SẢN LƯỢNG VÉ</span>
                          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Tỷ lệ phân hạng ghế bán ra</h3>
                        </div>

                        {/* Core SVG Donut Chart */}
                        <div className="flex flex-col items-center justify-center my-2 space-y-4">
                          <div className="relative h-32 w-32 flex items-center justify-center" id="donut-ticket-tier-box">
                            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                              {/* Track ring */}
                              <circle cx="60" cy="60" r="44" fill="transparent" stroke="#0e0e11" strokeWidth="8" />

                              {/* VIP (45%) Segment */}
                              <circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="transparent"
                                stroke="#f59e0b"
                                strokeWidth="8"
                                strokeDasharray="124.4 276.4"
                                strokeDashoffset="0"
                                className="transition-all duration-500"
                              />

                              {/* Standard (35%) Segment */}
                              <circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="transparent"
                                stroke="#10b981"
                                strokeWidth="8"
                                strokeDasharray="96.7 276.4"
                                strokeDashoffset="-124.4"
                                className="transition-all duration-500"
                              />

                              {/* Couple/Premium Suite (20%) Segment */}
                              <circle
                                cx="60"
                                cy="60"
                                r="44"
                                fill="transparent"
                                stroke="#06b6d4"
                                strokeWidth="8"
                                strokeDasharray="55.3 276.4"
                                strokeDashoffset="-221.1"
                                className="transition-all duration-500"
                              />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-[7.5px] font-mono text-neutral-500 uppercase tracking-wider font-bold">Hệ số lấp</span>
                              <span className="text-sm font-mono font-black text-white">{averageFillRate}%</span>
                              <span className="text-[8px] text-emerald-400 font-mono font-bold">CHỈ SỐ SẠCH</span>
                            </div>
                          </div>

                          {/* Legend keys mapping */}
                          <div className="w-full grid grid-cols-3 gap-1 pt-2">
                            <div className="bg-black/40 border border-neutral-900 p-1.5 text-center rounded">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                <span className="text-[8px] font-mono text-zinc-400 font-bold">VIP</span>
                              </div>
                              <span className="block text-xs font-mono font-black text-white mt-1">45%</span>
                              <span className="text-[7.5px] text-neutral-500 font-mono block">168 vé</span>
                            </div>
                            <div className="bg-black/40 border border-neutral-900 p-1.5 text-center rounded">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[8px] font-mono text-zinc-400 font-bold">Chuẩn</span>
                              </div>
                              <span className="block text-xs font-mono font-black text-white mt-1">35%</span>
                              <span className="text-[7.5px] text-neutral-500 font-mono block">131 vé</span>
                            </div>
                            <div className="bg-black/40 border border-neutral-900 p-1.5 text-center rounded">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                                <span className="text-[8px] font-mono text-zinc-400 font-bold">Đôi</span>
                              </div>
                              <span className="block text-xs font-mono font-black text-white mt-1">20%</span>
                              <span className="text-[7.5px] text-neutral-500 font-mono block">75 vé</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0b0c10] border border-neutral-900 p-2.5 rounded text-[10px] text-zinc-400 font-mono">
                        <span className="font-bold text-amber-500">★ CO CẤU DOANH THU KỶ LỤC</span>
                        <span className="block mt-0.5 text-[8.5px] text-neutral-500 leading-normal">Ghế VIP đóng góp trên 54% tổng doanh thu rạp CinePremier nhờ hệ thống phòng chiếu Gold Lounge & IMAX.</span>
                      </div>
                    </div>

                  </div>

                  {/* Server Audit logs in pristine terminal view */}
                  <div className="border border-neutral-850 bg-black p-5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <span className="text-[9.5px] font-black text-amber-500 tracking-widest uppercase">ĐỒNG HỒ GIAO DỊCH VÀ KIỂM TOÁN HỆ THỐNG</span>
                      <span className="text-[8.5px] text-zinc-500 uppercase">SYSTEM LOG PROTOCOL</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2" id="terminal-audit-box">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="text-[11px] flex justify-between gap-4 text-zinc-400">
                          <div>
                            <span className="text-[#6272A4] font-bold">[{log.time}]</span>{' '}
                            <span className="text-amber-400 font-extrabold">{log.action}:</span>{' '}
                            <span className="text-zinc-200">{log.target}</span>
                          </div>
                          <span className="text-zinc-500 shrink-0 uppercase text-[9.5px]">[{log.user}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
    </>
  );
}
