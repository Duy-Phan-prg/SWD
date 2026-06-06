import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';
import { authApi } from '../../services/authApi';

export default function AdminMoviesPanel({ ctx }) {
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
    adminGenreFilter,
    setAdminGenreFilter,
    adminMoviePagination,
    setAdminMoviePagination,
    editingMovie,
    showMovieForm,
    setShowMovieForm,
    isMovieSaving,
    formData,
    setFormData,
    resetMovieForm,
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
    handleEditMovie,
    handleCreateMovieSubmit,
    handleUpdateMovieStatus,
    handleDeleteMovie,
    handleAddShowtimeSubmit,
    handleRefundTicket,
    filteredMovies,
    filteredGenres,
    moviesList,
    setMoviesList,
    bookedTickets,
    setBookedTickets,
    cinemaLocations,
    onSelectMovie,
    showToast,
    initialSection,
    onSectionChange,
    homepageVideoUrl,
    onHomepageVideoUrlChange,
    onFoodCatalogChanged,
    isAdmin
  } = ctx;

  const [actorForm, setActorForm] = useState({ name: '', biography: '', avatarUrl: '' });
  const [isActorSaving, setIsActorSaving] = useState(false);
  const [createdActors, setCreatedActors] = useState([]);

  const toggleMovieGenre = (genreId) => {
    const normalizedId = Number(genreId);
    const currentIds = formData.genreIds || [];
    const nextGenreIds = currentIds.includes(normalizedId)
      ? currentIds.filter((id) => id !== normalizedId)
      : [...currentIds, normalizedId];
    const nextGenreNames = genres
      .filter((genre) => nextGenreIds.includes(Number(genre.id)))
      .map((genre) => genre.name)
      .join(', ');

    setFormData({
      ...formData,
      genreIds: nextGenreIds,
      genre: nextGenreNames
    });
  };

  const updateMovieActorIds = (value) => {
    const actorIds = value
      .split(',')
      .map((id) => Number(id.trim()))
      .filter(Number.isFinite);
    setFormData({
      ...formData,
      actorIds
    });
  };

  const handleQuickCreateActor = async (event) => {
    event.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    if (!actorForm.name.trim()) {
      showToast('Vui lòng nhập tên actor.');
      return;
    }

    setIsActorSaving(true);
    try {
      const actor = await authApi.createAdminActor(token, {
        name: actorForm.name.trim(),
        biography: actorForm.biography.trim(),
        avatarUrl: actorForm.avatarUrl.trim()
      });
      const actorId = Number(actor.id);
      if (Number.isFinite(actorId)) {
        setFormData((prev) => ({
          ...prev,
          actorIds: Array.from(new Set([...(prev.actorIds || []), actorId]))
        }));
      }
      setCreatedActors((prev) => [actor, ...prev]);
      setActorForm({ name: '', biography: '', avatarUrl: '' });
      showToast(`Đã tạo actor: ${actor.name}`);
    } catch (error) {
      showToast(error.message || 'Không thể tạo actor.');
    } finally {
      setIsActorSaving(false);
    }
  };

  const getMovieStatusMeta = (movie) => {
    const status = String(movie?.status || '').toUpperCase();
    if (status === 'UPCOMING') {
      return {
        label: 'SẮP CHIẾU',
        dot: 'bg-amber-500',
        className: 'bg-amber-950/40 text-amber-400 border-amber-500/30'
      };
    }
    if (status === 'ENDED') {
      return {
        label: 'ĐÃ KẾT THÚC',
        dot: 'bg-sky-400',
        className: 'bg-sky-950/30 text-sky-300 border-sky-500/25'
      };
    }
    if (status === 'INACTIVE') {
      return {
        label: 'NGỪNG CÔNG CHIẾU',
        dot: 'bg-rose-500',
        className: 'bg-rose-950/30 text-rose-300 border-rose-500/30'
      };
    }
    return {
      label: 'ĐANG CHIẾU',
      dot: 'bg-emerald-500',
      className: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
    };
  };

  return (
    <>
      {/* TAB 2: MOVIES */}
      {activeTab === 'movies' && (
        <motion.div
          key="panel-movies"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >

          {/* Filter tools */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#070707] border border-neutral-850 p-4">

            {/* Custom input search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-neutral-600" />
              <input
                type="text"
                placeholder="Tìm kiếm phim theo tiêu đề hoặc đạo diễn..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAdminMoviePagination((prev) => ({ ...prev, page: 0 }));
                }}
                className="w-full bg-black border border-neutral-800 focus:border-amber-400 p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-0 placeholder-neutral-700 font-sans"
                id="search-all-movies-input"
              />
            </div>

            {/* Grid categories for status filter */}
            <div className="flex gap-2 w-full md:w-auto" id="film-filter-container">
              <select
                value={adminGenreFilter}
                onChange={(event) => {
                  setAdminGenreFilter(event.target.value);
                  setAdminMoviePagination((prev) => ({ ...prev, page: 0 }));
                }}
                className="border border-neutral-800 bg-black px-3 py-2 text-[9.5px] font-bold uppercase text-neutral-300 focus:border-amber-400 focus:outline-none"
                aria-label="Lọc phim theo thể loại"
              >
                <option value="">TẤT CẢ THỂ LOẠI</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </select>
              {[
                { id: 'ALL', name: 'TẤT CẢ PHIM' },
                { id: 'ACTIVE', name: 'ĐANG PHÁT HÀNH' },
                { id: 'UPCOMING', name: 'SẮP PHÁT HÀNH (SẮP CHIẾU)' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    playPulseSound(420, 'sine', 0.05);
                    setFilmFilter(filter.id);
                    setAdminMoviePagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  className={`px-3 py-2 text-[9.5px] uppercase font-bold transition-all ${filmFilter === filter.id
                    ? 'bg-amber-500 text-black font-extrabold'
                    : 'bg-black text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                    }`}
                >
                  {filter.name}
                </button>
              ))}

              <button
                onClick={() => {
                  playPulseSound(600, 'sine', 0.1);
                  resetMovieForm();
                  setShowMovieForm(true);
                }}
                className="ml-auto md:ml-0 px-4 py-2 bg-white text-black font-sans uppercase text-[9.5px] font-black tracking-wider hover:bg-neutral-250 transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" /> THÊM BẢN GHI MỚI
              </button>
            </div>
          </div>

          {/* MOVIE FORM MODAL (ADD OR EDIT RECORD) */}
          <AnimatePresence>
            {showMovieForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-amber-500/20 bg-gradient-to-b from-[#0e0c05] to-[#040404] p-5.5 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                    <Play className="h-3 w-3" /> THIẾT LẬP HỒ SƠ PHÁT HÀNH CHI TIẾT
                  </span>
                  {editingMovie && (
                    <span className="text-[9px] uppercase text-amber-200 font-mono">
                      Đang chỉnh sửa: {editingMovie.title}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      playPulseSound(300, 'sine', 0.05);
                      resetMovieForm();
                      setShowMovieForm(false);
                    }}
                    className="text-xs text-neutral-500 hover:text-white uppercase font-bold"
                  >
                    HỦY THAO TÁC
                  </button>
                </div>

                <form onSubmit={handleCreateMovieSubmit} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold block">Tên tác phẩm (Tiếng Việt viết Hoa)</label>
                      <input
                        type="text"
                        required
                        placeholder="VÍ DỤ: CHIẾN BINH ÁNH SÁNG"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold block">Tên tiếng Anh hoặc tiêu đề gốc</label>
                      <input
                        type="text"
                        placeholder="VÍ DỤ: Dawn of Light"
                        value={formData.englishTitle}
                        onChange={(e) => setFormData({ ...formData, englishTitle: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Đạo diễn</label>
                      <input
                        type="text"
                        placeholder="Trần Anh Hùng"
                        value={formData.director}
                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Thể loại (Ngăn nhau bởi dấu phẩy)</label>
                      <input
                        type="text"
                        required
                        placeholder="Hành Động, Khoa Học"
                        value={formData.genre}
                        readOnly
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <div className="mt-2 min-h-[42px] max-h-28 overflow-y-auto bg-black border border-neutral-800 p-2">
                        {isGenreLoading ? (
                          <span className="text-[10px] text-neutral-500 font-mono">Đang tải thể loại...</span>
                        ) : genres.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {genres.map((genre) => {
                              const checked = (formData.genreIds || []).includes(Number(genre.id));
                              return (
                                <button
                                  key={genre.id}
                                  type="button"
                                  onClick={() => toggleMovieGenre(genre.id)}
                                  className={`px-2 py-1 text-[9px] uppercase font-bold border transition ${checked
                                    ? 'border-amber-400 bg-amber-500 text-black'
                                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white'
                                    }`}
                                >
                                  {genre.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-mono">Chưa có thể loại từ API admin/genres</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Thời lượng (Số phút)</label>
                      <input
                        type="number"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Độ tuổi phân loại</label>
                      <select
                        value={formData.ageRating}
                        onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="P">P (Mọi lứa tuổi)</option>
                        <option value="T13">T13 (Dưới 13 hạn chế)</option>
                        <option value="T16">T16 (Dưới 16 hạn chế)</option>
                        <option value="T18">T18 (Chỉ dành cho người trưởng thành)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Ngày phát hành</label>
                      <input
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono [color-scheme:dark]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Trạng thái API</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value, isUpcoming: e.target.value === 'UPCOMING' })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="NOW_SHOWING">NOW_SHOWING</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="ENDED">ENDED</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Ngôn ngữ</label>
                      <input
                        type="text"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Phụ đề</label>
                      <input
                        type="text"
                        value={formData.subtitleLanguage}
                        onChange={(e) => setFormData({ ...formData, subtitleLanguage: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Diễn viên</label>
                      <input
                        type="text"
                        placeholder="Nguyễn A, Trần B, Lê C"
                        value={formData.castList}
                        onChange={(e) => setFormData({ ...formData, castList: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Actor IDs API</label>
                      <input
                        type="text"
                        placeholder="VD: 1, 2, 3"
                        value={(formData.actorIds || []).join(', ')}
                        onChange={(e) => updateMovieActorIds(e.target.value)}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div className="space-y-2 border border-neutral-800 bg-black p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Tên actor"
                          value={actorForm.name}
                          onChange={(e) => setActorForm({ ...actorForm, name: e.target.value })}
                          className="bg-neutral-950 border border-neutral-800 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <input
                          type="text"
                          placeholder="Tiểu sử"
                          value={actorForm.biography}
                          onChange={(e) => setActorForm({ ...actorForm, biography: e.target.value })}
                          className="bg-neutral-950 border border-neutral-800 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <input
                          type="text"
                          placeholder="Avatar URL"
                          value={actorForm.avatarUrl}
                          onChange={(e) => setActorForm({ ...actorForm, avatarUrl: e.target.value })}
                          className="bg-neutral-950 border border-neutral-800 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickCreateActor}
                        disabled={isActorSaving}
                        className="w-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500 hover:text-black disabled:opacity-50"
                      >
                        {isActorSaving ? 'Đang tạo actor...' : 'Tạo actor và gán ID vào phim'}
                      </button>
                      {createdActors.length > 0 && (
                        <div className="text-[9px] text-neutral-400 font-mono">
                          Actor vừa tạo: {createdActors.slice(0, 3).map((actor) => `${actor.name}#${actor.id}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Trailer URL</label>
                      <input
                        type="text"
                        value={formData.trailerUrl}
                        onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 block">Địa chỉ ảnh Poster đứng (URL)</label>
                      <input
                        type="text"
                        value={formData.posterUrl}
                        onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-neutral-500 block">Địa chỉ ảnh Banner ngang (URL)</label>
                      <input
                        type="text"
                        value={formData.bannerUrl}
                        onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                        className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[#A1B0B8] block">Tóm tắt cốt truyện cốt lõi</label>
                    <textarea
                      rows={3}
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      placeholder="Mô tả tóm tắt nội dung để hấp dẫn khách mua vé..."
                      className="w-full bg-black border border-neutral-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-6 p-1 border-t border-neutral-900 pt-3">
                    <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isHot}
                        onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                        className="accent-amber-500 h-3.5 w-3.5"
                      />
                      <span>Đánh dấu tác phẩm <b>BOM TẤN HOT</b></span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-zinc-300 text-xs">
                      <input
                        type="checkbox"
                        checked={formData.isUpcoming}
                        onChange={(e) => setFormData({ ...formData, isUpcoming: e.target.checked })}
                        className="accent-amber-500 h-3.5 w-3.5"
                      />
                      <span>Gắn nhãn tác phẩm <b>SẮP CHIẾU (CHƯA PHỤC VỤ ĐẶT GHẾ)</b></span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isMovieSaving}
                    className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-widest transition shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMovieSaving
                      ? (editingMovie ? 'ĐANG GỬI API CẬP NHẬT PHIM...' : 'ĐANG GỬI API TẠO PHIM...')
                      : (editingMovie ? 'CẬP NHẬT BẢN GHI PHIM' : 'GHI BẢN GHI PHIM & PHÁT HÀNH TRÊN CỔNG TRỰC TUYẾN')}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIST OF MOVIES IN DATABASE - Pristine table layout */}
          <div className="border border-neutral-850 bg-neutral-950 overflow-x-auto shadow-md">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-850 bg-black text-[#7E8B93] text-[9.5px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Hình ảnh</th>
                  <th className="py-3 px-4">Tên phim & Thời lượng</th>
                  <th className="py-3 px-4">Thể loại</th>
                  <th className="py-3 px-4">Đạo diễn</th>
                  <th className="py-3 px-4">Trạng thái phát hành</th>
                  <th className="py-3 px-4 text-right">Thao tác dữ liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredMovies.map(mv => (
                  <tr key={mv.id} className="hover:bg-neutral-900/35 transition-all">
                    <td className="py-3.5 px-4 shrink-0">
                      <img
                        src={mv.posterUrl}
                        alt={mv.title}
                        className="w-10 h-14 object-cover border border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-serif italic text-sm text-white font-black">{mv.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-xs">{mv.englishTitle}</div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[9.5px] border border-neutral-850 bg-[#060606] px-1.5 py-0.5 text-zinc-400 font-mono">{mv.duration} phút</span>
                        <span className={`text-[9.5px] px-1.5 py-0.5 font-bold ${mv.ageRating === 'T18' ? 'bg-red-950/20 text-red-400 border border-red-500/20' : 'bg-neutral-900 text-zinc-400'
                          }`}>{mv.ageRating}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10.5px] text-zinc-300 font-medium">{mv.genre.join(' • ')}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-semibold">
                      {mv.director}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-2">
                        <select
                          value={mv.status || 'NOW_SHOWING'}
                          onChange={(event) => handleUpdateMovieStatus(mv, event.target.value)}
                          className="h-7 min-w-32 border border-neutral-800 bg-black px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-300 focus:border-amber-400 focus:outline-none"
                          aria-label={`Đổi trạng thái ${mv.title}`}
                        >
                          <option value="NOW_SHOWING">NOW_SHOWING</option>
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="ENDED">ENDED</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                        <div className="flex items-center gap-2">
                        {mv.status === 'INACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-rose-950/30 text-rose-300 border border-rose-500/30 text-[9px] uppercase font-bold tracking-wider rounded-sm select-none shrink-0 h-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                            NGỪNG CÔNG CHIẾU
                          </span>
                        ) : mv.status === 'ENDED' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-sky-950/30 text-sky-300 border border-sky-500/25 text-[9px] uppercase font-bold tracking-wider rounded-sm select-none shrink-0 h-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5"></span>
                            ĐÃ KẾT THÚC
                          </span>
                        ) : mv.isUpcoming ? (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-950/40 text-amber-400 border border-amber-500/30 text-[9px] uppercase font-bold tracking-wider rounded-sm select-none shrink-0 h-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                            SẮP CHIẾU
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold tracking-wider rounded-sm select-none shrink-0 h-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                            ĐANG CHIẾU
                          </span>
                        )}
                        {mv.isHot && (
                          <span className="inline-flex items-center px-1.5 py-1 bg-red-600 text-white text-[8px] font-black tracking-widest uppercase rounded-sm select-none shrink-0 h-6">
                            HOT
                          </span>
                        )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onSelectMovie(mv.id)}
                          className="p-1 px-2 text-[9px] border border-neutral-800 hover:border-white transition uppercase font-sans text-neutral-400 hover:text-white"
                          title="Xem trang chi tiết bên ngoài"
                        >
                          Xem trang
                        </button>
                        <button
                          onClick={() => handleEditMovie(mv)}
                          disabled={mv.status === 'INACTIVE' || mv.isInactive}
                          className="p-1.5 text-amber-400 hover:bg-amber-950/10 border border-transparent hover:border-amber-500/30 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:border-transparent"
                          title="Chỉnh sửa phim"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(mv)}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/10 border border-transparent hover:border-rose-500/30 transition shadow-sm"
                          title="Tước quyền phát hành phim"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMovies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono uppercase tracking-wider">
                      Không tìm thấy bản ghi phim phù hợp tiêu chí truy vấn
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-850 bg-black p-3 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
            <span>
              Tổng {adminMoviePagination.totalElements} phim - Trang {adminMoviePagination.page + 1}/{adminMoviePagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={adminMoviePagination.page <= 0}
                onClick={() => setAdminMoviePagination((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                className="border border-neutral-800 px-3 py-2 text-white disabled:opacity-30 hover:border-white transition"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={adminMoviePagination.page + 1 >= adminMoviePagination.totalPages}
                onClick={() => setAdminMoviePagination((prev) => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                className="border border-neutral-800 px-3 py-2 text-white disabled:opacity-30 hover:border-white transition"
              >
                Sau
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
