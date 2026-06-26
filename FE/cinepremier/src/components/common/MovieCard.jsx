import React from 'react';
import { Calendar, Heart, Play } from 'lucide-react';

export default function MovieCard({ movie, onSelect, onBook, isWatchlisted = false, onToggleWatchlist }) {
  const isBookable = movie.status === 'NOW_SHOWING' || (!movie.status && !movie.isUpcoming);
  const isUpcoming = movie.status === 'UPCOMING' || movie.isUpcoming;

  const getAgeRatingColor = (rating) => {
    switch (rating) {
      case 'T18': return 'border-red-500/50 text-red-400 bg-red-950/20';
      case 'T16': return 'border-amber-500/50 text-amber-400 bg-amber-950/20';
      case 'T13': return 'border-yellow-500/50 text-yellow-500 bg-yellow-950/20';
      default: return 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20';
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-black border-2 border-purple-500/30 rounded-none transition-all duration-300 hover:border-purple-400/60"
      id={`movie-${movie.id}`}
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950 rounded-none">
        <img
          src={movie.posterUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10'}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10';
          }}
        />

        {/* Rating Badge */}
        {isBookable && (
          <div className="absolute left-3 top-3 flex items-center space-x-1.5 bg-black border border-white/20 px-2 py-1 text-[10px] font-sans tracking-[0.1em] uppercase text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>{movie.ratings?.overall || '--'} Rating</span>
          </div>
        )}

        {/* Action Controls on Hover */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(movie.id);
            }}
            className="mb-2 flex w-full items-center justify-center space-x-2 border border-white bg-black py-2.5 text-xs font-sans uppercase tracking-[0.15em] text-white hover:bg-white hover:text-black transition-all duration-200"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Chi Tiết Phim</span>
          </button>
          
          <div className="flex items-stretch gap-2">
            {isBookable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBook(movie);
                }}
                className="flex min-w-0 flex-1 items-center justify-center space-x-2 border border-white bg-white py-2.5 text-xs font-sans uppercase tracking-[0.15em] text-black hover:bg-black hover:text-white transition-all duration-200"
              >
                Đặt Vé Ngay
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 items-center justify-center border border-white/20 bg-neutral-900 px-4 py-2 text-center text-xs uppercase tracking-[0.1em] text-white font-sans">
                Sắp Ra Mắt
              </div>
            )}

            {onToggleWatchlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(movie);
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center border transition-all duration-200 ${
                  isWatchlisted
                    ? 'border-rose-400/70 bg-rose-500 text-white'
                    : 'border-white/20 bg-black/85 text-white hover:border-white hover:bg-white hover:text-black'
                }`}
                title={isWatchlisted ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                aria-label={isWatchlisted ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
              >
                <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Age Rating tag */}
        <div className={`absolute right-3 top-3 border px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded-none ${getAgeRatingColor(movie.ageRating)}`}>
          {movie.ageRating}
        </div>

        {/* Upcoming date ribbon */}
        {isUpcoming && movie.upcomingDate && (
          <div className="absolute left-3 top-3 flex items-center space-x-1.5 bg-white border border-black/10 px-2 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
            <Calendar className="h-3 w-3" />
            <span>{movie.upcomingDate}</span>
          </div>
        )}
      </div>

      {/* Content description Box */}
      <div className="flex flex-1 flex-col p-4 justify-between bg-[#0A0A0A]">
        <div>
          <h3 
            onClick={() => onSelect(movie.id)}
            className="cursor-pointer text-base font-serif text-white hover:text-zinc-300 transition-colors line-clamp-1 italic"
          >
            {movie.title}
          </h3>
          <p className="mt-1 text-[10px] font-sans text-neutral-300 font-bold uppercase tracking-[0.15em] truncate">
            {movie.englishTitle}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          {/* Genre elements */}
          <div className="flex flex-wrap gap-1">
            {movie.genre.slice(0, 2).map((g) => (
              <span key={g} className="border border-white/10 px-2 py-0.5 text-[9px] text-neutral-400 font-sans tracking-wide">
                {g}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-neutral-500 font-sans tracking-tight">
            {movie.duration} min
          </span>
        </div>
      </div>
    </div>
  );
}

