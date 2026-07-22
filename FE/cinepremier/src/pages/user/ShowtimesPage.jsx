import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, Clock, Loader2, Search, Tag, X } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useMovies } from '../../stores/useMovieStore';

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const SHOWTIME_CACHE_TTL_MS = 90 * 1000;
const showtimeCacheByDate = new Map();

const getFreshShowtimes = (dateKey) => {
  const entry = showtimeCacheByDate.get(dateKey);
  if (!entry) return null;
  return Date.now() - entry.updatedAt < SHOWTIME_CACHE_TTL_MS ? entry.data : null;
};

const filterVisibleShowtimes = (rawList) => rawList.filter((st) =>
  (st.status === 'OPEN' || st.status === 'SCHEDULED')
  && new Date(st.startTime) > new Date()
);

const fetchShowtimesForDate = async (dateKey) => {
  const cached = getFreshShowtimes(dateKey);
  if (cached) return cached;
  const data = await bookingService.getShowtimes({ date: dateKey, size: 100 });
  const rawList = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
  showtimeCacheByDate.set(dateKey, { data: rawList, updatedAt: Date.now() });
  return rawList;
};

const today = new Date();
const todayKey = toDateKey(today);

const PREFETCH_DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return toDateKey(d);
});

// ─── Dropdown tìm kiếm thể loại ─────────────────────────────────────────────
function GenreDropdown({ genres, selectedGenre, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return genres;
    const q = search.trim().toLowerCase();
    return genres.filter((g) => g.toLowerCase().includes(q));
  }, [genres, search]);

  const handleSelect = (g) => {
    onChange(selectedGenre === g ? null : g);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 border bg-neutral-950 py-3 pl-10 pr-4 text-sm text-left transition
          ${open ? 'border-purple-400 ring-1 ring-purple-500/40' : 'border-white/10 hover:border-white/20'}`}
      >
        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
        <span className={`flex-1 truncate ${selectedGenre ? 'text-white' : 'text-neutral-500'}`}>
          {selectedGenre || 'Thể loại'}
        </span>
        {selectedGenre ? (
          <X
            className="h-3.5 w-3.5 shrink-0 text-neutral-400 hover:text-white"
            onClick={(e) => { e.stopPropagation(); onChange(null); setSearch(''); }}
          />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="relative border-b border-white/10">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thể loại…"
              className="w-full bg-transparent py-2.5 pl-9 pr-4 text-xs text-white placeholder-neutral-600 outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
              className={`flex w-full items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition
                ${!selectedGenre ? 'bg-purple-500/15 text-purple-300' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              Tất cả thể loại
            </button>
            {genres.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-neutral-600">Chưa có dữ liệu thể loại</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-neutral-600">Không tìm thấy thể loại</p>
            ) : (
              filtered.map((g) => (
                <button
                  key={g}
                  onClick={() => handleSelect(g)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition
                    ${selectedGenre === g ? 'bg-purple-500/15 text-purple-300' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>{g}</span>
                  {selectedGenre === g && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────────────────────────────
export default function ShowtimesPage() {
  const navigate = useNavigate();
  const { moviesList = [] } = useMovies();

  const [keyword, setKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedGenre, setSelectedGenre] = useState(null);

  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMovieId, setExpandedMovieId] = useState(null);

  // Fetch suất chiếu khi ngày thay đổi
  useEffect(() => {
    let cancelled = false;
    setExpandedMovieId(null);

    const cached = getFreshShowtimes(selectedDate);
    if (cached) {
      setShowtimes(filterVisibleShowtimes(cached));
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    setIsLoading(true);
    fetchShowtimesForDate(selectedDate)
      .then((rawList) => { if (!cancelled) setShowtimes(filterVisibleShowtimes(rawList)); })
      .catch(() => { if (!cancelled) setShowtimes([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Prefetch nền 7 ngày tới
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const dateKey of PREFETCH_DATES) {
        if (cancelled) return;
        try { await fetchShowtimesForDate(dateKey); } catch { /* bỏ qua */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Tổng hợp genres từ moviesList — movie.genre là array of strings sau normalize
  const genreOptions = useMemo(() => {
    const set = new Set();
    moviesList.forEach((m) => {
      const gList = Array.isArray(m.genre) ? m.genre : [];
      gList.forEach((g) => {
        const name = (typeof g === 'string' ? g : g?.name || '').trim();
        if (name && name !== 'Dang cap nhat') set.add(name.toUpperCase());
      });
    });
    return [...set].sort();
  }, [moviesList]);

  const movieGroups = useMemo(() => {
    const groups = new Map();
    showtimes.forEach((st) => {
      if (!groups.has(st.movieId))
        groups.set(st.movieId, { movieId: st.movieId, movieTitle: st.movieTitle, slots: [] });
      groups.get(st.movieId).slots.push(st);
    });

    const allGroups = [...groups.values()].map((group) => {
      const movie = moviesList.find((m) => String(m.backendId || m.id) === String(group.movieId))
        || moviesList.find((m) => String(m.title || m.englishTitle || '').toLowerCase() === String(group.movieTitle || '').toLowerCase());
      const routeId = movie?.backendId ?? movie?.id ?? group.movieId;
      const movieGenreStrings = Array.isArray(movie?.genre) ? movie.genre : [];
      return {
        ...group,
        routeId,
        poster: movie?.posterUrl,
        duration: movie?.durationMinutes || movie?.duration,
        ageRating: movie?.ageRating,
        movieGenres: movieGenreStrings,
        slots: group.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      };
    }).sort((a, b) => String(a.movieTitle).localeCompare(String(b.movieTitle), 'vi'));

    let filtered = allGroups;
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((g) => g.movieTitle?.toLowerCase().includes(kw));
    }
    if (selectedGenre) {
      filtered = filtered.filter((g) =>
        g.movieGenres.some((genre) => genre.toUpperCase() === selectedGenre.toUpperCase())
      );
    }

    return filtered;
  }, [showtimes, moviesList, keyword, selectedGenre]);

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const hasActiveFilters = keyword.trim() || selectedGenre;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {/* Tiêu đề */}
      <div>
        <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-purple-400">
          Tìm suất chiếu
        </p>
        <h1 className="mt-1 text-2xl font-sans font-black uppercase tracking-wide text-white">
          THEO MONG MUỐN CỦA BẠN
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Lọc theo tên phim, thể loại hoặc chọn ngày — bấm vào phim để xổ ra khung giờ chiếu.
        </p>
      </div>

      {/* ── 3 filter cùng 1 hàng ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* 1. Tìm theo tên phim */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên phim…"
            className="w-full border border-white/10 bg-neutral-950 py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-500
                       outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40"
          />
        </div>

        {/* 2. Lọc theo thể loại (dropdown có tìm kiếm) */}
        <GenreDropdown
          genres={genreOptions}
          selectedGenre={selectedGenre}
          onChange={setSelectedGenre}
        />

        {/* 3. Chọn ngày chiếu */}
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
          <input
            type="date"
            value={selectedDate}
            min={todayKey}
            onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
            className="w-full border border-white/10 bg-neutral-950 py-3 pl-10 pr-4 text-sm text-white
                       outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40
                       [color-scheme:dark]"
          />
        </div>
      </div>

      {/* ── Danh sách phim ── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border border-white/10 bg-neutral-950 py-16 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Đang tải lịch chiếu…</span>
        </div>
      ) : movieGroups.length === 0 ? (
        <div className="border border-dashed border-white/10 bg-neutral-950 py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-neutral-700" />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
            {hasActiveFilters
              ? 'Không tìm thấy phim phù hợp với bộ lọc'
              : 'Chưa có suất chiếu nào trong ngày này'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setKeyword(''); setSelectedGenre(null); }}
              className="mt-3 text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-widest font-bold underline underline-offset-2"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {movieGroups.map((group) => {
            const isExpanded = String(expandedMovieId) === String(group.movieId);
            return (
              <div key={group.movieId} className="border border-white/10 bg-neutral-950">
                <button
                  onClick={() => setExpandedMovieId(isExpanded ? null : group.movieId)}
                  className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/5"
                >
                  {group.poster ? (
                    <img
                      src={group.poster}
                      alt={group.movieTitle}
                      className="h-20 w-14 shrink-0 border border-white/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-20 w-14 shrink-0 border border-white/10 bg-neutral-900" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-sans font-black uppercase tracking-wide text-white">
                      {group.movieTitle}
                    </h3>
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      {group.ageRating ? `${group.ageRating} · ` : ''}
                      {group.duration ? `${group.duration} phút · ` : ''}
                      {group.slots.length} suất chiếu
                    </p>
                    {group.movieGenres.length > 0 && group.movieGenres[0] !== 'Dang cap nhat' && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {group.movieGenres.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="border border-purple-500/30 bg-purple-950/30 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-purple-400"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => navigate(`/movies/${group.routeId}/book?showtimeId=${st.id}`)}
                          className="group flex flex-col border border-white/15 bg-black px-4 py-2 transition hover:border-purple-400 hover:bg-purple-500/10"
                          title={`${st.roomName} · Vào đặt vé với suất này`}
                        >
                          <span className="flex items-center gap-1.5 font-mono text-sm font-black text-white group-hover:text-purple-300">
                            <Clock className="h-3 w-3" /> {formatTime(st.startTime)}
                          </span>
                          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                            {st.roomName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
