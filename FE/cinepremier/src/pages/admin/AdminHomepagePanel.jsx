import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';

export default function AdminHomepagePanel({ ctx }) {
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
    homepageForm,
    setHomepageForm,
    homepageVideoError,
    setHomepageVideoError,
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
    getYoutubeId,
    handleHomepageVideoSubmit,
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
    homepageVideoUrl,
    onHomepageVideoUrlChange,
    onFoodCatalogChanged,
    isAdmin
  } = ctx;

  return (
    <>
              {/* TAB 2C: HOMEPAGE VIDEO */}
              {activeTab === 'homepage' && (
                <motion.div
                  key="panel-homepage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border border-neutral-850 bg-gradient-to-r from-[#090909] to-[#050505] p-5">
                    <span className="text-[8px] font-mono tracking-[0.24em] text-amber-500 uppercase font-black block">HOME HERO VIDEO</span>
                    <h2 className="text-lg font-sans font-black uppercase tracking-wider text-white mt-1">Chỉnh sửa video Homepage</h2>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <form onSubmit={handleHomepageVideoSubmit} className="xl:col-span-5 border border-neutral-850 bg-[#070707] p-5 space-y-5">
                      <div className="border-b border-neutral-900 pb-3">
                        <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neutral-500 font-black">Nguồn phát YouTube</span>
                        <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">URL video nền trang chủ</h3>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">URL YouTube</label>
                          <span className="text-[9px] font-mono text-neutral-600">{homepageForm.videoUrl.length}/300</span>
                        </div>
                        <input
                          type="url"
                          value={homepageForm.videoUrl}
                          maxLength={300}
                          onChange={(e) => {
                            setHomepageForm({ videoUrl: e.target.value });
                            if (homepageVideoError) setHomepageVideoError('');
                          }}
                          placeholder="https://www.youtube.com/watch?v=k8m0SaGQ_1c"
                          className={`w-full bg-black border p-3 text-sm text-white focus:outline-none rounded-none font-bold ${homepageVideoError ? 'border-rose-500 focus:border-rose-400' : 'border-neutral-800 focus:border-amber-400'}`}
                        />
                        {homepageVideoError && (
                          <p className="text-[10px] text-rose-400 font-bold">{homepageVideoError}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="border border-neutral-900 bg-black p-3">
                          <span className="block uppercase tracking-widest text-neutral-500">Video ID</span>
                          <b className="mt-1 block text-amber-300">{getYoutubeId(homepageForm.videoUrl) || 'Chưa hợp lệ'}</b>
                        </div>
                        <div className="border border-neutral-900 bg-black p-3">
                          <span className="block uppercase tracking-widest text-neutral-500">Trạng thái</span>
                          <b className={`mt-1 block ${getYoutubeId(homepageForm.videoUrl) ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {getYoutubeId(homepageForm.videoUrl) ? 'Sẵn sàng' : 'Cần kiểm tra'}
                          </b>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
                      >
                        Lưu video Homepage <Check className="h-4 w-4" />
                      </button>
                    </form>

                    <div className="xl:col-span-7 border border-neutral-850 bg-neutral-950 overflow-hidden">
                      <div className="p-4 border-b border-neutral-850 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-[0.2em] font-black">Xem trước nền hero</span>
                          <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">Homepage video preview</h3>
                        </div>
                        <Play className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="relative aspect-video bg-black">
                        {getYoutubeId(homepageForm.videoUrl) ? (
                          <iframe
                            className="absolute inset-0 h-full w-full border-0"
                            src={`https://www.youtube.com/embed/${getYoutubeId(homepageForm.videoUrl)}?autoplay=0&controls=1&rel=0&modestbranding=1`}
                            title="Homepage video preview"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Nhập URL YouTube hợp lệ để xem trước
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
    </>
  );
}
