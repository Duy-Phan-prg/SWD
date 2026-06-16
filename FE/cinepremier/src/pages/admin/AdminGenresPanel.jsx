import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';

export default function AdminGenresPanel({ ctx }) {
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
              {/* TAB 2B: GENRES */}
              {activeTab === 'genres' && (
                <motion.div
                  key="panel-genres"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border border-neutral-850 bg-gradient-to-r from-[#090909] to-[#050505] p-5">
                    <div>
                      <span className="text-[8px] font-mono tracking-[0.24em] text-amber-500 uppercase font-black block">ADMIN GENRE</span>
                      <h2 className="text-lg font-sans font-black uppercase tracking-wider text-white mt-1">Quản trị thể loại phim</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
                    <div className="border border-neutral-850 bg-[#070707] p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                        <div>
                          <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neutral-500 font-black">
                            {editingGenreId ? 'Chỉnh sửa bản ghi' : 'Tạo bản ghi mới'}
                          </span>
                          <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">
                            {editingGenreId ? 'Cập nhật thể loại' : 'Thêm thể loại'}
                          </h3>
                        </div>
                        {editingGenreId && (
                          <button
                            type="button"
                            onClick={resetGenreForm}
                            className="border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-amber-200 hover:bg-amber-400 hover:text-black font-black transition"
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleGenreSubmit} className="space-y-4 text-xs font-sans">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Tên thể loại</label>
                            <span className={`text-[9px] font-mono ${genreForm.name.length > 100 ? 'text-rose-400' : 'text-neutral-600'}`}>
                              {genreForm.name.length}/100
                            </span>
                          </div>
                          <textarea
                            value={genreForm.name}
                            maxLength={100}
                            rows={2}
                            wrap="soft"
                            onChange={(e) => {
                              const nextName = e.target.value.replace(/[\r\n]+/g, ' ');
                              setGenreForm((prev) => ({ ...prev, name: nextName.slice(0, 100) }));
                              if (genreErrors.name) setGenreErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            placeholder="Ví dụ: Hành động, Tâm lý, Sci-Fi..."
                            className={`w-full min-h-[64px] resize-none break-words bg-black border p-2.5 text-sm text-white focus:outline-none rounded-none font-bold leading-relaxed caret-amber-300 ${genreErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-neutral-800 focus:border-amber-400'
                              }`}
                          />
                          {genreErrors.name && (
                            <p className="text-[10px] text-rose-400 font-bold">{genreErrors.name}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Mô tả</label>
                            <span className={`text-[9px] font-mono ${genreForm.description.length < 50 || genreForm.description.length > 1000 ? 'text-rose-400' : 'text-neutral-600'}`}>
                              {genreForm.description.length}/1000
                            </span>
                          </div>
                          <textarea
                            value={genreForm.description}
                            maxLength={1000}
                            rows={5}
                            onChange={(e) => {
                              setGenreForm((prev) => ({ ...prev, description: e.target.value }));
                              if (genreErrors.description) setGenreErrors((prev) => ({ ...prev, description: undefined }));
                            }}
                            placeholder="Mô tả ngắn về gu phim, nhịp kể, nhóm khán giả phù hợp..."
                            className={`w-full resize-none bg-black border p-2.5 text-sm text-white focus:outline-none rounded-none leading-relaxed ${genreErrors.description ? 'border-rose-500 focus:border-rose-400' : 'border-neutral-800 focus:border-amber-400'
                              }`}
                          />
                          {genreErrors.description && (
                            <p className="text-[10px] text-rose-400 font-bold">{genreErrors.description}</p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isGenreSaving}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-widest transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {isGenreSaving ? (
                            <span className="h-4 w-4 border-2 border-black border-t-transparent animate-spin rounded-full inline-block"></span>
                          ) : editingGenreId ? (
                            <>Cập nhật thể loại <Check className="h-4 w-4" /></>
                          ) : (
                            <>Tạo thể loại <Plus className="h-4 w-4" /></>
                          )}
                        </button>
                      </form>
                    </div>

                    <div className="min-w-0 border border-neutral-850 bg-neutral-950 overflow-hidden">
                      <div className="p-3 border-b border-neutral-850 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div>
                          <span className="text-[8px] font-mono text-white uppercase tracking-[0.2em] font-black " >Danh sách loại phim </span>
                          <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">
                            {genres.length} thể loại đã đồng bộ
                          </h3>
                        </div>
                        <div className="relative w-full md:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
                          <input
                            type="text"
                            value={genreSearch}
                            onChange={(e) => setGenreSearch(e.target.value)}
                            placeholder="Tìm thể loại..."
                            className="w-full bg-black border border-neutral-800 py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="max-h-[540px] overflow-y-auto custom-scrollbar">
                        <table className="w-full table-fixed text-left border-collapse">
                          <thead className="sticky top-0 z-10 bg-black">
                            <tr className="border-b border-neutral-850 text-[9px] uppercase tracking-widest text-neutral-500 font-sans">
                              <th className="py-2.5 px-3 w-[54px]">ID</th>
                              <th className="py-2.5 px-3 w-[170px]">Tên thể loại</th>
                              <th className="py-2.5 px-3">Mô tả</th>
                              <th className="py-2.5 px-3 text-right w-[86px]">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900">
                            {isGenreLoading ? (
                              <tr>
                                <td colSpan={4} className="py-10 text-center text-neutral-500 font-mono uppercase tracking-wider">
                                  Đang tải danh sách thể loại...
                                </td>
                              </tr>
                            ) : filteredGenres.length > 0 ? (
                              filteredGenres.map((genre) => (
                                <tr key={genre.id} className="hover:bg-neutral-900/50 transition">
                                  <td className="py-2.5 px-3 text-[10px] font-mono text-neutral-500">#{genre.id}</td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-black text-white text-xs uppercase tracking-wide truncate">{genre.name}</div>
                                    <div className="text-[9px] text-neutral-600 font-mono mt-0.5">
                                      {genre.updatedAt ? `Cập nhật: ${new Date(genre.updatedAt).toLocaleDateString('vi-VN')}` : 'Chưa có mốc cập nhật'}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-xs text-neutral-300 leading-relaxed">
                                    <div className="line-clamp-2 break-words">{genre.description || <span className="text-neutral-600 italic">Chưa có mô tả</span>}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditGenre(genre)}
                                        className="p-1.5 text-amber-300 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-400 hover:text-black transition"
                                        title="Chỉnh sửa thể loại"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGenre(genre)}
                                        className="p-1.5 text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 hover:text-black transition"
                                        title="Xóa thể loại"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-10 text-center text-neutral-500 font-mono uppercase tracking-wider">
                                  Không có thể loại phù hợp truy vấn
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
    </>
  );
}
