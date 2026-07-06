import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from '@/components/common/MovieCard';
import cinema1 from "@/assets/banners/cinema1.png";
import cinema2 from "@/assets/banners/cinema2.png";
import { useMovies } from '../../stores/useMovieStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { getStoredAuth } from '../../services/authService';
import { movieService } from '../../services/movieService';
import { recommendationService } from '../../services/recommendationService';
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


const banners = [cinema1, cinema2];

export default function HomeView({ onSelectMovie, onBookMovie, onTabChange, moviesList = [] }) {
   const [currentIndex, setCurrentIndex] = useState(0);
  const { watchlist = [], handleToggleWatchlist } = useMovies();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [personalRecs, setPersonalRecs] = useState([]);

  // Filter movies for "Now Playing" and "Upcoming"
  const sourceMovies = Array.isArray(moviesList) ? moviesList : [];
  const publicMovies = sourceMovies.filter((m) => m.status !== 'INACTIVE' && !m.isInactive);
  const nowPlaying = publicMovies.filter((m) => m.status === 'NOW_SHOWING' || (!m.status && !m.isUpcoming));
  const nowPlayingRef = useRef(null);
  const scrollNowPlaying = (dir) => {
    const el = nowPlayingRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  const upcoming = publicMovies.filter((m) => m.status === 'UPCOMING' || m.isUpcoming);
  const upcomingRef = useRef(null);
  const scrollUpcoming = (dir) => {
    const el = upcomingRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

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

  const isMovieBookable = (movie) => movie?.status === 'NOW_SHOWING' || (!movie?.status && !movie?.isUpcoming);
  const isMovieWatchlisted = (movie) => watchlist.some((item) => (
    String(item.backendId || item.movieId || item.id) === String(movie?.backendId || movie?.movieId || movie?.id)
  ));

  // Personalized recommendations from the AI service (collaborative filtering).
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) {
      setPersonalRecs([]);
      return undefined;
    }
    let cancelled = false;
    const { accessToken } = getStoredAuth();
    recommendationService.getCollaborativeRecommendations(currentUser.id, accessToken)
      .then(async (items) => {
        if (cancelled) return;
        const list = Array.isArray(items) ? [...items] : [];
        // The featured card shows synopsis/director, which the slim rec payload lacks —
        // fetch the full detail for the top recommendation (pagination-independent).
        if (list.length) {
          try {
            const detail = await movieService.getMovieDetail(list[0].backendId || list[0].id);
            if (detail?.id) list[0] = { ...detail, similarity: list[0].similarity };
          } catch { /* keep the slim rec if the detail call fails */ }
        }
        if (!cancelled) setPersonalRecs(list);
      })
      .catch(() => {
        if (!cancelled) setPersonalRecs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, currentUser?.id]);

  // Enrich a recommendation item with full movie data (synopsis, status…) when we already have it.
  const enrichRecommendation = (rec) => {
    const full = publicMovies.find((m) => (
      String(m.backendId || m.movieId || m.id) === String(rec.backendId || rec.id)
    ));
    return full ? { ...full, similarity: rec.similarity } : rec;
  };

  const genresList = [
    { title: 'CINEMATIC NOIR', tags: 'Kịch Tính • Tăm Tối', bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10' },
    { title: 'SCI-FI CYBER', tags: 'Tương Lai • Lượng Tử', bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10' },
    { title: 'VISION QUEST', tags: 'Kỳ Ảo • Hoạt Họa', bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10' },
    { title: 'PURE ACTION', tags: 'Võ Thuật • Rượt Đuổi', bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10' }
  ];

  return (
    <div className="space-y-20 pb-24 relative">
      {/* Snowfall effect */}
      <Snowfall
        color="rgba(255, 255, 255, 0.5)"
        snowflakeCount={10}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 1
        }}
      />

      {/* Background lighting effect */}
      <div className="pointer-events-none fixed inset-0 -z-50">
        <div className="absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl mt-10 mb-4 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <button
          onClick={() => {
            setCurrentIndex((prev) =>
              prev === 0 ? banners.length - 1 : prev - 1
            );
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 sm:-ml-12 z-20 text-white hover:text-gray-300 focus:outline-none"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <section className="relative w-full overflow-hidden rounded-lg bg-black">
          <div className="relative w-full h-[300px]">
            {banners.map((banner, index) => (
              <img
                key={index}
                src={banner}
                className={`absolute inset-0 w-full h-full object-fill transition-transform duration-700 ${
                  index === currentIndex 
                    ? 'translate-x-0' 
                    : index < currentIndex 
                      ? '-translate-x-full' 
                      : 'translate-x-full'
                }`}
                alt={`Banner ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <button
          onClick={() => {
            setCurrentIndex((prev) =>
              prev === banners.length - 1 ? 0 : prev + 1
            );
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-8 sm:-mr-12 z-20 text-white hover:text-gray-300 focus:outline-none"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {/* Lighting effect between banner and content */}
      <div className="pointer-events-none relative mx-auto max-w-5xl -mt-32 h-20">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[2000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/40 blur-[600px] -z-10" />
      </div>

      {/* 2. NOW PLAYING GRID */}
      <section className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-0" id="now-playing-section">
        <div className="flex flex-col items-center text-center gap-3 pb-4 mb-10 relative">
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-sans uppercase tracking-wider font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                Phim Đang Chiếu
              </h2>
            <p className="text-base text-neutral-200 uppercase tracking-widest mt-1.5">Các tác phẩm độc sắc kích hoạt quang phổ nghệ thuật điện ảnh</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollNowPlaying(-1)}
            aria-label="Phim trước"
            className="absolute -left-4 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/90 transition hover:text-white sm:-left-8 xl:-left-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            ref={nowPlayingRef}
            className="flex [justify-content:safe_center] gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            id="now-playing-grid"
          >
            {nowPlaying.map((movie) => (
              <div key={movie.id} className="snap-start shrink-0 w-[200px] sm:w-[240px] lg:w-[calc((100%_-_4.5rem)/4)]">
                <MovieCard
                  movie={movie}
                  onSelect={onSelectMovie}
                  onBook={onBookMovie}
                  isWatchlisted={isMovieWatchlisted(movie)}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollNowPlaying(1)}
            aria-label="Phim sau"
            className="absolute -right-4 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/90 transition hover:text-white sm:-right-8 xl:-right-12"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onTabChange('explore')}
            className="border border-white/30 px-10 py-3 text-xs font-sans uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition"
          >
            Xem Thêm
          </button>
        </div>
      </section>

      {/* 4. UPCOMING RELEASES */}
      <section className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-0" id="upcoming-section">
        <div className="flex flex-col items-center text-center gap-3 pb-4 mb-10 relative">
          <div>
            <h2 className="text-3xl sm:text-4xl font-sans uppercase tracking-wider font-bold bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent">
              Phim Sắp Chiếu VIP
            </h2>
            <p className="text-base text-neutral-200 uppercase tracking-widest mt-1.5">Lưu trước thời khắc khởi chiếu và đặt chỗ tiên phong</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollUpcoming(-1)}
            aria-label="Phim trước"
            className="absolute -left-4 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/90 transition hover:text-white sm:-left-8 xl:-left-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            ref={upcomingRef}
            className="flex [justify-content:safe_center] gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            id="upcoming-grid"
          >
          {upcoming.map((movie) => (
            <div key={movie.id} className="snap-start shrink-0 w-[200px] sm:w-[240px] lg:w-[calc((100%_-_4.5rem)/4)]">
              <MovieCard
                movie={movie}
                onSelect={onSelectMovie}
                onBook={onBookMovie}
                isWatchlisted={isMovieWatchlisted(movie)}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          ))}
          </div>

          <button
            type="button"
            onClick={() => scrollUpcoming(1)}
            aria-label="Phim sau"
            className="absolute -right-4 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/90 transition hover:text-white sm:-right-8 xl:-right-12"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onTabChange('explore')}
            className="border border-white/30 px-10 py-3 text-xs font-sans uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition"
          >
            Xem Thêm
          </button>
        </div>
      </section>
      {/* 3. PERSONALIZED RECOMMENDATIONS — real data from collaborative AI */}
      {isLoggedIn && personalRecs.length > 0 && (() => {
        const [featuredRec, ...otherRecs] = personalRecs.map(enrichRecommendation);
        return (
          <section className="bg-gradient-to-b from-purple-950/20 via-black to-purple-950/20 border-y border-purple-500/20 py-16 relative" id="personalized-highlights-section">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">

              <div className="space-y-5">
                <div className="inline-flex items-center space-x-1.5 border border-purple-500/30 bg-purple-950/50 px-3 py-1 text-[9px] text-purple-200 tracking-[0.2em] uppercase font-sans">
                  <Sparkles className="h-3 w-3 text-purple-300" />
                  <span>ĐỀ XUẤT CHO BẠN</span>
                </div>

                <h2 className="text-5xl sm:text-6xl font-serif font-light text-white tracking-wide leading-tight">
                  Chọn Riêng Cho <br />
                  <span className="font-serif italic text-neutral-200">Gu Xem Của Bạn</span>
                </h2>

                <p className="text-lg text-neutral-200 leading-relaxed max-w-xl font-sans">
                  Mức phù hợp bên dưới được tính trực tiếp từ lịch sử đặt vé và đánh giá của những
                  khán giả có gu xem tương tự bạn — dữ liệu thật từ hệ thống, không phải con số trang trí.
                </p>
              </div>

              {/* Featured recommendation with real match score */}
              {featuredRec && (
                <div className="relative bg-gradient-to-br from-purple-950/30 to-black border border-purple-500/20 p-6 flex flex-col md:flex-row gap-6 hover:border-purple-400/40 transition-all duration-300">
                  <div className="w-full md:w-32 aspect-[2/3] overflow-hidden flex-shrink-0 bg-neutral-950 border border-white/5">
                    {featuredRec.posterUrl ? (
                      <img
                        src={featuredRec.posterUrl}
                        alt={featuredRec.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-neutral-600">Không có poster</div>
                    )}
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sans tracking-[0.15em] text-neutral-200 uppercase">PHÙ HỢP NHẤT VỚI BẠN</span>
                        {typeof featuredRec.similarity === 'number' && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-500/20">
                            ✓ KHỚP {Math.round(featuredRec.similarity * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-serif text-white mt-2 italic">{featuredRec.title}</h4>
                      {featuredRec.englishTitle && (
                        <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">{featuredRec.englishTitle}</p>
                      )}
                      {featuredRec.director && (
                        <p className="text-[10px] text-neutral-300 mt-1.5 font-sans uppercase tracking-widest">
                          Đạo diễn: <span className="text-white font-bold">{featuredRec.director}</span>
                        </p>
                      )}

                      {featuredRec.synopsis && (
                        <p className="text-xs text-neutral-200 mt-3 leading-relaxed font-sans line-clamp-3">
                          {featuredRec.synopsis}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400 mt-3 font-sans italic">
                        Điểm khớp tính từ đánh giá của khán giả có lịch sử xem giống bạn.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => onSelectMovie(featuredRec.id)}
                        className="text-[10px] font-sans tracking-wider uppercase text-neutral-200 hover:text-white underline underline-offset-4 decoration-white/30"
                      >
                        XEM CHI TIẾT →
                      </button>
                      <button
                        disabled={!isMovieBookable(featuredRec)}
                        onClick={() => isMovieBookable(featuredRec) && onBookMovie(featuredRec)}
                        className="bg-purple-600 text-white px-5 py-2 text-[10px] uppercase tracking-wider font-sans font-bold hover:bg-purple-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ĐẶT NGAY
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Remaining recommendations */}
              {otherRecs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" id="personalized-recs-grid">
                  {otherRecs.slice(0, 10).map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSelectMovie(rec.id)}
                      className="group relative text-left bg-neutral-950 border border-white/10 hover:border-purple-400/40 transition overflow-hidden cursor-pointer"
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden bg-black">
                        {rec.posterUrl ? (
                          <img
                            src={rec.posterUrl}
                            alt={rec.title}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-neutral-600">Không có poster</div>
                        )}
                      </div>
                      {typeof rec.similarity === 'number' && (
                        <span className="absolute top-2 right-2 bg-black/80 border border-purple-400/30 px-2 py-1 text-[9px] font-sans font-bold tracking-wider text-purple-200">
                          {Math.round(rec.similarity * 100)}% KHỚP
                        </span>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-serif text-white leading-snug line-clamp-2">{rec.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </section>
        );
      })()}

      {/* 5. DISCOVER GENRES ARTWORK */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8" id="genres-section">
        <div className="relative pb-4 mb-10">
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <h2 className="text-4xl font-serif uppercase tracking-wider font-light bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent">
            Khám Phá Vũ Trụ Thể Loại
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" id="discover-genres-grid">
          {genresList.map((g, i) => (
            <div
              key={i}
              onClick={() => onTabChange('explore')}
              className="group relative h-28 border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-black p-4 flex flex-col justify-end cursor-pointer hover:border-purple-400/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-cover bg-center grayscale contrast-200 opacity-20 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500" style={{ backgroundImage: `url(${g.bg})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

              <div className="relative z-10 border-l border-white/20 pl-3">
                <h4 className="text-xs uppercase tracking-[0.2em] text-white font-sans">{g.title}</h4>
                <p className="text-[9px] text-neutral-300 mt-1 uppercase tracking-widest">{g.tags}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

