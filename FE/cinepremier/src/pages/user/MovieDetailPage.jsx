import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Star, Clock, Heart } from 'lucide-react';
import { useMovies } from '../../stores/useMovieStore';
import { getStoredAuth } from '../../services/authService';
import { adminService } from '../../services/adminService';
import { movieService } from '../../services/movieService';
import { useAuthStore } from '../../stores/useAuthStore';

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

const getTrailerEmbedSrc = (url = '') => {
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
  }
  return url;
};

export default function DetailView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { moviesList, setMoviesList, watchlist = [], handleToggleWatchlist } = useMovies();
  const currentRole = useAuthStore((state) => state.currentRole);
  const movie = moviesList.find(m => String(m.id) === String(id) || String(m.backendId) === String(id));
  const onBack = () => navigate(-1);
  const onBook = (mv) => navigate(`/movies/${mv.id}/book`);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const { accessToken } = getStoredAuth();
        const detailMovieId = movie?.backendId || id;
        const detail = currentRole === 'admin' && accessToken
          ? await adminService.getAdminMovieDetail(accessToken, detailMovieId)
          : await movieService.getMovieDetail(detailMovieId);
        if (cancelled || !detail?.id) return;
        setMoviesList(prev => {
          const exists = prev.some(m => (
            String(m.id) === String(id)
            || String(m.id) === String(detail.id)
            || String(m.backendId) === String(detail.id)
          ));
          if (!exists) return [{ ...detail }, ...prev];
          return prev.map(m => (
            String(m.id) === String(id)
            || String(m.id) === String(detail.id)
            || String(m.backendId) === String(detail.id)
          ) ? { ...m, ...detail } : m);
        });
      } catch { /* use fallback from list */ }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [id, currentRole, movie?.backendId]);

  const [showTrailer, setShowTrailer] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [likedReviews, setLikedReviews] = useState({});
  const isBookable = movie?.status === 'NOW_SHOWING' || (!movie?.status && !movie?.isUpcoming);
  const isWatchlisted = movie && watchlist.some((item) => (
    String(item.backendId || item.movieId || item.id) === String(movie.backendId || movie.movieId || movie.id)
  ));
  const trailerUrl = movie?.trailerUrl?.trim() || '';
  const trailerEmbedSrc = getTrailerEmbedSrc(trailerUrl);
  const hasDirectTrailerVideo = isDirectVideoUrl(trailerUrl);

  // Reviews are user-generated; do not seed frontend mock reviews.
  useEffect(() => {
    if (!movie) return;
    setReviews([]);
  }, [movie]);

  // Handle post user review
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    const newRev = {
      id: `user-rev-${Date.now()}`,
      author: newAuthor,
      avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10',
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

  const mainActorIdSet = new Set((movie.mainActorIds || []).map((actorId) => Number(actorId)));
  const currentCasts = Array.isArray(movie.actors)
    ? movie.actors.map((actor) => ({
        id: Number.isFinite(Number(actor.id ?? actor.actorId)) ? Number(actor.id ?? actor.actorId) : actor.name,
        name: actor.name || actor.fullName || actor.actorName || 'Diễn viên',
        role: actor.role || actor.characterName || actor.description || 'Diễn viên',
        avatarUrl: actor.avatarUrl || actor.imageUrl || actor.photoUrl || '',
        isMain: mainActorIdSet.has(Number(actor.id ?? actor.actorId))
      }))
    : [];
  const mainCasts = currentCasts.filter((cast) => cast.isMain);
  const supportingCasts = currentCasts.filter((cast) => !cast.isMain);

  return (
    <div className="pb-24 space-y-12">
      
      {/* 1. BLURRED BANNER HERO BACKGROUND */}
      <section 
        className="relative min-h-[55vh] flex items-end bg-cover bg-center px-4 sm:px-6 lg:px-8 py-10"
        style={{ backgroundImage: `url(${movie.bannerUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-black/50 z-0 backdrop-blur-[1px]" />

        <div className="relative max-w-5xl w-full mx-auto z-20 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Movie Poster Vertical Card */}
          <div className="md:col-span-4 flex justify-center md:justify-start">
            <div className="relative w-72 aspect-[2/3] overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-black">
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
          <div className="md:col-span-8 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {movie.genre.map((gen) => (
                <span key={gen} className="border border-white/15 bg-black text-white font-sans text-[10px] tracking-[0.1em] uppercase px-3 py-1">
                  {gen}
                </span>
              ))}
              <span className="border border-white/10 bg-black text-white font-sans text-[10px] tracking-[0.1em] uppercase px-3 py-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {movie.duration} MIN
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-wider leading-none uppercase italic">
                {movie.title}
              </h1>
              <p className="text-xs sm:text-sm font-sans tracking-[0.2em] text-white uppercase pt-1">
                {movie.englishTitle}
              </p>
            </div>

            <p className="text-[10px] text-white font-sans uppercase tracking-[0.15em]">
              ĐẠO DIỄN: <span className="text-white font-bold">{movie.director}</span> • RA MẮT: {movie.releaseDate}
            </p>

            {/* Book & Trailer Action trigger buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              {isBookable ? (
                <button
                  onClick={() => onBook(movie)}
                  className="border border-purple-400/70 bg-purple-600 text-white text-xs font-bold font-sans uppercase tracking-[0.15em] px-8 py-3.5 hover:bg-purple-500 hover:border-purple-300 transition duration-300"
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
                disabled={!trailerUrl}
                className="border border-purple-400/50 bg-black/40 hover:bg-purple-950/40 hover:border-purple-400/70 text-white px-6 py-3.5 text-xs font-sans uppercase tracking-[0.15em] flex items-center gap-2 transition duration-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/40 disabled:hover:border-purple-400/20"
                id="detail-trailer-button"
              >
                <Play className="h-4 w-4 fill-white text-white" />
                XEM TRAILER
              </button>

              <button
                type="button"
                onClick={() => handleToggleWatchlist(movie)}
                className={`border px-5 py-3.5 text-xs font-sans uppercase tracking-[0.15em] flex items-center gap-2 transition duration-300 ${
                  isWatchlisted
                    ? 'border-rose-400/70 bg-rose-500 text-white hover:bg-black'
                    : 'border-white/10 bg-black/40 text-white hover:bg-white hover:text-black'
                }`}
                id="detail-watchlist-button"
              >
                <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                {isWatchlisted ? 'ĐÃ LƯU' : 'LƯU PHIM'}
              </button>

              <button
                type="button"
                className="border border-purple-400/50 bg-black/40 hover:bg-purple-950/40 hover:border-purple-400/70 text-white px-6 py-3.5 text-xs font-sans uppercase tracking-[0.15em] transition duration-300"
                id="detail-analysis-button"
              >
                PHÂN TÍCH
              </button>


            </div>
          </div>

        </div>
      </section>

      {/* Back button - outside banner section */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 border border-purple-400/50 bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-sans text-white hover:bg-purple-600 hover:text-white transition-all duration-300"
          id="detail-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>QUAY LẠI</span>
        </button>
      </div>

      {/* 2. MAIN DETAILS GRID */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Block: Synopsis & Actors representation */}
          <div className="lg:col-span-12 space-y-10">
            <div className="space-y-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-white border-b border-white/10 pb-2">TÓM TẮT NỘI DUNG</h3>
              <p className="text-sm text-white leading-relaxed font-sans font-light">
                {movie.synopsis}
              </p>
            </div>

            {/* Circular Actors representation block */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-white border-b border-white/10 pb-2">DIỄN VIÊN CHÍNH</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="cast-list">
                {mainCasts.length === 0 && (
                  <p className="col-span-full border border-dashed border-white/10 bg-black p-4 text-xs text-white">
                    Chưa chọn diễn viên chính cho phim này.
                  </p>
                )}
                {mainCasts.map((cast) => (
                  <div key={cast.id || cast.name} className="flex items-center space-x-3 bg-[#0A0A0A] p-3 border border-white/5">
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
                      <p className="text-[9px] text-white uppercase tracking-widest truncate mt-0.5">{cast.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-white border-b border-white/10 pb-2">MỘT SỐ DIỄN VIÊN TRONG PHIM</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="supporting-cast-list">
                {supportingCasts.length === 0 && (
                  <p className="col-span-full border border-dashed border-white/10 bg-black p-4 text-xs text-white">
                    Chưa có diễn viên phụ hoặc tất cả diễn viên đang được đánh dấu là vai chính.
                  </p>
                )}
                {supportingCasts.map((cast) => (
                  <div key={cast.id || cast.name} className="flex items-center space-x-3 bg-[#0A0A0A] p-3 border border-white/5">
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
                      <p className="text-[9px] text-white uppercase tracking-widest truncate mt-0.5">{cast.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Reviews comment section */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-white border-b border-white/10 pb-2">
                NHẬN XÉT CỦA CINEPHILE ({reviews.length})
              </h3>

              {/* Form Comment */}
              <form onSubmit={handleAddReview} className="border border-white/10 bg-black p-5 space-y-4">
                <span className="text-[10px] font-sans font-medium text-white uppercase tracking-[0.15em] block">Viết đánh giá phê bình</span>
                
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
                    <span className="text-xs uppercase tracking-wider text-white font-sans">Độ nồng:</span>
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
                    className="border border-purple-400/70 bg-purple-600 text-white hover:bg-purple-500 px-5 py-2 text-[10px] tracking-widest uppercase font-sans font-bold transition"
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

                    <p className="text-neutral-200 text-xs leading-relaxed font-sans font-light pl-11">
                      "{rev.content}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 font-sans text-[9px] tracking-wider text-white pl-11">
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
        </div>
      </section>

      {/* 3. VIDEO TRAILER DIALOG COMPONENT MODAL */}
      {showTrailer && trailerUrl && (
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
              {hasDirectTrailerVideo ? (
                <video
                  src={trailerUrl}
                  className="h-full w-full"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <iframe
                  title={`${movie.title} Trailer`}
                  src={trailerEmbedSrc}
                  className="h-full w-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            
            <div className="p-4 bg-neutral-950 border-t border-white/10">
              <p className="text-[9px] text-white font-sans tracking-[0.25em] uppercase">TRAILER CHÍNH THỨC</p>
              <h4 className="text-base font-serif text-white mt-1 italic">{movie.title}: {movie.englishTitle}</h4>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}

