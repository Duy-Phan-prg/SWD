import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, MapPin, Film, Play, Eye, EyeOff, Sparkles, TrendingUp, Info, Globe, Tags
} from 'lucide-react';

export default function AdminAiAnalysisPanel({ ctx }) {
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
              {/* TAB 5: AI ANALYSIS OF MOVIES */}
              {activeTab === 'ai-analysis' && (() => {
                const m = moviesList.find(x => x.id === selectedAnalysisMovieId) || moviesList[0];
                if (!m) return null;

                // Generate dynamic ratings based on movie database plus any requested calibration offsets
                const overallScore = Math.min(10.0, Math.max(1.0, Number((m.ratings?.aiOverall || 9.2) + analysisScrambleOffset.overall))).toFixed(1);
                const storyScore = Math.min(10.0, Math.max(1.0, Number((m.ratings?.aiStory || 9.0) + analysisScrambleOffset.story))).toFixed(1);
                const actingScore = Math.min(10.0, Math.max(1.0, Number((m.ratings?.aiActing || 8.8) + analysisScrambleOffset.acting))).toFixed(1);
                const visualScore = Math.min(10.0, Math.max(1.0, Number((m.ratings?.aiVisual || 9.4) + analysisScrambleOffset.visual))).toFixed(1);
                const audioScore = Math.min(10.0, Math.max(1.0, Number((m.ratings?.aiAudio || 8.9) + analysisScrambleOffset.audio))).toFixed(1);

                // Compute circular SVG dashoffset
                const radius = 38;
                const strokeDasharray = 2 * Math.PI * radius; // ~238.7
                const strokeDashoffset = strokeDasharray - (strokeDasharray * Number(overallScore)) / 10;

                const handleReanalyzeClick = () => {
                  if (isReanalyzing) return;
                  playPulseSound(200, 'triangle', 0.2);
                  setTimeout(() => playPulseSound(400, 'triangle', 0.1), 150);
                  setTimeout(() => playPulseSound(600, 'sawtooth', 0.1), 300);

                  setIsReanalyzing(true);
                  addAuditLog('Tiến trình CineAI-M3', `Bắt đầu máy quét quang phổ phân biệt cho: ${m.title}`);

                  setTimeout(() => {
                    setIsReanalyzing(false);
                    // Random walk recalculation
                    const offsetOverall = (Math.random() * 0.8 - 0.4);
                    const offsetStory = (Math.random() * 0.8 - 0.4);
                    const offsetActing = (Math.random() * 0.8 - 0.4);
                    const offsetVisual = (Math.random() * 0.8 - 0.4);
                    const offsetAudio = (Math.random() * 0.8 - 0.4);

                    setAnalysisScrambleOffset({
                      overall: offsetOverall,
                      story: offsetStory,
                      acting: offsetActing,
                      visual: offsetVisual,
                      audio: offsetAudio
                    });

                    playPulseSound(880, 'sine', 0.15); // High success sound
                    addAuditLog('Cập nhật chỉ số quang học', `CineAI hiệu biến cho: ${m.title} (Tổng quan hiệu chỉnh: ${offsetOverall > 0 ? '+' : ''}${offsetOverall.toFixed(1)})`);
                  }, 1500);
                };

                const handlePublishAIApprove = () => {
                  playPulseSound(523.25, 'sine', 0.1); // C5
                  setTimeout(() => playPulseSound(659.25, 'sine', 0.1), 100); // E5
                  setTimeout(() => playPulseSound(783.99, 'sine', 0.2), 200); // G5

                  addAuditLog('Phê duyệt chỉ số AI', `Công bố báo cáo phê duyệt bản dịch tác phẩm: ${m.title}`);
                  showToast(`Hệ thống CineAI v4.2:\nTác phẩm "${m.title}" đã được duyệt điểm AI (${overallScore}/10) hoàn tất. Bản kiểm định số hóa đã được nén & đồng bộ vào Thư viện phát hành công cộng.`);
                };

                return (
                  <motion.div
                    key="panel-ai-analysis"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {/* Visual Header styled like the uploaded photo */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#070707] border border-neutral-850 p-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => { playPulseSound(350, 'sine', 0.05); changeAdminSection('overview'); }}
                          className="p-2 border border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                          title="Quay lại Tổng quan"
                        >
                          <ChevronDown className="h-4 w-4 rotate-90" />
                        </button>
                        <div>
                          <span className="text-[8px] font-mono tracking-widest text-[#a855f7] uppercase font-black block">HẠ TẦNG KHO QUANG PHỔ COGNITIVE</span>
                          <h2 className="text-sm font-sans font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                            Chi tiết Phân tích AI Phim
                          </h2>
                        </div>
                      </div>

                      {/* Dropdown selector */}
                      <div className="flex items-center space-x-2 bg-black border border-neutral-850 px-3 py-1.5 rounded">
                        <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase shrink-0">Chọn Phim Khảo Sát:</span>
                        <select
                          value={selectedAnalysisMovieId}
                          onChange={(e) => {
                            playPulseSound(440, 'sine', 0.05);
                            setSelectedAnalysisMovieId(e.target.value);
                            setAnalysisScrambleOffset({ overall: 0, story: 0, acting: 0, visual: 0, audio: 0 });
                          }}
                          className="bg-[#0b0b0c] text-xs font-mono text-purple-400 px-2.5 py-1 outline-none border border-transparent focus:border-purple-500 rounded font-black max-w-xs transition-colors"
                        >
                          {moviesList.map(item => (
                            <option key={item.id} value={item.id}>{item.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Sub Metadata block */}
                    <div className="border border-neutral-850 bg-gradient-to-r from-[#0d0914] to-[#04040a] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8.5px] font-mono font-bold border border-purple-500/20 uppercase">
                            {(m.genre && m.genre[0]) ? m.genre[0].toUpperCase() : 'CYBERPUNK'}
                          </span>
                          <span className="px-2 py-0.5 bg-neutral-900 text-neutral-500 text-[8.5px] font-mono border border-neutral-800 uppercase font-bold">
                            {m.ageRating || 'T18'}
                          </span>
                          {m.isHot && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                          {m.isHot && <span className="text-[8.5px] font-mono text-rose-500 font-bold uppercase">Mở bán trước</span>}
                        </div>
                        <h1 className="text-2xl font-sans font-black uppercase tracking-tight text-white leading-tight">
                          {m.title}
                        </h1>
                        <p className="text-[10px] font-mono text-neutral-500">
                          TIÊU ĐỀ QUỐC TẾ: <span className="text-zinc-400 font-bold italic">{m.englishTitle || m.title}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs font-sans text-neutral-400 border-t md:border-t-0 md:border-l border-neutral-900 pt-3 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto">
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Thời Lượng</span>
                          <p className="text-white font-mono font-bold mt-0.5">{m.duration || 124} Phút</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Lịch Công Chiếu</span>
                          <p className="text-[#a855f7] font-mono font-extrabold mt-0.5">Dự kiến: {m.releaseDate || '24/12/2026'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold">Quốc Gia / P.Đề</span>
                          <p className="text-white font-sans mt-0.5">Việt Nam / EN Sub</p>
                        </div>
                      </div>
                    </div>

                    {/* Main 12 Columns Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                      {/* LEFT PANELS COLUMN (4 COLUMNS SPAN) - AI ANALYTICS SCORE */}
                      <div className="lg:col-span-4 space-y-6">

                        {/* Panel 1: ĐIỂM SỐ AI ANALYTICS */}
                        <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0e0a12] to-[#040407] space-y-5 rounded">
                          <div className="flex justify-between items-center border-b border-purple-950/40 pb-3">
                            <span className="text-[9px] font-mono uppercase text-[#a855f7] tracking-wider font-bold">Đánh giá cấu trúc</span>
                            <h3 className="text-xs font-sans font-black uppercase text-zinc-300">ĐIỂM SỐ AI ANALYTICS</h3>
                          </div>

                          {/* Radial Score Gauge */}
                          <div className="flex flex-col items-center justify-center py-2 relative">
                            {isReanalyzing ? (
                              <div className="h-32 w-32 flex flex-col items-center justify-center text-center">
                                <RefreshCw className="h-10 w-10 text-purple-500 animate-spin" />
                                <span className="text-[9px] font-mono text-purple-400 mt-2 animate-pulse uppercase tracking-widest">Đang tính toán tuyến tính...</span>
                              </div>
                            ) : (
                              <div className="relative h-32 w-32 flex items-center justify-center">
                                {/* SVG Gauge */}
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke="#110e19"
                                    strokeWidth="6"
                                  />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="transparent"
                                    stroke="url(#aiGaugeGrad)"
                                    strokeWidth="6"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                  />
                                  <defs>
                                    <linearGradient id="aiGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#ec4899" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                  </defs>
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="text-[32px] font-mono font-black text-white leading-none tracking-tighter">
                                    {overallScore}
                                  </span>
                                  <span className="text-[8px] font-serif italic text-zinc-400 mt-1 uppercase tracking-widest">TỔNG QUÁT</span>
                                </div>
                              </div>
                            )}
                            <p className="text-[9.5px] text-zinc-500 text-center font-mono mt-3">
                              • Trọng số phân tích dựa trên phản ứng nhấp nháy đồng tử mẫu thử
                            </p>
                          </div>

                          {/* Sub-ratings structure */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-[#0c0910] border border-neutral-900 px-3 py-2 rounded text-center">
                              <span className="text-[8.5px] font-mono text-neutral-500 block">CỐT TRUYỆN</span>
                              <span className="block text-xs font-mono font-black text-white mt-0.5">{storyScore} <span className="text-[9px] text-neutral-600">/10</span></span>
                            </div>
                            <div className="bg-[#0c0910] border border-neutral-900 px-3 py-2 rounded text-center">
                              <span className="text-[8.5px] font-mono text-neutral-500 block">DIỄN XUẤT</span>
                              <span className="block text-xs font-mono font-black text-white mt-0.5">{actingScore} <span className="text-[9px] text-neutral-600">/10</span></span>
                            </div>
                            <div className="bg-[#0c0910] border border-neutral-900 px-3 py-2 rounded text-center">
                              <span className="text-[8.5px] font-mono text-neutral-500 block">HÌNH ẢNH</span>
                              <span className="block text-xs font-mono font-black text-white mt-0.5">{visualScore} <span className="text-[9px] text-neutral-600">/10</span></span>
                            </div>
                            <div className="bg-[#0c0910] border border-neutral-900 px-3 py-2 rounded text-center">
                              <span className="text-[8.5px] font-mono text-neutral-500 block">ÂM THANH</span>
                              <span className="block text-xs font-mono font-black text-white mt-0.5">{audioScore} <span className="text-[9px] text-neutral-600">/10</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Panel 2: KHÁN GIẢ MỤC TIÊU */}
                        <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0d] to-[#030305] space-y-4 rounded">
                          <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                            <h3 className="text-xs font-sans font-black uppercase text-zinc-300">KHÁN GIẢ MỤC TIÊU</h3>
                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-black/50 border border-neutral-900 p-3 rounded">
                              <div className="h-7 w-7 rounded bg-purple-950/30 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold font-sans text-neutral-200 block">Thành niên trẻ (18 - 35 tuổi)</span>
                                <p className="text-[10px] text-neutral-400 mt-0.5">Mức độ lan truyền và tỷ lệ nhận thức nội dung đạt 94% thông qua các kênh số.</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 bg-black/50 border border-neutral-900 p-3 rounded">
                              <div className="h-7 w-7 rounded bg-purple-950/30 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold font-sans text-neutral-200 block">Fan thể loại khoa học giả tưởng</span>
                                <p className="text-[10px] text-neutral-400 mt-0.5">Khảo sát yêu cầu đặc biệt cho trải nghiệm thị giác bùng nổ và âm thanh vòm Dolby.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* RIGHT PANELS COLUMN (8 COLUMNS SPAN) - GRAPH AND SUMMARIES */}
                      <div className="lg:col-span-8 space-y-6">

                        {/* Panel 1: BIỂU ĐỒ CẢM XÚC (EMOTION TIMELINE) */}
                        <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0c] to-[#030303] space-y-4 rounded">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3.5 border-b border-neutral-900 pb-3">
                            <div>
                              <span className="text-[8px] font-mono tracking-widest text-[#a855f7] uppercase font-black block">CẤU TRÚC PHẢN ỨNG TIMELINE</span>
                              <h3 className="text-xs font-sans font-black uppercase text-zinc-300">BIỂU ĐỒ CẢM XÚC (EMOTION TIMELINE)</h3>
                            </div>

                            {/* Legend series Indicators */}
                            <div className="flex flex-wrap items-center gap-3 text-[9.5px] font-mono font-bold">
                              <span className="flex items-center gap-1.5 text-rose-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]"></span> CĂNG THẲNG
                              </span>
                              <span className="flex items-center gap-1.5 text-cyan-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span> BI KỊCH / BUỒN
                              </span>
                              <span className="flex items-center gap-1.5 text-pink-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6]"></span> HÀO HƯNG
                              </span>
                            </div>
                          </div>

                          {/* Glow Curved Waveform of emotion */}
                          <div className="relative pt-2" id="motion-graph-stage">
                            {isReanalyzing ? (
                              <div className="h-44 w-full bg-black/30 flex items-center justify-center text-xs font-mono text-purple-400 uppercase tracking-widest animate-pulse">
                                [TÁI CÂN PHỔ ĐỒ THỊ NHỊP ĐỒNG ĐIỆU]
                              </div>
                            ) : (
                              <div className="relative">
                                <svg viewBox="0 0 600 160" className="w-full h-auto overflow-visible select-none">
                                  {/* Horizontal guidelines */}
                                  <line x1="10" y1="20" x2="590" y2="20" stroke="#161619" />
                                  <line x1="10" y1="70" x2="590" y2="70" stroke="#161619" />
                                  <line x1="10" y1="120" x2="590" y2="120" stroke="#161619" />

                                  {/* Vertical markers for minutes */}
                                  {[
                                    { x: 40, label: '0 Phút' },
                                    { x: 180, label: '30 Phút' },
                                    { x: 320, label: '60 Phút' },
                                    { x: 460, label: '90 Phút' },
                                    { x: 560, label: '120 Phút' }
                                  ].map((mLine, i) => (
                                    <g key={i}>
                                      <line x1={mLine.x} y1="0" x2={mLine.x} y2="140" stroke="#1f1f23" strokeDasharray="3,4" strokeWidth="0.8" />
                                      <text x={mLine.x} y="152" textAnchor="middle" className="text-[8.5px] font-mono fill-neutral-600 uppercase font-black">
                                        {mLine.label}
                                      </text>
                                    </g>
                                  ))}

                                  {/* SMOOTH CURVED PATH 1: Căng thẳng (Crimson Red) */}
                                  <path
                                    d="M 20 120 C 80 130, 110 30, 180 40 C 250 50, 280 130, 350 120 C 420 110, 480 20, 530 15 C 570 12, 580 80, 590 84"
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="2.5"
                                    filter="url(#glowPathRed)"
                                  />

                                  {/* SMOOTH CURVED PATH 2: Bi kịch / Buồn (Soft Cyan) */}
                                  <path
                                    d="M 20 80 C 70 40, 130 110, 190 120 C 250 130, 310 30, 370 40 C 430 50, 490 140, 550 135 C 570 133, 580 90, 590 60"
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="2.0"
                                    strokeDasharray="1.5,1.5"
                                    filter="url(#glowPathBlue)"
                                  />

                                  {/* SMOOTH CURVED PATH 3: Hào hứng (Glow Violet/Pink) */}
                                  <path
                                    d="M 20 140 C 50 100, 100 20, 160 30 C 220 40, 270 90, 330 110 C 390 130, 430 40, 480 35 C 530 30, 570 140, 590 10"
                                    fill="none"
                                    stroke="#ec4899"
                                    strokeWidth="3"
                                    filter="url(#glowPathPink)"
                                  />

                                  {/* Glow Filters */}
                                  <defs>
                                    <filter id="glowPathRed" x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                                      <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                      </feMerge>
                                    </filter>
                                    <filter id="glowPathBlue" x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                                      <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                      </feMerge>
                                    </filter>
                                    <filter id="glowPathPink" x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="3" result="blur" />
                                      <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                      </feMerge>
                                    </filter>
                                  </defs>
                                </svg>

                                {/* Interactive tooltip floating element */}
                                <div className="absolute left-[70%] top-[25%] bg-black/90 text-[10px] font-mono border border-purple-500/30 p-2 text-neutral-300 pointer-events-none rounded shadow-lg">
                                  <span className="text-[#a855f7] font-bold block mb-0.5">MỐC CAO TRÀO [92 PHÚT]</span>
                                  <div className="space-y-0.5 text-[9.5px]">
                                    <div className="text-rose-400">Căng thẳng: Khống chế 87%</div>
                                    <div className="text-pink-400">Hào hứng: Tăng vọt 95%</div>
                                    <div className="text-[#88959C]">Định vị: Phân cảnh đảo chiều</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Panel 2: TÓM TẮT AI */}
                        <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0c] to-[#030303] space-y-3.5 rounded">
                          <div className="border-b border-neutral-900 pb-2 flex justify-between items-center">
                            <span className="text-xs font-sans font-black uppercase text-zinc-300">TÓM TẮT THỦ THUẬT QUANG HỌC AI</span>
                            <Sparkles className="h-3.5 w-3.5 text-[#a855f7]" />
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                            Tác phẩm <span className="font-bold text-white uppercase">"{m.title}"</span> đã được mô hình máy học kiểm định cấu trúc phân kịch. Hệ thống đánh giá cực kỳ cao cấu trúc nhịp dẫn nén chặt vào 40 phút đầu và bùng nổ xung lực căng thẳng tột độ tại mốc phút 92. Hình ảnh đạt sự hòa hợp đáng kinh ngạc trong tệp mẫu nhờ áp dụng bộ màu neon tương phản độc đáo, thúc đẩy mạnh mẽ quyết định mua sắm của thế hệ hội viên trẻ tuổi sành điện ảnh.
                          </p>
                        </div>

                        {/* Row 3: NHÃN NỘI DUNG & DANH SÁCH PHÂN CẢNH ĐẶC TRƯNG */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                          {/* Sub-panel 3A: NHÃN NỘI DUNG */}
                          <div className="border border-neutral-850 p-5 bg-black space-y-3.5 rounded">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-bold">NHÃN NỘI DUNG AI CHO PHÉP CHỈ THUẬT</span>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.aiAnalysisTags ? m.aiAnalysisTags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 hover:border-purple-500/40 text-neutral-400 text-[10.5px] font-mono tracking-wide rounded hover:bg-[#120e1a] transition duration-200"
                                >
                                  #{tag.replace(/_/g, ' ')}
                                </span>
                              )) : (
                                ['Bạo_lực_nhẹ', 'Visual_Peak', 'Căng_Não', 'Cảnh_quay_đẹp'].map(tag => (
                                  <span key={tag} className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 text-neutral-400 text-[10.5px] font-mono rounded">
                                    #{tag.replace(/_/g, ' ')}
                                  </span>
                                ))
                              )}
                              <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 text-neutral-400 text-[10.5px] font-mono rounded">
                                #Âm thanh vòm
                              </span>
                              <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 text-neutral-400 text-[10.5px] font-mono rounded">
                                #Phản ứng bùng nổ
                              </span>
                            </div>
                          </div>

                          {/* Sub-panel 3B: DANH SÁCH PHÂN CẢNH ĐẶC TRƯNG */}
                          <div className="border border-neutral-850 p-5 bg-black space-y-3 rounded">
                            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-bold">CẢNH QUAY ĐẶC TRƯNG TIÊU BIỂU</span>

                            <div className="grid grid-cols-3 gap-2 pt-1" id="scenic-capture-thumbnails">
                              {[
                                { label: 'Cảnh 42', sub: 'Visual Peak', desc: 'Thị giác' },
                                { label: 'Cảnh 105', sub: 'Emotion High', desc: 'Cao trào' },
                                { label: 'Cảnh 13', sub: 'Atmospheric', desc: 'Mở màn' }
                              ].map((scn, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    playPulseSound(400 + idx * 110, 'sine', 0.05);
                                    showToast(`Hệ thống CineAI:\nĐang trích xuất cảnh quay đặc trưng [${scn.label}: ${scn.sub}].`);
                                  }}
                                  className="group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-purple-500 p-2 text-center rounded transition hover:bg-neutral-900 duration-200"
                                >
                                  <div className="text-[10px] font-mono text-purple-400 font-bold tracking-tight">
                                    {scn.label}
                                  </div>
                                  <div className="text-[8.5px] text-zinc-500 font-bold truncate mt-0.5">
                                    {scn.sub}
                                  </div>
                                  <div className="mt-1 px-1 py-0.5 bg-neutral-900 text-neutral-400 text-[7px] font-sans font-bold uppercase rounded group-hover:bg-purple-950/40">
                                    {scn.desc}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* BOTTOM COMPLIANCE FOOTER STATUS ROW */}
                    <div className="border border-neutral-850 p-4 bg-black flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Phân tích hoàn tất bởi máy học độc quyền <span className="text-emerald-400 font-extrabold shadow-emerald-500">CineAI Engine v4.2 PRO</span></span>
                      </div>

                      <div className="flex items-center space-x-3.5">
                        <button
                          onClick={handleReanalyzeClick}
                          disabled={isReanalyzing}
                          className="px-4 py-2 border border-purple-500/35 bg-purple-500/10 text-purple-300 font-mono text-xs uppercase hover:bg-purple-500 hover:text-black font-extrabold transition-all duration-300 disabled:opacity-55 rounded"
                        >
                          {isReanalyzing ? 'Đang phân tích lại...' : 'Yêu cầu phân tích lại'}
                        </button>
                        <button
                          onClick={handlePublishAIApprove}
                          className="px-5 py-2 bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 text-white font-sans text-xs uppercase hover:opacity-90 font-black tracking-widest transition-all duration-300 rounded shadow-[0_0_12px_rgba(236,72,153,0.25)]"
                        >
                          Phê duyệt & Xuất bản
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })()}
    </>
  );
}
