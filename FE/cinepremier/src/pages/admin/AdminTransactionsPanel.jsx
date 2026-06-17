import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';

export default function AdminTransactionsPanel({ ctx }) {
  const {
    activeTab,
    setActiveTab,
    selectedAnalysisMovieId,
    setSelectedAnalysisMovieId,
    isReanalyzing,
    setIsReanalyzing,
    analysisScrambleOffset,
    setAnalysisScrambleOffset,
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
    onSelectMovie,
    showToast,
    initialSection,
    onSectionChange,
    onFoodCatalogChanged,
    isAdmin
  } = ctx;

  return (
    <>
              {/* TAB 4: TRANSACTIONS */}
              {activeTab === 'transactions' && (
                <motion.div
                  key="panel-transactions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >

                  <div className="border border-neutral-850 bg-neutral-950 overflow-hidden shadow-md">
                    <div className="p-4.5 bg-black border-b border-neutral-850 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="space-y-0.5 self-start">
                        <h3 className="text-xs font-sans font-black uppercase text-zinc-300 tracking-wider">THƯ SỔ CÁI TOÀN BỘ GIAO DỊCH KHÁCH HÀNG</h3>
                        <p className="text-[10px] text-zinc-500">Giám sát các cổng thanh toán liên bang, hoàn bồi ghế ngồi</p>
                      </div>

                      {/* Transaction counters indicator */}
                      <div className="text-[10px] text-zinc-400 font-mono tracking-wider bg-zinc-900/40 border border-neutral-800 p-2 uppercase flex gap-4">
                        <span>Đã giải quyết: <b>{bookedTickets.length} trực tuyến</b></span>
                        <span>Tồn quỹ rạp: <b className="text-amber-400">{calculatedRevenue.toLocaleString()}đ</b></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                          <tr className="border-b border-neutral-950 bg-neutral-950 text-[#7E8B93] text-[9.5px] uppercase font-bold tracking-wider whitespace-nowrap select-none">
                            <th className="py-3 px-4">Khách hàng / Mã vé</th>
                            <th className="py-3 px-4">Tác phẩm điện ảnh</th>
                            <th className="py-3 px-4">Rạp chiếu / Khung giờ</th>
                            <th className="py-3 px-4 font-mono text-center">Định vị ghế</th>
                            <th className="py-3 px-4 text-right">Tổng tiền thanh toán</th>
                            <th className="py-3 px-4 text-right">Cơ chế quản trị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-xs">
                          {bookedTickets.map(tc => (
                            <tr key={tc.ticketId} className="hover:bg-neutral-900/35 transition-all">
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-bold text-white font-sans flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Minh Hồng VIP
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 tracking-wider">{tc.ticketId}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-serif italic font-black text-xs text-white">{tc.movie.title}</div>
                                <span className="text-[9px] text-[#7E8B93] font-mono block uppercase">{tc.movie.englishTitle}</span>
                              </td>
                              <td className="py-3.5 px-4 font-sans text-neutral-300 whitespace-nowrap">
                                <div className="font-bold">{tc.hall.split('(')[0]}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{tc.showtime} - {tc.date.split(',')[0]}</div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1 flex-wrap max-w-[120px] mx-auto">
                                  {tc.selectedSeats.map(s => (
                                    <span key={s.id} className="inline-flex items-center px-1.5 py-0.5 bg-zinc-950 border border-neutral-850 font-mono font-black text-rose-400 text-[10px] rounded-sm shadow-inner">
                                      {s.id}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono text-white font-black text-sm whitespace-nowrap">
                                {tc.totalAmount.toLocaleString()}đ
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleRefundTicket(tc.ticketId, 'Minh Hồng VIP')}
                                  className="px-2.5 py-1 bg-rose-950/20 text-rose-400 border border-rose-500/25 hover:bg-rose-500 hover:text-black transition uppercase text-[9.5px] font-sans font-bold rounded-sm"
                                  title="Hủy vé bồi hoàn dòng tiền"
                                >
                                  HỦY KHÓA VÀ HOÀN TIỀN
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </motion.div>
              )}
    </>
  );
}
