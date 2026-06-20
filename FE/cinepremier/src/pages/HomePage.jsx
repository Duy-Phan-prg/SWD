import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Sparkles, MessageSquare, Check, HelpCircle, Volume2, VolumeX, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import MovieCard from '../components/movies/MovieCard';
import { useMovies } from '../contexts/MoviesContext';
import Snowfall from 'react-snowfall';
const extractYoutubeId = (url = '') => {
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (host === 'youtu.be') return parts[0] || '';
    if (host.endsWith('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return videoId;
      if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] || '';
    }
  } catch {
    // Fall back to regex parsing for partially pasted URLs.
  }

  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/
  ];

  return patterns.map((pattern) => trimmed.match(pattern)?.[1]).find(Boolean) || '';
};

const isDirectVideoUrl = (url = '') => {
  const value = url.trim().toLowerCase();
  return /\.(mp4|webm|mov)(\?|#|$)/.test(value) || value.includes('/video/upload/');
};

const loadYoutubeIframeApi = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!window.__cinepremierYoutubeApiPromise) {
    window.__cinepremierYoutubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        resolve(window.YT);
      };

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
      }
    });
  }

  return window.__cinepremierYoutubeApiPromise;
};

export default function HomeView({ onSelectMovie, onBookMovie, onTabChange, moviesList = [] }) {
  const { watchlist = [], handleToggleWatchlist } = useMovies();
  const [selectedMood, setSelectedMood] = useState('#Đỉnh_Cao_Thị_Giác');
  const [userPrompt, setUserPrompt] = useState('');
  const [suggestionResponse, setSuggestionResponse] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Filter movies for "Now Playing" and "Upcoming"
  const sourceMovies = Array.isArray(moviesList) ? moviesList : [];
  const publicMovies = sourceMovies.filter((m) => m.status !== 'INACTIVE' && !m.isInactive);
  const nowPlaying = publicMovies.filter((m) => m.status === 'NOW_SHOWING' || (!m.status && !m.isUpcoming));
  const upcoming = publicMovies.filter((m) => m.status === 'UPCOMING' || m.isUpcoming);

  // Hero movie index state to cycle beautifully
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const heroVideoRef = useRef(null);
  const youtubeFrameRef = useRef(null);
  const youtubePlayerRef = useRef(null);

  const heroMovies = nowPlaying.length ? nowPlaying : publicMovies;
  const heroMovie = heroMovies[currentHeroIndex] || heroMovies[0] || null;
  const heroTrailerUrl = heroMovie?.trailerUrl?.trim() || '';
  const heroYoutubeId = extractYoutubeId(heroTrailerUrl);
  const hasDirectHeroVideo = !heroYoutubeId && isDirectVideoUrl(heroTrailerUrl);
  const youtubeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const heroYoutubeSrc = heroYoutubeId
    ? `https://www.youtube.com/embed/${heroYoutubeId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${heroYoutubeId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1${youtubeOrigin ? `&origin=${encodeURIComponent(youtubeOrigin)}` : ''}`
    : '';

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, isMuted, heroTrailerUrl]);

  useEffect(() => {
    let cancelled = false;

    if (!heroYoutubeId) {
      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
      return undefined;
    }

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !YT?.Player || !youtubeFrameRef.current) return;

      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }

      youtubePlayerRef.current = new YT.Player(youtubeFrameRef.current, {
        events: {
          onReady: (event) => {
            if (isMuted) event.target.mute();
            else event.target.unMute();
            if (isPlaying) event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(0, true);
              if (isPlaying) event.target.playVideo();
            }
          }
        }
      });
    });

    return () => {
      cancelled = true;
      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [heroYoutubeId]);

  useEffect(() => {
    const player = youtubePlayerRef.current;
    if (!heroYoutubeId || !player?.playVideo) return;

    try {
      if (isMuted) player.mute();
      else player.unMute();

      if (isPlaying) player.playVideo();
      else player.pauseVideo();
    } catch {
      // The iframe API can ignore commands while the player is still booting.
    }
  }, [heroYoutubeId, isPlaying, isMuted]);

  const restartHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (isPlaying) video.play().catch(() => {});
  };

  const handlePrevHero = () => {
    if (!heroMovies.length) return;
    setCurrentHeroIndex((prev) => (prev === 0 ? heroMovies.length - 1 : prev - 1));
  };

  const handleNextHero = () => {
    if (!heroMovies.length) return;
    setCurrentHeroIndex((prev) => (prev === heroMovies.length - 1 ? 0 : prev + 1));
  };

  // Mood tags
  const moodTags = [
    { tag: '#Đỉnh_Cao_Thị_Giác', desc: 'Mãn nhãn hình ảnh, hiệu ứng đỉnh cao kịch liệt' },
    { tag: '#Căng_Não', desc: 'Tình tiết hack não, giải mật mã lượng tử bất ngờ' },
    { tag: '#Hành_Động_Kịch_Tính', desc: 'Đánh đấm bạo liệt, rượt đuổi nghẹt thở góc tối' },
    { tag: '#Sâu_Lắng_Lấy_Nước_Mắt', desc: 'Cảm xúc tình yêu u sầu, âm nhạc lay động tâm hồn' },
    { tag: '#Trẻ_Trung_Kỳ_Ảo', desc: 'Kỳ ảo lung linh đầy mộng mơ tươi đẹp trên chín tầng mây' }
  ];

  const recommendedMovie = nowPlaying[0] || publicMovies[0] || null;
  const isMovieBookable = (movie) => movie?.status === 'NOW_SHOWING' || (!movie?.status && !movie?.isUpcoming);
  const isMovieWatchlisted = (movie) => watchlist.some((item) => (
    String(item.backendId || item.movieId || item.id) === String(movie?.backendId || movie?.movieId || movie?.id)
  ));

  const findRecommendedMovie = () => recommendedMovie || publicMovies[0] || null;

  const handleSuggest = (e) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;

    setLoadingSuggestion(true);
    setSuggestionResponse(null);

    setTimeout(() => {
      const liveRecommendedMovie = findRecommendedMovie();
      setSuggestionResponse({
        reply: liveRecommendedMovie
          ? `Dựa trên mô tả của bạn, CinePremier gợi ý "${liveRecommendedMovie.title}" từ danh sách phim hiện có trong hệ thống.`
          : 'Chưa có phim khả dụng từ hệ thống để gợi ý. Vui lòng kiểm tra lại dữ liệu phim trong backend.',
        recommendedMovieId: liveRecommendedMovie?.id || '',
        recommendedMovie: liveRecommendedMovie,
        matchRate: liveRecommendedMovie ? 96 : 0
      });
      setLoadingSuggestion(false);
    }, 500);
  };

  const genresList = [
    { title: 'CINEMATIC NOIR', tags: 'Kịch Tính • Tăm Tối', bg: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400&auto=format&fit=crop' },
    { title: 'SCI-FI CYBER', tags: 'Tương Lai • Lượng Tử', bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop' },
    { title: 'VISION QUEST', tags: 'Kỳ Ảo • Hoạt Họa', bg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop' },
    { title: 'PURE ACTION', tags: 'Võ Thuật • Rượt Đuổi', bg: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop' }
  ];

  return (
    <div className="space-y-20 pb-24">

      {/* 1. HERO BANNER WITH DYNAMIC CINEMATIC VIDEO BACKGROUND */}
      <section
        className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-cover bg-center px-4 sm:px-6 lg:px-8 py-20 transition-all duration-700"
        style={{ backgroundImage: heroMovie?.bannerUrl ? `url(${heroMovie.bannerUrl})` : undefined }}
        id="hero-banner"
      >
        {/* Cinematic background */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          {heroYoutubeId ? (
            <iframe
              key={`${heroMovie?.id || 'hero'}-${heroYoutubeId}`}
              ref={youtubeFrameRef}
              className={`absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-80'}`}
              src={heroYoutubeSrc}
              title={`${heroMovie?.title || 'CinePremier'} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              aria-hidden="true"
            />
          ) : hasDirectHeroVideo ? (
            <video
              key={`${heroMovie?.id || 'hero'}-${heroTrailerUrl}`}
              ref={heroVideoRef}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-80'}`}
              src={heroTrailerUrl}
              autoPlay={isPlaying}
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              onEnded={restartHeroVideo}
              aria-hidden="true"
            />
          ) : null}
          {/* Subtle cinematic overlays: dark enough on the left for text readability, clear in center and right for video action */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/15 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10 z-10" />

          {/* Subtle horizontal CRT-like line scanning for cinema projection texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_97%,rgba(255,255,255,0.02)_97%)] bg-[size:100%_15px] pointer-events-none z-10 opacity-75"></div>
        </div>

        <div className="relative max-w-7xl w-full mx-auto z-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-8 space-y-6 max-w-2xl">
            {/* Top Tag: Now Playing & Sound Indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center space-x-2 border border-white/25 bg-black/95 px-3.5 py-1 text-[9px] font-sans tracking-[0.25em] uppercase text-white font-extrabold rounded-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>BOM TẤN THƯỢNG HẠNG • VIDEO CHUYỂN ĐỘNG ĐẸP</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 border border-amber-500/30 bg-amber-950/20 px-3 py-1 text-[9px] font-mono tracking-wider uppercase text-amber-400 font-bold rounded-none">
                <Film className="h-3 w-3 animate-spin duration-1000" />
                <span>{heroTrailerUrl ? 'TRAILER PHIM' : 'CHƯA CÓ TRAILER'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl sm:text-7xl font-serif font-light text-white tracking-wide leading-none italic uppercase">
                {heroMovie?.title || 'Chưa có phim từ hệ thống'}
              </h1>
              <p className="text-xs font-sans text-neutral-400 uppercase tracking-[0.25em] pt-1">
                {heroMovie?.englishTitle || 'Dữ liệu phim đang được tải từ backend'}
              </p>
            </div>

            <p className="text-neutral-300 text-sm leading-relaxed max-w-lg font-sans">
              {heroMovie?.synopsis || 'Khi backend có phim đang chiếu hoặc sắp chiếu, danh sách sẽ hiển thị tại đây.'}
            </p>

            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-sans font-medium text-neutral-400">
              {(heroMovie?.genre || []).map((g) => (
                <span key={g} className="border border-white/15 bg-black/40 px-2.5 py-1">
                  {g}
                </span>
              ))}
              <span className="border border-red-500/50 bg-red-950/20 px-2.5 py-1 text-red-400 font-bold">
                {heroMovie?.ageRating || 'N/A'}
              </span>
              <span className="border border-white/10 px-2.5 py-1">
                {heroMovie?.duration || 0} MIN
              </span>
            </div>

            {/* CTA action buttons & Media Controller widgets */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                disabled={!heroMovie || !isMovieBookable(heroMovie)}
                onClick={() => heroMovie && onBookMovie(heroMovie)}
                className="border border-white bg-white text-black text-xs font-sans uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-black hover:text-white hover:border-white transition-all duration-300 font-bold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black"
                id="hero-book-now"
              >
                Hẹn Giờ Đặt Vé Ngay
              </button>

              <button
                disabled={!heroMovie}
                onClick={() => heroMovie && onSelectMovie(heroMovie.id)}
                className="border border-white/20 bg-black text-white text-xs font-sans uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-white hover:text-black hover:border-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
                id="hero-details"
              >
                Xem Chi Tiết
              </button>

              {/* Media play/pause and sound controller for elegant cinematic interaction */}
              <div className="flex items-center bg-black/80 border border-white/10 p-1.5 space-x-1 divide-x divide-white/10">
                <div className="flex space-x-1 pr-1.5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 hover:bg-white/15 text-white active:scale-95 transition-all rounded-none"
                    title={isPlaying ? "Tạm dừng chuyển động nền" : "Phát chuyển động nền"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 hover:bg-white/15 text-white active:scale-95 transition-all rounded-none"
                    title={isMuted ? "Bật chế độ nổi bật" : "Tắt chế độ nổi bật"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4 text-neutral-400" /> : <Volume2 className="h-4 w-4 text-amber-500 animate-bounce" />}
                  </button>
                </div>

                <div className="flex items-center space-x-1 pl-1.5">
                  <button
                    onClick={handlePrevHero}
                    className="p-1 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                    title="Phim trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[9px] font-mono text-neutral-400 px-1 font-bold">
                    {heroMovies.length ? currentHeroIndex + 1 : 0}/{heroMovies.length}
                  </span>
                  <button
                    onClick={handleNextHero}
                    className="p-1 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                    title="Phim tiếp"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {heroMovie && <div className="hidden lg:flex lg:col-span-4 justify-end">
            <div className="relative w-64 aspect-[2/3] border border-white/15 shadow-2xl p-2 bg-black hover:border-white/40 transition-all duration-500 group/poster">
              <div className="w-full h-full relative overflow-hidden border border-white/5">
                <img
                  src={heroMovie.posterUrl}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute right-3 top-3 bg-black border border-white/20 text-white font-sans text-[10px] uppercase tracking-wider px-2 py-1">
                  ⭐ {heroMovie.ratings?.overall || '--'} Rating
                </div>

                {/* Micro animation to indicate background video control */}
                <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/70 border border-white/10 px-2.5 py-1 text-[8.5px] text-neutral-300 font-mono">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>PREVIEWING LIVE</span>
                </div>
              </div>
            </div>
          </div>}

        </div>
      </section>

      {/* 2. NOW PLAYING GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="now-playing-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-4 mb-10">
          <div>
            <div className="flex items-center space-x-3">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-light">
                Phim Đang Chiếu
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1.5">Các tác phẩm độc sắc kích hoạt quang phổ nghệ thuật điện ảnh</p>
          </div>

          <button
            onClick={() => onTabChange('explore')}
            className="text-xs uppercase tracking-[0.15em] text-neutral-400 hover:text-white flex items-center space-x-1.5 transition mt-4 sm:mt-0 font-sans border-b border-transparent hover:border-white pb-1"
          >
            <span>TẤT CẢ TÁC PHẨM</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5" id="now-playing-grid">
          {nowPlaying.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelectMovie}
              onBook={onBookMovie}
              isWatchlisted={isMovieWatchlisted(movie)}
              onToggleWatchlist={handleToggleWatchlist}
            />
          ))}
        </div>
      </section>

      {/* 3. PERSONALIZED HIGHLIGHTS */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-16 px-4 sm:px-6 lg:px-8" id="personalized-highlights-section">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Box: Mood Selectors & Recommendations */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-1.5 border border-white/10 bg-black px-3 py-1 text-[9px] text-neutral-400 tracking-[0.2em] uppercase font-sans">
                <Sparkles className="h-3 w-3 text-white" />
                <span>GỢI Ý THEO TÂM TRẠNG</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-wide leading-tight">
                Gợi Ý Khớp Nhịp Tim <br />
                <span className="font-serif italic text-neutral-400">
                  CinePremier Mood Selector
                </span>
              </h2>

              <p className="text-sm text-neutral-400 leading-relaxed max-w-xl font-sans">
                Chọn tâm trạng nghệ thuật hoặc nhập cảm giác xem phim mong muốn. CinePremier sẽ đề xuất một lựa chọn phù hợp từ danh sách phim hiện có.
              </p>

              {/* Mood Filter chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {moodTags.map((mt) => (
                  <button
                    key={mt.tag}
                    onClick={() => {
                      setSelectedMood(mt.tag);
                      setSuggestionResponse(null);
                    }}
                    className={`px-4 py-2 text-[10px] font-sans tracking-[0.1em] uppercase transition-all duration-300 ${selectedMood === mt.tag && !suggestionResponse
                      ? 'bg-white text-black border border-white'
                      : 'bg-black border border-white/10 text-neutral-500 hover:text-white hover:border-white/30'
                      }`}
                  >
                    {mt.tag.replace('#', '')}
                  </button>
                ))}
              </div>

              {/* Dynamic recommendation card */}
              {!suggestionResponse && recommendedMovie && (
                <div className="relative bg-black border border-white/10 p-6 flex flex-col md:flex-row gap-6 hover:border-white/20 transition-all duration-300">
                  <div className="w-full md:w-32 aspect-[2/3] overflow-hidden flex-shrink-0 bg-neutral-950 border border-white/5">
                    <img
                      src={recommendedMovie.posterUrl}
                      alt={recommendedMovie.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sans tracking-[0.15em] text-neutral-400 uppercase">GỢI Ý DUY NHẤT</span>
                        <span className="text-[10px] text-white font-mono font-bold bg-neutral-900 px-2 py-0.5 border border-white/10">
                          99% RES
                        </span>
                      </div>
                      <h4 className="text-xl font-serif text-white mt-2 italic">{recommendedMovie.title}</h4>
                      <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">{recommendedMovie.englishTitle}</p>

                      <p className="text-xs text-neutral-400 mt-3 leading-relaxed font-sans line-clamp-3">
                        {recommendedMovie.synopsis}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => onSelectMovie(recommendedMovie.id)}
                        className="text-[10px] font-sans tracking-wider uppercase text-neutral-400 hover:text-white underline underline-offset-4 decoration-white/30"
                      >
                        VÌ SAO PHÙ HỢP? →
                      </button>
                      <button
                        disabled={!isMovieBookable(recommendedMovie)}
                        onClick={() => isMovieBookable(recommendedMovie) && onBookMovie(recommendedMovie)}
                        className="bg-white text-black px-5 py-2 text-[10px] uppercase tracking-wider font-sans font-bold hover:bg-neutral-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ĐẶT NGAY
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestion response box after custom typing */}
              {suggestionResponse && (
                <div className="bg-black border border-white/25 p-6 space-y-4 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white font-sans text-[10px] uppercase tracking-[0.2em]">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                      <span>GỢI Ý CINEPHILE</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                      ✓ KHỚP {suggestionResponse.matchRate}%
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed italic border-l border-white/30 pl-3.5 font-sans">
                    "{suggestionResponse.reply}"
                  </p>

                  {/* recommended detailed card from custom prompt */}
                  {suggestionResponse.recommendedMovie && (
                    <div className="flex items-center space-x-4 bg-neutral-950 p-4 border border-white/5">
                      <img
                        src={suggestionResponse.recommendedMovie.posterUrl}
                        alt="Recom"
                        className="h-16 w-11 object-cover border border-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-serif text-white truncate italic">
                          {suggestionResponse.recommendedMovie.title}
                        </h5>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest truncate">
                          {suggestionResponse.recommendedMovie.englishTitle}
                        </p>
                        <button
                          onClick={() => onSelectMovie(suggestionResponse.recommendedMovie.id)}
                          className="text-[9px] uppercase tracking-widest text-neutral-400 hover:text-white font-sans mt-2 block hover:underline"
                        >
                          XEM CHI TIẾT →
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (suggestionResponse.recommendedMovie) onBookMovie(suggestionResponse.recommendedMovie);
                        }}
                        className="bg-white text-black px-4 py-2 text-[9px] uppercase tracking-wider font-sans font-bold hover:bg-neutral-200 transition"
                      >
                        Đặt Vé
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Box: Prompt Input Interactive Terminal */}
            <div className="lg:col-span-5 border border-white/10 bg-black p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
                  <MessageSquare className="h-4 w-4 text-white" />
                  <h3 className="text-[10px] font-sans uppercase tracking-[0.2em] text-neutral-400">
                    Gợi Ý Theo Cảm Xúc
                  </h3>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Điền tâm trạng của bạn đêm nay, ví dụ: <i>"Tôi đang mỏi mệt, cần tìm sự thảnh thơi nhẹ lòng"</i> hoặc <i>"Thèm rượt đuổi giật gân bùng nổ rạp"</i>.
                </p>

                <form onSubmit={handleSuggest} className="space-y-4">
                  <textarea
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Mô tả tâm trạng mong muốn của bạn..."
                    className="w-full border border-white/10 bg-neutral-950 p-3 text-xs text-white placeholder-neutral-700 font-sans focus:border-white focus:outline-none"
                    id="mood-textarea"
                  />

                  <button
                    type="submit"
                    disabled={loadingSuggestion || !userPrompt.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-black py-3.5 text-[10px] uppercase tracking-[0.2em] font-sans font-bold hover:bg-black hover:text-white border border-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all"
                    id="mood-suggest-submit"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${loadingSuggestion ? 'animate-spin' : ''}`} />
                    <span>{loadingSuggestion ? 'ĐANG GỢI Ý...' : 'GỢI Ý KHỚP VÉ'}</span>
                  </button>
                </form>

                <div className="text-[9px] text-neutral-600 flex items-center gap-1.5 justify-center font-sans uppercase tracking-wider">
                  <HelpCircle className="h-3 w-3" />
                  <span>CinePremier Mood Recommendation</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. UPCOMING RELEASES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="upcoming-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-4 mb-10">
          <div>
            <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-light">
              Phim Sắp Chiếu VIP
            </h2>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1.5">Lưu trước thời khắc khởi chiếu và đặt chỗ tiên phong</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="upcoming-grid">
          {upcoming.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie.id)}
              className="group flex flex-col sm:flex-row bg-[#0A0A0A] border border-white/5 p-4 gap-4 hover:border-white/15 transition-all duration-300 cursor-pointer"
            >
              <div className="w-[100px] aspect-[2/3] overflow-hidden flex-shrink-0 bg-neutral-950 border border-white/5">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div className="space-y-1.5">
                  <span className="inline-block border border-white/15 bg-black text-neutral-300 font-sans text-[8px] tracking-[0.2em] px-2 py-0.5 uppercase">
                    {movie.upcomingDate}
                  </span>
                  <h4 className="text-base font-serif text-white group-hover:text-zinc-300 transition-colors truncate italic">{movie.title}</h4>
                  <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest truncate">{movie.englishTitle}</p>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-2 leading-relaxed font-sans">{movie.synopsis}</p>
                </div>

                <div className="flex items-center justify-between text-[9px] uppercase tracking-wide text-neutral-500 pt-3 border-t border-white/5 mt-3">
                  <span>MỨC QUAN TÂM: 96%</span>
                  <span className="text-white hover:underline underline-offset-4">XEM TÓM TẮT →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. DISCOVER GENRES ARTWORK */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="genres-section">
        <h2 className="text-2xl font-serif text-white uppercase tracking-wider font-light border-b border-white/10 pb-4 mb-10">
          Khám Phá Vũ Trụ Thể Loại
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" id="discover-genres-grid">
          {genresList.map((g, i) => (
            <div
              key={i}
              onClick={() => onTabChange('explore')}
              className="group relative h-28 border border-white/10 bg-black p-4 flex flex-col justify-end cursor-pointer hover:border-white/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-cover bg-center grayscale contrast-200 opacity-20 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500" style={{ backgroundImage: `url(${g.bg})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

              <div className="relative z-10 border-l border-white/20 pl-3">
                <h4 className="text-xs uppercase tracking-[0.2em] text-white font-sans">{g.title}</h4>
                <p className="text-[9px] text-neutral-500 mt-1 uppercase tracking-widest">{g.tags}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
