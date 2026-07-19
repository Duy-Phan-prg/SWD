import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Film, Filter, CalendarDays, X } from 'lucide-react';
import MovieCard from '@/components/common/MovieCard';
import { useMovies } from '../../stores/useMovieStore';

export default function ExploreView() {
  const navigate = useNavigate();
  const {
    moviesList = [],
    isMoviesLoading: isLoading = false,
    moviePagination: pagination = null,
    setMoviePagination,
    searchQuery = '',
    setSearchQuery,
    movieDateFilter: selectedDate = '',
    setMovieDateFilter,
    genres = [],
    selectedGenreId = '',
    setSelectedGenreId,
    watchlist = [],
    handleToggleWatchlist,
  } = useMovies();
  const onSearchChange = (q) => { setSearchQuery(q); setMoviePagination(prev => ({ ...prev, page: 0 })); };
  const onDateChange = (d) => { setMovieDateFilter(d); setMoviePagination(prev => ({ ...prev, page: 0 })); };
  const onPageChange = (page) => setMoviePagination(prev => ({ ...prev, page: page - 1 }));
  const onSelectMovie = (id) => navigate(`/movies/${id}`);
  const onBookMovie = (movie) => navigate(`/movies/${movie.id}/book`);
  const isMovieWatchlisted = (movie) => watchlist.some((item) => (
    String(item.backendId || item.movieId || item.id) === String(movie.backendId || movie.movieId || movie.id)
  ));
  const [sortBy, setSortBy] = useState('rating'); // rating, newest, duration
  const [localPage, setLocalPage] = useState(1);
  const itemsPerPage = 10; // keep in sync with useMovieStore moviePagination.size
  const currentPage = pagination ? (Number(pagination.page) || 0) + 1 : localPage;

  // Filter and sort logical step
  const processedMovies = useMemo(() => {
    let result = moviesList.filter((movie) => movie.status !== 'INACTIVE' && !movie.isInactive);

    // 1. Text Search Filter (null-guard: phim có thể thiếu englishTitle/director/genre)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.englishTitle || '').toLowerCase().includes(q) ||
          (m.director || '').toLowerCase().includes(q) ||
          (m.genre || []).some(g => String(g || '').toLowerCase().includes(q))
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        const aRating = a.ratings?.overall || 0;
        const bRating = b.ratings?.overall || 0;
        return bRating - aRating;
      }
      if (sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      if (sortBy === 'duration') {
        return b.duration - a.duration;
      }
      return 0;
    });

    return result;
  }, [searchQuery, sortBy, moviesList]);

  // Pagination logical step
  const totalPages = pagination?.totalPages || Math.max(1, Math.ceil(processedMovies.length / itemsPerPage));
  const currentMovies = useMemo(() => {
    if (pagination) return processedMovies;
    const start = (currentPage - 1) * itemsPerPage;
    return processedMovies.slice(start, start + itemsPerPage);
  }, [processedMovies, currentPage, pagination]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      if (pagination) {
        onPageChange(page);
      } else {
        setLocalPage(page);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10 pb-24">

      {/* Search Header Container */}
      <div className="space-y-4 border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3">
          <Film className="h-5 w-5 text-white" />
          <h1 className="text-3xl sm:text-5xl font-serif text-white uppercase tracking-wider font-light italic">
            CinePremier / Explore
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed max-w-2xl">
          Trải nghiệm vũ trụ điện ảnh với bộ lọc phim, lịch chiếu và gợi ý theo gu xem của bạn.
        </p>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-black border border-white/10 p-5 space-y-4">

        {/* Genre Tags Selector & Sort Selection */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Genre Chips list */}
          <div className="flex flex-wrap gap-2" id="genre-filter-chips">
            {[{ id: '', name: 'Tất cả' }, ...genres].map((genre) => (
              <button
                key={genre.id || 'all'}
                onClick={() => {
                  setSelectedGenreId(genre.id);
                  if (pagination) onPageChange(1);
                  setLocalPage(1);
                }}
                className={`px-4 py-2 text-[10px] uppercase font-sans tracking-[0.15em] transition-all duration-300 ${String(selectedGenreId) === String(genre.id)
                    ? 'bg-white text-black border border-white'
                    : 'bg-black text-neutral-400 border border-white/10 hover:text-white hover:border-white/30'
                  }`}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {/* Sort Selection dropdown */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <CalendarDays className="h-4 w-4 text-neutral-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border border-white/10 bg-black px-3 py-2 text-[10px] uppercase font-sans tracking-widest text-white focus:border-white focus:outline-none [color-scheme:dark]"
              aria-label="Chọn ngày chiếu"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => onDateChange('')}
                className="border border-white/10 bg-black p-2 text-neutral-400 transition hover:border-white/40 hover:text-white"
                title="Xóa lọc ngày"
                aria-label="Xóa lọc ngày"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-neutral-500">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-white/10 bg-black px-4 py-2 text-[10px] uppercase font-sans tracking-widest text-white focus:border-white focus:outline-none"
              id="sort-select"
            >
              <option value="rating">Điểm đánh giá</option>
              <option value="newest">Mới nhất</option>
              <option value="duration">Thời lượng</option>
            </select>
          </div>

        </div>

        {/* Dynamic Mobile Search Filter input bar in case they cannot access Header search */}
        <div className="relative block lg:hidden">
          <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="TÌM KIẾM TÁC PHẨM..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border border-white/10 bg-neutral-950 py-3 pl-10 pr-4 text-xs tracking-wider text-white uppercase placeholder-neutral-700 focus:border-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>{isLoading ? 'Đang tải phim từ hệ thống...' : `Tìm thấy ${pagination?.totalElements ?? processedMovies.length} phim`}</span>

            {/* Chip các bộ lọc đang bật — thấy ngay vì sao kết quả bị hẹp, bấm ✕ để bỏ từng lọc */}
            {(searchQuery.trim() || selectedDate || selectedGenreId) && (
              <span className="text-neutral-600">· Đang lọc:</span>
            )}
            {searchQuery.trim() && (
              <button
                onClick={() => onSearchChange('')}
                className="flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-sans font-bold normal-case tracking-normal text-amber-300 transition hover:bg-amber-500/25"
                title="Bỏ lọc từ khóa"
              >
                "{searchQuery.trim()}" <X className="h-3 w-3" />
              </button>
            )}
            {selectedDate && (
              <button
                onClick={() => onDateChange('')}
                className="flex items-center gap-1.5 border border-sky-500/40 bg-sky-500/10 px-2 py-1 font-sans font-bold text-sky-300 transition hover:bg-sky-500/25"
                title="Bỏ lọc ngày chiếu"
              >
                <CalendarDays className="h-3 w-3" /> {selectedDate.split('-').reverse().join('/')} <X className="h-3 w-3" />
              </button>
            )}
            {selectedGenreId && (
              <button
                onClick={() => { setSelectedGenreId(''); if (pagination) onPageChange(1); setLocalPage(1); }}
                className="flex items-center gap-1.5 border border-white/25 bg-white/5 px-2 py-1 font-sans font-bold text-neutral-200 transition hover:bg-white/15"
                title="Bỏ lọc thể loại"
              >
                {genres.find((g) => String(g.id) === String(selectedGenreId))?.name || 'Thể loại'} <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span>Trang {currentPage}/{totalPages}</span>
        </div>

      </div>

      {/* Grid movies or Blank fallback page */}
      {currentMovies.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" id="explore-movies-grid">
          {currentMovies.map((movie) => (
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
      ) : (
        <div className="border border-dashed border-white/10 bg-black p-16 text-center space-y-4">
          <Filter className="h-8 w-8 text-neutral-600 mx-auto" />
          <h3 className="text-base font-sans font-bold text-white">Không tìm thấy phim phù hợp</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto font-sans leading-relaxed">
            {selectedDate
              ? `Bộ lọc ngày ${selectedDate.split('-').reverse().join('/')} đang được áp dụng — thử bỏ lọc ngày hoặc đổi từ khóa khác.`
              : 'Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ phim đang chiếu.'}
          </p>
          <button
            onClick={() => {
              setSelectedGenreId('');
              onSearchChange('');
              onDateChange('');
              handlePageChange(1);
            }}
            className="border border-white bg-white text-black px-6 py-2.5 text-[10px] font-sans tracking-widest uppercase hover:bg-black hover:text-white transition"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-8" id="pagination">

          {/* Back button */}
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="border border-white/10 bg-black p-2.5 text-white hover:border-white disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Numeric buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => handlePageChange(pg)}
              className={`h-9 w-9 text-xs transition font-sans ${currentPage === pg
                  ? 'bg-white text-black font-bold border border-white'
                  : 'border border-white/10 bg-black text-neutral-400 hover:border-white hover:text-white'
                }`}
            >
              {pg}
            </button>
          ))}

          {/* Forward button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="border border-white/10 bg-black p-2.5 text-white hover:border-white disabled:opacity-30 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

        </div>
      )}

    </div>
  );
}
