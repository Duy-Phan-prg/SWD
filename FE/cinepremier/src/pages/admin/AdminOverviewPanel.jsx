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
                          <span className="text-[8px] font-mono tracking-widest text-purple-500 uppercase font-black">DOANH THU</span>
                          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Tổng quan doanh thu</h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-center py-12 text-neutral-500 text-sm">
                        Biểu đồ doanh thu sẽ được hiển thị khi có dữ liệu
                      </div>
                    </div>

                    {/* 2. Donut Chart - Ticket Class Purchases */}
                    <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="border-b border-zinc-900 pb-3 mb-4">
                          <span className="text-[8px] font-mono tracking-widest text-[#a855f7] uppercase font-black">PHÂN LOẠI VÉ</span>
                          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Tỷ lệ phân hạng ghế</h3>
                        </div>

                        <div className="flex items-center justify-center py-12 text-neutral-500 text-sm">
                          Biểu đồ phân loại vé sẽ được hiển thị khi có dữ liệu
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Server Audit logs */}
                  <div className="border border-neutral-850 bg-black p-5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <span className="text-[9.5px] font-black text-purple-500 tracking-widest uppercase">NHẬT KÝ HỆ THỐNG</span>
                    </div>
                    <div className="flex items-center justify-center py-12 text-neutral-500 text-sm">
                      Nhật ký hệ thống sẽ được hiển thị khi có hoạt động
                    </div>
                  </div>
                </motion.div>
              )}
    </>
  );
}
