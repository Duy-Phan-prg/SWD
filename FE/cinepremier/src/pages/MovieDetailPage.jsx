import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Sparkles, Star, Clock, Heart, Brain, Award, ShieldCheck, Activity, Eye, Zap, ChevronRight, RefreshCw, BarChart2 } from 'lucide-react';
import { useMovies } from '../contexts/MoviesContext';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi, getStoredAuth } from '../services/authApi';

const movieAiReports = {};

export default function DetailView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { moviesList, setMoviesList } = useMovies();
  const { showToast } = useUI();
  const { currentRole } = useAuth();
  const movie = moviesList.find(m => String(m.id) === String(id) || String(m.backendId) === String(id));
  const onBack = () => navigate(-1);
  const onBook = (mv) => navigate(`/movies/${mv.id}/book`);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const { accessToken } = getStoredAuth();
        const detail = currentRole === 'admin' && accessToken
          ? await authApi.getAdminMovieDetail(accessToken, id)
          : await authApi.getMovieDetail(id);
        if (cancelled || !detail?.id) return;
        setMoviesList(prev => {
          const exists = prev.some(m => String(m.id) === String(id) || String(m.id) === String(detail.id));
          if (!exists) return [{ ...detail }, ...prev];
          return prev.map(m => (String(m.id) === String(id) || String(m.id) === String(detail.id)) ? { ...m, ...detail } : m);
        });
      } catch { /* use fallback from list */ }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [id, currentRole]);

  const [showTrailer, setShowTrailer] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [likedReviews, setLikedReviews] = useState({});
  const [activeTabReport, setActiveTabReport] = useState('mindmap'); // mindmap, emotional, detail
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  
  const canvasRef = useRef(null);
  const modalCanvasRef = useRef(null);
  const isBookable = movie?.status === 'NOW_SHOWING' || (!movie?.status && !movie?.isUpcoming);

  const playPing = (freq = 440, type = 'sine', duration = 0.1) => {
    try {
      if (typeof window === 'undefined') return;
      const soundState = localStorage.getItem('sound_enabled');
      if (soundState === 'false') return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Sound play failed", e);
    }
  };

  // Reviews are user-generated; do not seed frontend mock reviews.
  useEffect(() => {
    if (!movie) return;
    setReviews([]);
  }, [movie]);

  // Emotional Waveform animation canvas drawing logic
  useEffect(() => {
    if (!movie) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let offset = 0;

    const emotionalPoints = movie.emotionalWaveform || [20, 40, 60, 50, 80, 65, 75, 85, 90, 95, 60, 30];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Draw Grid helper lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw glowing background gradient wave
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(0.5, 'rgba(120, 120, 120, 0.03)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(0, height);

      const segmentWidth = width / (emotionalPoints.length - 1);
      
      for (let i = 0; i < emotionalPoints.length; i++) {
        const x = i * segmentWidth;
        const amplitude = emotionalPoints[i];
        
        // Add animated micro fluctuation to look like live AI graph
        const waveModifier = Math.sin(offset + i * 0.8) * 3;
        const y = height - ((amplitude + waveModifier) / 100) * (height - 30) - 15;
        
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmp = emotionalPoints[i - 1];
          const prevWave = Math.sin(offset + (i - 1) * 0.8) * 3;
          const prevY = height - ((prevAmp + prevWave) / 100) * (height - 30) - 15;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }

      ctx.lineTo(width, height);
      ctx.fillStyle = grad;
      ctx.fill();

      // Top curve stroke with clean white line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';

      for (let i = 0; i < emotionalPoints.length; i++) {
        const x = i * segmentWidth;
        const amplitude = emotionalPoints[i];
        const waveModifier = Math.sin(offset + i * 0.8) * 3;
        const y = height - ((amplitude + waveModifier) / 100) * (height - 30) - 15;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * segmentWidth;
          const prevAmp = emotionalPoints[i - 1];
          const prevWave = Math.sin(offset + (i - 1) * 0.8) * 3;
          const prevY = height - ((prevAmp + prevWave) / 100) * (height - 30) - 15;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      offset += 0.04;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [movie]);

  // Emotional Waveform animation for the AI Analysis Modal Canvas
  useEffect(() => {
    if (!showAiAnalysis || !movie) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let offset = 0;

    const emotionalPoints = movie.emotionalWaveform || [20, 40, 60, 50, 80, 65, 75, 85, 90, 95, 60, 30];
    const secondaryPoints = emotionalPoints.map(v => Math.max(10, Math.min(95, v + (Math.sin(v) * 20))));

    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw vertical guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const verticalLines = 10;
      for (let i = 1; i < verticalLines; i++) {
        const x = (width / verticalLines) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal guidelines
      for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const drawWave = (points, color1, color2, scaleOffset, lineW = 2, blurGlow = 0) => {
        const segmentWidth = width / (points.length - 1);
        
        ctx.beginPath();
        const firstWaveMod = Math.sin(offset + scaleOffset) * 4;
        const firstY = height - ((points[0] + firstWaveMod) / 100) * (height - 40) - 20;
        ctx.moveTo(0, firstY);

        for (let i = 1; i < points.length; i++) {
          const x = i * segmentWidth;
          const amplitude = points[i];
          const waveModifier = Math.sin(offset + i * 0.9 + scaleOffset) * 4;
          const y = height - ((amplitude + waveModifier) / 100) * (height - 40) - 20;

          const prevX = (i - 1) * segmentWidth;
          const prevAmp = points[i - 1];
          const prevWave = Math.sin(offset + (i - 1) * 0.9 + scaleOffset) * 4;
          const prevY = height - ((prevAmp + prevWave) / 100) * (height - 40) - 20;
          
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }

        ctx.strokeStyle = color1;
        ctx.lineWidth = lineW;
        if (blurGlow > 0) {
          ctx.shadowBlur = blurGlow;
          ctx.shadowColor = color2;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Draw secondary wave (Aesthetic / Harmony - cyan)
      drawWave(secondaryPoints, 'rgba(6, 182, 212, 0.45)', 'rgba(6, 182, 212, 0.2)', 1.5, 1.5);
      
      // Draw primary wave (Tension / Climax - pink)
      drawWave(emotionalPoints, '#f59e0b', 'rgba(245, 158, 11, 0.5)', 0, 2.5, 8);

      offset += 0.035;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showAiAnalysis, movie]);

  // Handle post user review
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    const newRev = {
      id: `user-rev-${Date.now()}`,
      author: newAuthor,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
      rating: newRating,
      content: newContent,
      date: 'Hôm nay',
      likes: 0
    };

    setReviews([newRev, ...reviews]);
    setNewAuthor('');
    setNewContent('');
    setNewRating(5);
  };

  const handleLikeReview = (id) => {
    setLikedReviews(prev => {
      const isAlreadyLiked = !!prev[id];
      setReviews(current => current.map(r => {
        if (r.id === id) {
          return { ...r, likes: isAlreadyLiked ? r.likes - 1 : r.likes + 1 };
        }
        return r;
      }));
      return { ...prev, [id]: !isAlreadyLiked };
    });
  };

  if (!movie) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Đang tải...</div>;

  const currentCasts = Array.isArray(movie.actors)
    ? movie.actors.map((actor) => ({
        name: actor.name || actor.fullName || actor.actorName || 'Diễn viên',
        role: actor.role || actor.characterName || actor.description || 'Diễn viên',
        avatarUrl: actor.avatarUrl || actor.imageUrl || actor.photoUrl || ''
      }))
    : [];

  return (
    <div className="pb-24 space-y-12">
      
      {/* 1. BLURRED BANNER HERO BACKGROUND */}
      <section 
        className="relative min-h-[55vh] flex items-end bg-cover bg-center px-4 sm:px-6 lg:px-8 py-10"
        style={{ backgroundImage: `url(${movie.bannerUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-black/50 z-0 backdrop-blur-[1px]" />

        {/* Back navigation */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-30 flex items-center space-x-2 border border-white/25 bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-sans text-white hover:bg-white hover:text-black transition-all duration-300"
          id="detail-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>QUAY LẠI</span>
        </button>

        <div className="relative max-w-7xl w-full mx-auto z-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          
          {/* Movie Poster Vertical Card */}
          <div className="md:col-span-3 flex justify-center md:justify-start">
            <div className="relative w-52 aspect-[2/3] overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-black">
              <img 
                src={movie.posterUrl} 
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute left-3 top-3 border border-white/20 bg-black text-[9px] font-bold px-1.5 py-0.5 tracking-widest text-white">
                {movie.ageRating}
              </div>
            </div>
          </div>

          {/* Quick texts and Action indicators */}
          <div className="md:col-span-9 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {movie.genre.map((gen) => (
                <span key={gen} className="border border-white/15 bg-black text-neutral-300 font-sans text-[10px] tracking-[0.1em] uppercase px-3 py-1">
                  {gen}
                </span>
              ))}
              <span className="border border-white/10 bg-black text-neutral-400 font-sans text-[10px] tracking-[0.1em] uppercase px-3 py-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {movie.duration} MIN
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-wider leading-none uppercase italic">
                {movie.title}
              </h1>
              <p className="text-xs sm:text-sm font-sans tracking-[0.2em] text-neutral-400 uppercase pt-1">
                {movie.englishTitle}
              </p>
            </div>

            <p className="text-[10px] text-neutral-500 font-sans uppercase tracking-[0.15em]">
              ĐẠO DIỄN: <span className="text-white font-bold">{movie.director}</span> • RA MẮT: {movie.releaseDate}
            </p>

            {/* Book & Trailer Action trigger buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              {isBookable ? (
                <button
                  onClick={() => onBook(movie)}
                  className="border border-white bg-white text-black text-xs font-bold font-sans uppercase tracking-[0.15em] px-8 py-3.5 hover:bg-black hover:text-white transition duration-300"
                  id="detail-book-now"
                >
                  XÁC THỰC & ĐẶT VÉ NGAY
                </button>
              ) : (
                <span className="border border-white/20 bg-neutral-900 text-white uppercase text-[10px] tracking-widest px-8 py-3.5 font-bold font-sans">
                  {movie.upcomingDate} - CHỜ MỞ BÁN
                </span>
              )}

              <button
                onClick={() => setShowTrailer(true)}
                className="border border-white/10 bg-black/40 hover:bg-neutral-900 hover:border-white/35 text-white px-6 py-3.5 text-xs font-sans uppercase tracking-[0.15em] flex items-center gap-2 transition duration-300"
                id="detail-trailer-button"
              >
                <Play className="h-4 w-4 fill-white text-white" />
                XEM TRAILER
              </button>

              <button
                onClick={() => {
                  playPing(750, 'sine', 0.12);
                  setShowAiAnalysis(true);
                  setIsSimulatingScan(true);
                  setTimeout(() => {
                    playPing(987.77, 'sine', 0.25);
                    setIsSimulatingScan(false);
                  }, 1200);
                }}
                className="border border-violet-500/30 bg-violet-950/15 hover:bg-violet-500 hover:text-black hover:border-violet-500 text-violet-400 px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition duration-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] group relative overflow-hidden cursor-pointer"
                id="detail-ai-analysis-btn"
              >
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="h-4 w-4 text-violet-400 group-hover:text-black animate-pulse" />
                <span>PHÂN TÍCH AI CẬP NHẬT</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 2. MAIN DETAILS & AI RATING DUAL PANEL GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Block: Synopsis & Actors representation */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 border-b border-white/10 pb-2">TÓM TẮT NỘI DUNG</h3>
              <p className="text-sm text-neutral-300 leading-relaxed font-sans font-light">
                {movie.synopsis}
              </p>
            </div>

            {/* Circular Actors representation block */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 border-b border-white/10 pb-2">DIỄN VIÊN CHÍNH</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="cast-list">
                {currentCasts.length === 0 && (
                  <p className="col-span-full border border-dashed border-white/10 bg-black p-4 text-xs text-neutral-500">
                    Chưa có dữ liệu diễn viên từ hệ thống.
                  </p>
                )}
                {currentCasts.map((cast) => (
                  <div key={cast.name} className="flex items-center space-x-3 bg-[#0A0A0A] p-3 border border-white/5">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-neutral-950 flex-shrink-0">
                      {cast.avatarUrl ? (
                        <img
                          src={cast.avatarUrl}
                          alt={cast.name}
                          className="h-full w-full object-cover grayscale"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-neutral-500">
                          {cast.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-sans text-white truncate font-bold">{cast.name}</h4>
                      <p className="text-[9px] text-neutral-500 uppercase tracking-widest truncate mt-0.5">{cast.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Reviews comment section */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 border-b border-white/10 pb-2">
                NHẬN XÉT CỦA CINEPHILE ({reviews.length})
              </h3>

              {/* Form Comment */}
              <form onSubmit={handleAddReview} className="border border-white/10 bg-black p-5 space-y-4">
                <span className="text-[10px] font-sans font-medium text-neutral-400 uppercase tracking-[0.15em] block">Viết đánh giá phê bình</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="Tên bút danh..."
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="border border-white/10 bg-[#0A0A0A] p-2.5 text-xs text-white placeholder-neutral-700 font-sans focus:outline-none focus:border-white"
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-sans">Độ nồng:</span>
                    <div className="flex space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="text-white focus:outline-none"
                        >
                          <Star className={`h-4.5 w-4.5 ${newRating >= star ? 'fill-current text-white' : 'text-neutral-800'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  maxLength={250}
                  placeholder="Điền vài dòng phản ánh cảm tính của bản thân về kịch cảnh..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full border border-white/10 bg-[#0A0A0A] p-2.5 text-xs text-white placeholder-neutral-700 font-sans focus:outline-none focus:border-white"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="border border-white bg-white text-black hover:bg-black hover:text-white px-5 py-2 text-[10px] tracking-widest uppercase font-sans font-bold transition"
                  >
                    GỬI ĐÁNH GIÁ
                  </button>
                </div>
              </form>

              {/* List Comments rendering */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#0A0A0A] p-4 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={rev.avatarUrl} 
                          alt="Av" 
                          className="h-8 w-8 rounded-full object-cover border border-white/10 grayscale"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-sans text-xs text-white font-bold">{rev.author}</h4>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest">{rev.date}</span>
                        </div>
                      </div>

                      <div className="flex space-x-0.5">
                        {Array.from({ length: 5 }, (_, idx) => (
                          <Star 
                            key={idx} 
                            className={`h-3 w-3 ${idx < rev.rating ? 'text-white fill-current' : 'text-neutral-800'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-neutral-400 text-xs leading-relaxed font-sans font-light pl-11">
                      "{rev.content}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 font-sans text-[9px] tracking-wider text-neutral-500 pl-11">
                      <button
                        onClick={() => handleLikeReview(rev.id)}
                        className={`flex items-center gap-1.5 hover:text-white transition uppercase ${likedReviews[rev.id] ? 'text-white font-bold' : ''}`}
                      >
                        <Heart className={`h-3 w-3 ${likedReviews[rev.id] ? 'fill-current' : ''}`} />
                        <span>Thích {rev.likes}</span>
                      </button>
                      <span>KHÁCH VIP ĐÃ XÁC THỰC</span>
                    </div>

                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Right Block: Dynamic AI Rating Graphics Analysis */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="border border-white/10 bg-black p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center space-x-2 text-white">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Sóng Thần Kinh AI RATING
                  </span>
                </div>
                <span className="text-[9px] border border-white/15 bg-black px-2 py-0.5 text-white uppercase tracking-wider font-mono">
                  KHỚP: 99%
                </span>
              </div>

              {/* Animated Emotional Waveform Canvas graph */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-sans text-neutral-500">
                  <span>CAO TRÀO CẢM XÚC PHIM (WAVEFORM)</span>
                  <span className="text-white animate-pulse">● LƯỢNG TỬ AI</span>
                </div>
                
                <div className="relative border border-white/10 bg-neutral-950 h-36">
                  <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={144} 
                    className="w-full h-full block"
                  />
                  <div className="absolute bottom-2 left-2 flex gap-1.5 text-[8px] text-neutral-600 font-mono uppercase tracking-widest">
                    <span>0m</span>
                    <span>•</span>
                    <span>Xây dựng</span>
                    <span>•</span>
                    <span>Bộc phát</span>
                    <span>•</span>
                    <span>Kết cuộc</span>
                  </div>
                </div>
              </div>

              {/* Progress bars indicator */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 block pb-1 border-b border-white/5">CHỈ SỐ THỰC CHỨNG (MÁY HỌC)</span>
                
                <div className="space-y-4 font-sans text-xs text-neutral-400">
                  {/* Item overall */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-white uppercase tracking-wider text-[11px]">
                      <span>Đánh Giá Tổng Quan</span>
                      <span className="text-white">{movie.ratings.aiOverall}</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-900 overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${movie.ratings.aiOverall * 10}%` }}></div>
                    </div>
                  </div>

                  {/* Item Storyline */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between uppercase tracking-wider text-[10px] text-neutral-300">
                      <span>Cốt Truyện Điện Ảnh</span>
                      <span>{movie.ratings.aiStory}/10</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-950 overflow-hidden">
                      <div className="h-full bg-neutral-300" style={{ width: `${movie.ratings.aiStory * 10}%` }}></div>
                    </div>
                  </div>

                  {/* Item Acting */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between uppercase tracking-wider text-[10px] text-neutral-300">
                      <span>Độ Sắc Diễn Xuất</span>
                      <span>{movie.ratings.aiActing}/10</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-950 overflow-hidden">
                      <div className="h-full bg-neutral-400" style={{ width: `${movie.ratings.aiActing * 10}%` }}></div>
                    </div>
                  </div>

                  {/* Item Visual */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between uppercase tracking-wider text-[10px] text-neutral-300">
                      <span>Mỹ Thuật Thị Giác</span>
                      <span>{movie.ratings.aiVisual}/10</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-950 overflow-hidden">
                      <div className="h-full bg-neutral-500" style={{ width: `${movie.ratings.aiVisual * 10}%` }}></div>
                    </div>
                  </div>

                  {/* Item Audio */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between uppercase tracking-wider text-[10px] text-neutral-300">
                      <span>Xung Âm Phối Khúc</span>
                      <span>{movie.ratings.aiAudio}/10</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-950 overflow-hidden">
                      <div className="h-full bg-white/40" style={{ width: `${movie.ratings.aiAudio * 10}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Highlight Tag chips in detail */}
              <div className="pt-2">
                <span className="text-[9px] uppercase tracking-wider font-sans text-neutral-500 block mb-2">TAGS PHÂN TÍCH ƯU TÚ</span>
                <div className="flex flex-wrap gap-1.5" id="analysis-tags-list">
                  {movie.aiAnalysisTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-neutral-900 text-[9px] text-neutral-300 font-bold px-2 py-1 border border-white/5 uppercase tracking-wide"
                    >
                      #{tag}
                    </span>
                  ))}
                  <span className="bg-white/10 text-[9px] text-white font-bold px-2 py-1 uppercase tracking-wide">
                    #Rạp_Vé_Mật_AI
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Cinema Experience Badge */}
            <div className="bg-black border border-white/10 p-6 text-xs text-neutral-400 space-y-3 font-sans">
              <span className="font-serif font-light text-white text-sm block italic">Đặc Quyềng Nghiệm Chiếu</span>
              <p className="leading-relaxed font-light">
                Mỗi suất chiếu thuộc chuỗi <b>CinePremier</b> tích hợp toàn năng dòng tăng cường kép cực đại tương đương công nghệ 12 kênh âm thâm giao hưởng, đảm bảo đánh thẳng giác quan thưởng lãm của bạn.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. VIDEO TRAILER DIALOG COMPONENT MODAL */}
      {showTrailer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 transition duration-300"
          id="trailer-modal"
        >
          <div className="relative w-full max-w-4xl border border-white/20 bg-neutral-950 shadow-2xl">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black text-white p-2.5 border border-white/15 transition text-xs font-sans cursor-pointer"
              id="close-trailer-modal"
            >
              ✕ ĐÓNG
            </button>

            {/* Aspect box iframe */}
            <div className="aspect-video w-full bg-black">
              <iframe
                title={`${movie.title} Trailer`}
                src={movie.trailerUrl}
                className="h-full w-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="p-4 bg-neutral-950 border-t border-white/10">
              <p className="text-[9px] text-neutral-500 font-sans tracking-[0.25em] uppercase">TRAILER CHÍNH THỨC</p>
              <h4 className="text-base font-serif text-white mt-1 italic">{movie.title}: {movie.englishTitle}</h4>
            </div>

          </div>
        </div>
      )}

      {/* 4. IMMERSIVE INTERACTIVE AI ANALYSIS REPORT MODAL */}
      {showAiAnalysis && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto custom-scrollbar"
          id="ai-analysis-modal"
        >
          <div className="relative w-full max-w-4xl border border-zinc-800 bg-neutral-950 shadow-2xl overflow-hidden text-white rounded-lg flex flex-col my-8">
            
            {/* Top scanning header line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-amber-400 to-cyan-500 animate-pulse"></div>

            {/* SCANNING STATE GRID LOADING */}
            {isSimulatingScan ? (
              <div className="p-16 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative h-28 w-28">
                  {/* Glowing core orbital circles */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-violet-500/20 animate-spin" style={{ animationDuration: '6s' }}></div>
                  <div className="absolute inset-2 rounded-full border border-double border-amber-400/40 animate-spin" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-violet-950 to-neutral-900 border border-violet-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                    <Brain className="h-10 w-10 text-violet-400 animate-pulse" />
                  </div>
                  {/* Laser scan line effect */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-bounce"></div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-sans font-bold uppercase tracking-[0.25em] text-violet-400">ĐANG QUÉT MẪU HỌC QUANG HỌC AI</h3>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                    <span className="animate-pulse">ĐANG THIẾT LẬP LIÊN KẾT: CINEPREMIER COGNITIVE...</span>
                  </div>
                </div>

                {/* Simulated Log Feed */}
                <div className="w-full max-w-sm bg-black/40 border border-white/5 p-3 rounded text-[9px] font-mono text-left text-neutral-500 space-y-1">
                  <p className="text-zinc-400 font-bold">● COGNITIVE LABS v4.2.1-ACTIVE</p>
                  <p className="text-[#8b5cf6]">&gt; Nạp ma trận dữ liệu kịch mục: "{movie.title}"</p>
                  <p className="text-cyan-500">&gt; Đồng bộ hóa nhịp chớp mắt mẫu sinh trắc học đạt 99.4%</p>
                  <p className="text-emerald-500">&gt; Hoàn thành tái cấu trúc phổ cảm xúc tuyến tính thành công.</p>
                </div>
              </div>
            ) : (
              /* COMPLETED DETAILED SUMMARY PRESENTATION GRID */
              <div className="flex flex-col">
                
                {/* Header Information Dashboard */}
                <div className="p-6 border-b border-white/10 bg-neutral-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-violet-600 to-purple-800 text-white text-[9px] font-bold px-2.5 py-0.5 tracking-wider uppercase flex items-center gap-1">
                        <Award className="h-3 w-3" /> CINEPREMIER COGNITIVE REPORT
                      </div>
                      <span className="text-[9px] font-serif tracking-[0.1em] text-amber-400 font-bold animate-pulse">✦ BÁO CÁO TOÀN DIỆN</span>
                    </div>
                    
                    <h2 className="text-2xl font-serif text-white uppercase italic tracking-wider">
                      {movie.title} <span className="text-zinc-500 font-sans text-xs not-italic lowercase font-light">({movie.englishTitle})</span>
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-sans tracking-[0.1em] uppercase">
                      Đại diện phân tích số: <span className="text-white font-bold">{movie.id?.toUpperCase()}-AIXB9</span> • Trọng lượng kịch nghệ: {movie.duration}m
                    </p>
                  </div>

                  {/* Top quick close click */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playPing(500, 'sine', 0.1);
                        setShowAiAnalysis(false);
                      }}
                      className="border border-white/10 hover:border-white bg-black hover:bg-white hover:text-black text-white text-xs px-4 py-2 font-sans transition-all duration-300 uppercase tracking-widest cursor-pointer"
                    >
                      ✕ THỐT RA INDIG
                    </button>
                  </div>
                </div>

                {/* Navigation inside analysis modal */}
                <div className="flex border-b border-white/5 bg-black/60 sticky top-0 z-15">
                  <button
                    onClick={() => { playPing(600, 'sine', 0.08); setActiveTabReport('mindmap'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-sans tracking-[0.15em] uppercase font-bold transition ${activeTabReport === 'mindmap' ? 'bg-violet-950/20 text-violet-400 border-b-2 border-violet-500' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                  >
                    ✦ THẾ TRẬN CẢM QUAN
                  </button>
                  <button
                    onClick={() => { playPing(600, 'sine', 0.08); setActiveTabReport('emotional'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-sans tracking-[0.15em] uppercase font-bold transition ${activeTabReport === 'emotional' ? 'bg-violet-950/20 text-violet-400 border-b-2 border-violet-500' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                  >
                    📈 PHỔ TRUYỀN DỮ LIỆU CẢM XÚC
                  </button>
                  <button
                    onClick={() => { playPing(600, 'sine', 0.08); setActiveTabReport('detail'); }}
                    className={`flex-1 py-3 text-center text-[10px] font-sans tracking-[0.15em] uppercase font-bold transition ${activeTabReport === 'detail' ? 'bg-violet-950/20 text-violet-400 border-b-2 border-violet-500' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                  >
                    📖 KỊCH NGHỆ TỰ LUẬN BỢI AI
                  </button>
                </div>

                {/* MODAL MAIN CONTENT DISPLAY PANEL */}
                <div className="p-6 md:p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#050505]">
                  
                  {/* TAB 1: MINDMAP / SENSORY RATINGS */}
                  {activeTabReport === 'mindmap' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Left Block Circular Radial rating gauge */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center p-6 border border-white/5 bg-[#08080c] rounded">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest pb-3">ẢNH BẢN QUYỀN COGNITIVE</span>
                        <div className="relative h-36 w-36 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="42" 
                              fill="transparent" 
                              stroke="url(#modalAiGlowGrad)" 
                              strokeWidth="5.5" 
                              strokeDasharray="263.8" 
                              strokeDashoffset={263.8 - (263.8 * (movie.ratings?.aiOverall || 9.2)) / 10}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="modalAiGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-mono font-black text-white leading-none tracking-tight">
                              {movie.ratings?.aiOverall || 9.2}
                            </span>
                            <span className="text-[8px] font-serif text-neutral-400 italic mt-1 tracking-widest">ĐIỂM CHUNG TỪ AI</span>
                          </div>
                        </div>
                        <div className="mt-4 text-center space-y-1">
                          <p className="text-xs text-white uppercase font-bold tracking-wider">MẬT ĐỘ SỨC KHỚP TUYẾN TÍNH</p>
                          <p className="text-[10px] text-zinc-400">Tỉ lệ phản hồi thấu cảm cảm quan tích cực đạt <b>98.8%</b></p>
                        </div>
                      </div>

                      {/* Right Block Slider parameters */}
                      <div className="md:col-span-7 space-y-5">
                        <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#a855f7] border-b border-white/5 pb-2">CHỈ SỐ PHÂN TÍCH HAI CHIỀU</h4>
                        
                        <div className="grid grid-cols-1 gap-4 font-sans text-xs">
                          {/* Item 1 */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="flex items-center gap-1.5 uppercase font-bold"><Zap className="h-3 w-3 text-amber-400" /> CỐT TRUYỆN LƯỢNG TỬ</span>
                              <span className="font-mono font-bold text-white pr-2">{movie.ratings?.aiStory}/10</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500 rounded-full" style={{ width: `${(movie.ratings?.aiStory || 9) * 10}%` }}></div>
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="flex items-center gap-1.5 uppercase font-bold"><Activity className="h-3 w-3 text-violet-400" /> CHẤT LƯỢNG DIỄN XUẤT</span>
                              <span className="font-mono font-bold text-white pr-2">{movie.ratings?.aiActing}/10</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500 rounded-full" style={{ width: `${(movie.ratings?.aiActing || 9) * 10}%` }}></div>
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="flex items-center gap-1.5 uppercase font-bold"><Eye className="h-3 w-3 text-cyan-400" /> THẨM MỸ QUANG HỌC</span>
                              <span className="font-mono font-bold text-white pr-2">{movie.ratings?.aiVisual}/10</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500 rounded-full" style={{ width: `${(movie.ratings?.aiVisual || 9) * 10}%` }}></div>
                            </div>
                          </div>

                          {/* Item 4 */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-zinc-300">
                              <span className="flex items-center gap-1.5 uppercase font-bold"><Brain className="h-3 w-3 text-rose-400" /> PHỐI KHÚC ÂM NHẠC</span>
                              <span className="font-mono font-bold text-white pr-2">{movie.ratings?.aiAudio}/10</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500 rounded-full" style={{ width: `${(movie.ratings?.aiAudio || 9) * 10}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Audience match tags */}
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded space-y-2">
                          <span className="text-[9px] font-sans font-medium text-neutral-400 uppercase tracking-widest block">Đối Tượng Khách Hàng Tương Thích Tốt Nhất:</span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{movieAiReports[movie.id]?.audienceProfile || `-- Phim tự do thích hợp cho người có gu âm nhạc và thị giác đa chiều phong phú --`}</p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: EMOTIONAL TIMELINE CANVAS RATINGS */}
                  {activeTabReport === 'emotional' && (
                    <div className="space-y-6">
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3.5 border-b border-white/5 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-violet-400 uppercase tracking-[0.2em] font-bold block">REAL-TIME FLUCTUATION GRAPH DISPLAY</span>
                          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-zinc-300">PHỔ XUNG ĐỒNG ĐIỆU CẢM XÚC THUYẾT LƯỢNG TỬ</h4>
                        </div>

                        {/* Legends identifiers */}
                        <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono">
                          <span className="flex items-center gap-1.5 text-[#f59e0b]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-ping"></span> CƯỜNG ĐỘ CĂNG THẲNG TRONG MẠCH
                          </span>
                          <span className="flex items-center gap-1.5 text-cyan-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span> KHÔNG GIAN THẨM MỸ / ĐỘ THẤU HIỂU
                          </span>
                        </div>
                      </div>

                      {/* Modal canvas element draw */}
                      <div className="relative border border-white/10 bg-black/60 h-48 w-full">
                        <canvas 
                          ref={modalCanvasRef} 
                          width={800} 
                          height={192} 
                          className="w-full h-full block"
                        />
                        <div className="absolute inset-x-2 bottom-2 flex justify-between text-[8px] text-zinc-500 uppercase font-mono tracking-widest">
                          <span>0% (Khởi Sự)</span>
                          <span>25% (Cao Trào Đầu)</span>
                          <span>50% (Phát Triển Điểm)</span>
                          <span>75% (Cực Điểm Tột Cùng)</span>
                          <span>100% (Thu Hoạch Tấm Lòng)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-neutral-900 border border-white/5 rounded space-y-1 font-sans text-xs">
                          <span className="text-amber-400 font-bold block">● Nhịp Đỉnh Sóng Trụ Lượng Tử:</span>
                          <p className="text-neutral-400">AI ghi nhận sự bùng nổ xung lực tuyến tính diễn ra vượt trội trong 30 phút cuối cùng, tạo một kết thúc bộc phát dữ dội dâng tràn cảm quan tuyệt mĩ.</p>
                        </div>
                        <div className="p-4 bg-neutral-900 border border-white/5 rounded space-y-1 font-sans text-xs">
                          <span className="text-cyan-400 font-bold block">● Thích Nghi Cảm Xúc Người Xem:</span>
                          <p className="text-neutral-400">Các mảng màu phối hợp lạnh ẩm kích xúc mạnh hai bán cầu não, chống buồn ngủ tuyệt đối, mang độ say kịch tính sảng khoái cho thần kinh.</p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: TEXT DETAIL ANALYSIS REPORTS */}
                  {activeTabReport === 'detail' && (
                    <div className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                        
                        {/* Plot description block */}
                        <div className="p-5 border border-white/5 bg-zinc-900/40 rounded space-y-3">
                          <h4 className="text-xs font-sans font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-violet-400" /> KIỂM ĐỊNH KỊCH NGHỆ BỞI AI
                          </h4>
                          <p className="text-xs text-zinc-300 font-light font-sans text-justify">
                            {movieAiReports[movie.id]?.plotAnalyze || `Hệ thống mô hình ngôn ngữ tự nhiên tối ưu nhận xét bộ phim sở hữu nền tảng kịch chất hoàn mỹ. Đạo diễn tài ba lồng ghép khéo léo những phép ẩn dụ nghệ thuật giàu tính trải nghiệm, kích hoạt nơ-ron đồng điệu giác quan sâu sắc.`}
                          </p>
                        </div>

                        {/* Sensory aesthetics deep breakdown */}
                        <div className="p-5 border border-white/5 bg-zinc-900/40 rounded space-y-3">
                          <h4 className="text-xs font-sans font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-cyan-400" /> TIÊU ĐIỂM THẨM MỸ GIÁC QUAN
                          </h4>
                          <p className="text-xs text-zinc-300 font-light font-sans text-justify">
                            {movieAiReports[movie.id]?.sensoryFocus || `Sự hòa quyện diệu kỳ giữa âm thanh kịch tính trầm sâu và kỹ xảo đồ họa rực rỡ mang đến cảm giác bẫy sâu kịch tính. Người xem sẽ được chu du qua toàn dải cảm xúc mà không gặp bất kỳ trạng thái đứt gãy mạch phim nào.`}
                          </p>
                        </div>

                      </div>

                      {/* Best cinematic scenes analyzed */}
                      <div className="p-5 border border-[#fcb900]/10 bg-amber-950/5 rounded space-y-3">
                        <span className="text-[10px] font-sans font-bold tracking-widest text-amber-500 uppercase block">★ CÁC PHÂN ĐOẠN ĐẶC SẮC ĐÁNG CHÚ Ý NHẤT (QUÉT BỞI AI)</span>
                        
                        <div className="space-y-3 font-sans text-xs">
                          {(movieAiReports[movie.id]?.highlights || [
                            'Điểm thắt nút dẫn nhập mâu thuẫn nhân vật vô cùng tự nhiên kịch tính',
                            'Mạch giao tranh tâm lý và xung đột hành động dâng tràn cảm xúc ở phân cảnh trung quyển',
                            'Nốt thắt vỡ òa cuối kịch bản mở ra suy tư vạn dặm đầy ý vị nhân văn sâu lắng'
                          ]).map((h, i) => (
                            <div key={i} className="flex gap-3 items-start p-2 bg-black/40 border border-white/5">
                              <span className="text-amber-400 font-mono font-bold text-center w-5 bg-amber-950/30 px-1 border border-amber-500/20 rounded">0{i+1}</span>
                              <p className="text-zinc-300 text-[11px] font-medium leading-relaxed">{h}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Bottom Trigger actions box */}
                <div className="p-6 border-t border-white/10 bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Chúng tôi cam kết số liệu quang lượng học thực chứng chính xác 100% dựa trên trí tuệ phi nhân tạo.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                    
                    {/* Share Simulation button */}
                    <button
                      onClick={() => {
                        playPing(880, 'sine', 0.15);
                        showToast(`[AI Report Downloader] Đang kết xuất và chụp trực quan Poster phân tích của phim "${movie.title}"...\nKết nối thành công! Tệp tin infographic_cognitive_${movie.id}.png đã được xuất thành công vào thư viện khóa ngoại của trình duyệt.`);
                      }}
                      className="border border-violet-500/40 text-violet-400 hover:bg-violet-500 hover:text-black hover:border-violet-500 text-[10px] px-4 py-3 font-bold uppercase tracking-wider transition duration-300 cursor-pointer flex items-center gap-1.5"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      XUẤT ẢNH PHÂN TÍCH AI
                    </button>

                    {/* Book now immediately */}
                    {isBookable ? (
                      <button
                        onClick={() => {
                          playPing(987.77, 'sine', 0.2);
                          setShowAiAnalysis(false);
                          onBook(movie);
                        }}
                        className="bg-white hover:bg-violet-500 hover:text-white text-black text-[10px] px-6 py-3 font-black uppercase tracking-wider transition duration-300 cursor-pointer flex items-center gap-1.5 shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
                      >
                        TIẾN HÀNH ĐẶT VÉ CHUYÊN BIỆT <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="bg-neutral-900 border border-white/10 text-neutral-400 text-[10px] px-5 py-3 uppercase tracking-wider font-bold">
                        {movie.upcomingDate} - CHỜ MỞ BÁN
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
