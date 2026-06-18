import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags, ImagePlus, ChevronLeft, ChevronRight
} from 'lucide-react';

const FOOD_PAGE_SIZE = 10;

export default function AdminFoodsPanel({ ctx }) {
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
    isFoodImageUploading,
    handleFoodImageUpload,
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
  const [foodPage, setFoodPage] = React.useState(1);
  const totalFoodPages = Math.max(1, Math.ceil(visibleFoods.length / FOOD_PAGE_SIZE));
  const safeFoodPage = Math.min(foodPage, totalFoodPages);
  const foodStartIndex = (safeFoodPage - 1) * FOOD_PAGE_SIZE;
  const paginatedFoods = visibleFoods.slice(foodStartIndex, foodStartIndex + FOOD_PAGE_SIZE);
  const foodDisplayStart = visibleFoods.length === 0 ? 0 : foodStartIndex + 1;
  const foodDisplayEnd = Math.min(foodStartIndex + FOOD_PAGE_SIZE, visibleFoods.length);

  React.useEffect(() => {
    setFoodPage(1);
  }, [foodSearch]);

  React.useEffect(() => {
    setFoodPage((page) => Math.min(page, totalFoodPages));
  }, [totalFoodPages]);

  return (
    <>
              {/* TAB 2C: FOODS */}
              {activeTab === 'foods' && (
                <motion.div
                  key="panel-foods"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border border-neutral-850 bg-gradient-to-r from-[#090909] to-[#050505] p-5">
                    <span className="text-[8px] font-mono tracking-[0.24em] text-amber-500 uppercase font-black block">ADMIN FOOD API</span>
                    <h2 className="text-lg font-sans font-black uppercase tracking-wider text-white mt-1">Quản lý bắp nước & combo</h2>
                  </div>

                  <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
                    <form onSubmit={handleFoodSubmit} className="2xl:col-span-4 border border-neutral-850 bg-[#070707] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                        <div>
                          <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neutral-500 font-black">
                            {editingFood ? 'Chỉnh sửa món' : 'Tạo món mới'}
                          </span>
                          <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">
                            {foodKind === 'combo' ? 'Combo bắp nước' : 'Món lẻ'}
                          </h3>
                        </div>
                        {editingFood && (
                          <button
                            type="button"
                            onClick={resetFoodForm}
                            className="border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-amber-200 hover:bg-amber-400 hover:text-black font-black transition"
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {['item', 'combo'].map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => {
                              setFoodKind(kind);
                              setEditingFood(null);
                            }}
                            className={`py-2 text-[10px] uppercase tracking-widest font-black border transition ${foodKind === kind ? 'border-amber-400 bg-amber-400 text-black' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}
                          >
                            {kind === 'combo' ? 'Combo' : 'Món lẻ'}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Tên món</label>
                        <input
                          value={foodForm.name}
                          onChange={(e) => {
                            setFoodForm((prev) => ({ ...prev, name: e.target.value }));
                            if (foodErrors.name) setFoodErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          placeholder="Combo Couple, Coca Size L..."
                          className={`w-full bg-black border p-3 text-sm text-white focus:outline-none rounded-none font-bold ${foodErrors.name ? 'border-rose-500' : 'border-neutral-800 focus:border-amber-400'}`}
                        />
                        {foodErrors.name && <p className="text-[10px] text-rose-400 font-bold">{foodErrors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Giá bán</label>
                          <input
                            type="number"
                            min="1"
                            value={foodForm.price}
                            onChange={(e) => {
                              setFoodForm((prev) => ({ ...prev, price: e.target.value }));
                              if (foodErrors.price) setFoodErrors((prev) => ({ ...prev, price: undefined }));
                            }}
                            className={`w-full bg-black border p-3 text-sm text-white focus:outline-none rounded-none font-bold ${foodErrors.price ? 'border-rose-500' : 'border-neutral-800 focus:border-amber-400'}`}
                          />
                          {foodErrors.price && <p className="text-[10px] text-rose-400 font-bold">{foodErrors.price}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Trạng thái</label>
                          <select
                            value={foodForm.status}
                            onChange={(e) => setFoodForm((prev) => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-black border border-neutral-800 p-3 text-sm text-white focus:outline-none rounded-none font-bold focus:border-amber-400"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Số lượng tồn kho</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={foodForm.stockQuantity}
                          onChange={(e) => {
                            setFoodForm((prev) => ({ ...prev, stockQuantity: e.target.value }));
                            if (foodErrors.stockQuantity) setFoodErrors((prev) => ({ ...prev, stockQuantity: undefined }));
                          }}
                          placeholder="VD: 120"
                          className={`w-full bg-black border p-3 text-sm text-white focus:outline-none rounded-none font-bold ${foodErrors.stockQuantity ? 'border-rose-500' : 'border-neutral-800 focus:border-amber-400'}`}
                        />
                        {foodErrors.stockQuantity && <p className="text-[10px] text-rose-400 font-bold">{foodErrors.stockQuantity}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">URL hình ảnh</label>
                        <div className="flex gap-2">
                          <input
                            value={foodForm.imageUrl}
                            onChange={(e) => {
                              setFoodForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                              if (foodErrors.imageUrl) setFoodErrors((prev) => ({ ...prev, imageUrl: undefined }));
                            }}
                            placeholder="https://res.cloudinary.com/..."
                            className={`min-w-0 flex-1 bg-black border p-3 text-xs text-white focus:outline-none rounded-none ${foodErrors.imageUrl ? 'border-rose-500' : 'border-neutral-800 focus:border-amber-400'}`}
                          />
                          <label
                            className={`inline-flex min-w-[92px] cursor-pointer items-center justify-center gap-2 border px-3 text-[10px] font-black uppercase tracking-widest transition ${isFoodImageUploading ? 'pointer-events-none border-neutral-800 text-neutral-500 opacity-70' : 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-400 hover:text-black'}`}
                            title="Upload ảnh từ máy lên Cloudinary"
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleFoodImageUpload}
                              disabled={isFoodImageUploading}
                              className="hidden"
                            />
                            {isFoodImageUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                            Local
                          </label>
                        </div>
                        {foodForm.imageUrl && (
                          <div className="overflow-hidden border border-neutral-850 bg-black">
                            <img
                              src={foodForm.imageUrl}
                              alt={foodForm.name || 'Ảnh món'}
                              className="h-32 w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-neutral-500 font-medium">
                          Chọn ảnh từ máy để upload lên Cloudinary, hoặc dán URL ảnh có sẵn.
                        </p>
                        {foodErrors.imageUrl && <p className="text-[10px] text-rose-400 font-bold">{foodErrors.imageUrl}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Mô tả</label>
                        <textarea
                          value={foodForm.description}
                          maxLength={500}
                          rows={5}
                          onChange={(e) => {
                            setFoodForm((prev) => ({ ...prev, description: e.target.value }));
                            if (foodErrors.description) setFoodErrors((prev) => ({ ...prev, description: undefined }));
                          }}
                          className={`w-full resize-none bg-black border p-3 text-sm text-white focus:outline-none rounded-none leading-relaxed ${foodErrors.description ? 'border-rose-500' : 'border-neutral-800 focus:border-amber-400'}`}
                        />
                        {foodErrors.description && <p className="text-[10px] text-rose-400 font-bold">{foodErrors.description}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={isFoodSaving}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-widest transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isFoodSaving ? 'Đang lưu...' : editingFood ? 'Cập nhật món' : 'Tạo món'} <Check className="h-4 w-4" />
                      </button>
                    </form>

                    <div className="2xl:col-span-8 border border-neutral-850 bg-neutral-950 overflow-hidden">
                      <div className="p-4 border-b border-neutral-850 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-[0.2em] font-black">Danh sách từ backend</span>
                          <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white mt-1">
                            {foodItems.length + foodCombos.length} món đang quản lý
                          </h3>
                        </div>
                        <div className="relative w-full md:w-80">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
                          <input
                            value={foodSearch}
                            onChange={(e) => setFoodSearch(e.target.value)}
                            placeholder="Tìm món..."
                            className="w-full bg-black border border-neutral-800 py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="overflow-hidden">
                        <table className="w-full table-fixed text-left border-collapse">
                          <thead>
                            <tr className="bg-black/60 border-b border-neutral-850 text-[9px] uppercase tracking-widest text-neutral-500 font-sans">
                              <th className="py-3 px-4 w-[46%]">Món</th>
                              <th className="py-3 px-3 w-[13%]">Loại</th>
                              <th className="py-3 px-3 w-[14%]">Giá</th>
                              <th className="py-3 px-3 w-[14%]">Trạng thái</th>
                              <th className="py-3 px-3 w-[13%] text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900">
                            {isFoodLoading ? (
                              <tr>
                                <td colSpan={5} className="py-10 text-center text-neutral-500 font-mono uppercase tracking-wider">
                                  Đang tải danh sách bắp nước...
                                </td>
                              </tr>
                            ) : visibleFoods.length > 0 ? (
                              paginatedFoods
                                .map((item) => (
                                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-neutral-900/50 transition">
                                    <td className="py-3.5 px-4 min-w-0">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={item.imageUrl || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=300&auto=format&fit=crop'}
                                          alt={item.name}
                                          className="h-12 w-12 object-cover border border-neutral-800 bg-black"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="min-w-0">
                                          <div className="font-black text-white text-sm uppercase tracking-wide truncate">{item.name}</div>
                                          <div className={`text-[10px] font-black uppercase tracking-wider ${Number(item.stockQuantity || 0) === 0 ? 'text-rose-300' : Number(item.stockQuantity || 0) <= 5 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                            Tồn kho: {Number(item.stockQuantity || 0).toLocaleString('vi-VN')}
                                          </div>
                                          <div className="text-[10px] text-neutral-500 truncate">{item.description || 'Chưa có mô tả'}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3 text-xs font-black uppercase text-amber-300 truncate">{item.kind === 'combo' ? 'Combo' : 'Món lẻ'}</td>
                                    <td className="py-3.5 px-3 text-xs font-mono text-white truncate">{Number(item.price).toLocaleString()}đ</td>
                                    <td className="py-3.5 px-3">
                                      <span className={`text-[10px] font-black uppercase ${item.status === 'ACTIVE' ? 'text-emerald-300' : item.status === 'OUT_OF_STOCK' ? 'text-amber-300' : 'text-rose-300'}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditFood(item, item.kind)}
                                          className="p-2 text-amber-300 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-400 hover:text-black transition"
                                          title="Chỉnh sửa món"
                                        >
                                          <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleFoodStatus(item, item.kind)}
                                          className="p-2 text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 hover:text-black transition"
                                          title={item.status === 'ACTIVE' ? 'Ẩn khỏi khách hàng' : 'Bật bán cho khách hàng'}
                                        >
                                          {item.status === 'ACTIVE' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-10 text-center text-neutral-500 font-mono uppercase tracking-wider">
                                  Không có món bắp nước phù hợp.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-neutral-850 bg-black/80 p-3 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          Hiển thị {foodDisplayStart}-{foodDisplayEnd}/{visibleFoods.length} món - Trang {safeFoodPage}/{totalFoodPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={safeFoodPage <= 1}
                            onClick={() => setFoodPage((page) => Math.max(1, page - 1))}
                            className="inline-flex items-center gap-1 border border-neutral-800 px-3 py-2 text-white transition hover:border-white disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" /> Trước
                          </button>
                          <button
                            type="button"
                            disabled={safeFoodPage >= totalFoodPages}
                            onClick={() => setFoodPage((page) => Math.min(totalFoodPages, page + 1))}
                            className="inline-flex items-center gap-1 border border-neutral-800 px-3 py-2 text-white transition hover:border-white disabled:opacity-30"
                          >
                            Sau <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
    </>
  );
}
