import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Loader2, Search, Tag, Users, X } from 'lucide-react';
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

const AGE_RATING_OPTIONS = [
  { value: null, label: 'Mọi độ tuổi' },
  { value: 'P', label: 'P — Mọi độ tuổi' },
  { value: 'K', label: 'K — Trẻ em' },
  { value: 'T13', label: 'T13 — Từ 13+' },
  { value: 'T16', label: 'T16 — Từ 16+' },
  { value: 'T18', label: 'T18 — Từ 18+' },
  { value: 'C', label: 'C — Hạn chế' },
];

const AGE_RATING_COLOR = {
  P:   'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  K:   'border-sky-500/40 bg-sky-500/10 text-sky-400',
  T13: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  T16: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  T18: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  C:   'border-red-700/40 bg-red-900/20 text-red-400',
};
const getAgeColor = (rating) => AGE_RATING_COLOR[String(rating || '').toUpperCase()] || 'border-neutral-700 bg-neutral-900 text-neutral-400';

// ─── Dropdown thể loại ───────────────────────────────────────────────────────
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
          <X className="h-3.5 w-3.5 shrink-0 text-neutral-400 hover:text-white"
            onClick={(e) => { e.stopPropagation(); onChange(null); setSearch(''); }} />
        ) : (
          <svg className={`h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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
            >Tất cả thể loại</button>
            {genres.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-neutral-600">Chưa có dữ liệu thể loại</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-neutral-600">Không tìm thấy thể loại</p>
            ) : (
              filtered.map((g) => (
                <button
                  key={g}
                  onClick={() => { onChange(selectedGenre === g ? null : g); setOpen(false); setSearch(''); }}
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

// ─── Dropdown độ tuổi ────────────────────────────────────────────────────────
function AgeRatingDropdown({ selectedAge, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = AGE_RATING_OPTIONS.find((o) => o.value === selectedAge) || AGE_RATING_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 border bg-neutral-950 py-3 pl-10 pr-4 text-sm text-left transition
          ${open ? 'border-purple-400 ring-1 ring-purple-500/40' : 'border-white/10 hover:border-white/20'}`}
      >
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
        <span className={`flex-1 truncate ${selectedAge ? 'text-white' : 'text-neutral-500'}`}>
          {selectedAge ? selected.label : 'Độ tuổi'}
        </span>
        {selectedAge ? (
          <X className="h-3.5 w-3.5 shrink-0 text-neutral-400 hover:text-white"
            onClick={(e) => { e.stopPropagation(); onChange(null); }} />
        ) : (
          <svg className={`h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="max-h-64 overflow-y-auto">
            {AGE_RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value ?? '__all'}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition
                  ${selectedAge === opt.value
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>{opt.label}</span>
                {opt.value && (
                  <span className={`border px-1.5 py-0.5 text-[8px] font-black ${getAgeColor(opt.value)}`}>
                    {opt.value}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────────────────────────────
export default function ShowtimesPage() {
  const navigate = useNavigate();
  const { moviesList = [], fetchMoviesPage, isMoviesLoading } = useMovies();

  const [keyword, setKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);

  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suất chiếu khi ngày thay đổi
  useEffect(() => {
    let cancelled = false;

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
        try { await fetchShowtimesForDate(dateKey); } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-fetch movies nếu store chưa có dữ liệu (để lấy poster, duration)
  useEffect(() => {
    if (moviesList.length === 0) {
      fetchMoviesPage({ isExplorePage: false }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build lookup maps để join showtime với movie — chỉ dùng cho poster/duration
  const movieLookupById = useMemo(() => {
    const map = new Map();
    moviesList.forEach((m) => {
      const bid = String(m.backendId ?? m.id ?? '');
      if (bid) map.set(bid, m);
    });
    return map;
  }, [moviesList]);

  const movieLookupByTitle = useMemo(() => {
    const map = new Map();
    moviesList.forEach((m) => {
      const t = String(m.title || m.englishTitle || '').toLowerCase().trim();
      if (t) map.set(t, m);
    });
    return map;
  }, [moviesList]);

  // Tổng hợp genres từ showtimes (đã có trong response từ BE)
  const genreOptions = useMemo(() => {
    const set = new Set();
    showtimes.forEach((st) => {
      if (Array.isArray(st.movieGenreNames)) {
        st.movieGenreNames.forEach((g) => {
          if (g && g.trim()) set.add(g.trim().toUpperCase());
        });
      }
    });
    // Fallback: also pull from moviesList store if showtimes don't have genre data yet
    if (set.size === 0) {
      moviesList.forEach((m) => {
        const gList = Array.isArray(m.genre) ? m.genre : [];
        gList.forEach((g) => {
          const name = (typeof g === 'string' ? g : g?.name || '').trim();
          if (name && name !== 'Dang cap nhat') set.add(name.toUpperCase());
        });
      });
    }
    return [...set].sort();
  }, [showtimes, moviesList]);

  const movieGroups = useMemo(() => {
    const groups = new Map();
    showtimes.forEach((st) => {
      if (!groups.has(st.movieId))
        groups.set(st.movieId, {
          movieId: st.movieId,
          movieTitle: st.movieTitle,
          // genre & ageRating come directly from ShowtimeResponse (BE-side)
          ageRating: st.movieAgeRating || null,
          movieGenres: Array.isArray(st.movieGenreNames)
            ? st.movieGenreNames.filter(Boolean)
            : [],
          slots: [],
        });
      groups.get(st.movieId).slots.push(st);
    });

    const allGroups = [...groups.values()].map((group) => {
      // Join with store only to get poster & duration
      const movie = movieLookupById.get(String(group.movieId))
        || movieLookupByTitle.get(String(group.movieTitle || '').toLowerCase().trim());

      return {
        ...group,
        routeId: movie?.backendId ?? movie?.id ?? group.movieId,
        poster: movie?.posterUrl,
        duration: movie?.durationMinutes || movie?.duration,
        movieFound: Boolean(movie),
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
    if (selectedAge) {
      filtered = filtered.filter((g) =>
        String(g.ageRating || '').toUpperCase() === selectedAge.toUpperCase()
      );
    }

    return filtered;
  }, [showtimes, movieLookupById, movieLookupByTitle, keyword, selectedGenre, selectedAge]);

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const hasActiveFilters = keyword.trim() || selectedGenre || selectedAge;

  const clearAllFilters = () => { setKeyword(''); setSelectedGenre(null); setSelectedAge(null); };

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
          Lọc theo tên phim, thể loại, độ tuổi hoặc chọn ngày — suất chiếu hiển thị ngay bên dưới.
        </p>
      </div>

      {/* ── 4 filter cùng 1 hàng ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          {keyword && (
            <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-neutral-500 hover:text-white" />
            </button>
          )}
        </div>

        {/* 2. Lọc thể loại */}
        <GenreDropdown genres={genreOptions} selectedGenre={selectedGenre} onChange={setSelectedGenre} />

        {/* 3. Lọc độ tuổi */}
        <AgeRatingDropdown selectedAge={selectedAge} onChange={setSelectedAge} />

        {/* 4. Chọn ngày chiếu */}
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

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Bộ lọc:</span>
          {keyword && (
            <span className="flex items-center gap-1 border border-purple-500/30 bg-purple-950/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-400">
              🔍 {keyword}
              <button onClick={() => setKeyword('')}><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {selectedGenre && (
            <span className="flex items-center gap-1 border border-purple-500/30 bg-purple-950/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-400">
              🎭 {selectedGenre}
              <button onClick={() => setSelectedGenre(null)}><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {selectedAge && (
            <span className={`flex items-center gap-1 border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${getAgeColor(selectedAge)}`}>
              👤 {selectedAge}
              <button onClick={() => setSelectedAge(null)}><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          <button onClick={clearAllFilters} className="ml-1 text-[9px] font-bold uppercase tracking-widest text-neutral-500 underline underline-offset-2 hover:text-white transition">
            Xoá tất cả
          </button>
        </div>
      )}

      {/* Hint khi moviesList đang fetch để lọc genre/ageRating */}
      {isMoviesLoading && moviesList.length === 0 && (
        <div className="flex items-center gap-2 border border-white/5 bg-neutral-950/60 px-4 py-2.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Đang tải thông tin phim — bộ lọc thể loại &amp; độ tuổi sẽ sẵn sàng ngay…
          </span>
        </div>
      )}

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
            {hasActiveFilters ? 'Không tìm thấy phim phù hợp với bộ lọc' : 'Chưa có suất chiếu nào trong ngày này'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-3 text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-widest font-bold underline underline-offset-2"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {movieGroups.map((group) => (
            <div key={group.movieId} className="border border-white/10 bg-neutral-950 overflow-hidden">
              {/* Movie header */}
              <div className="flex items-start gap-4 p-4">
                {/* Poster */}
                {group.poster ? (
                  <img
                    src={group.poster}
                    alt={group.movieTitle}
                    className="h-28 w-[72px] shrink-0 border border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-28 w-[72px] shrink-0 border border-white/10 bg-neutral-900 flex items-center justify-center">
                    <span className="text-neutral-700 text-[8px] font-bold uppercase">No poster</span>
                  </div>
                )}

                {/* Movie info */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="text-base font-sans font-black uppercase tracking-wide text-white leading-tight">
                      {group.movieTitle}
                    </h3>
                    {group.ageRating && (
                      <span className={`mt-0.5 shrink-0 border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getAgeColor(group.ageRating)}`}>
                        {group.ageRating}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    {group.duration ? `${group.duration} phút` : ''}
                    {group.duration && group.slots.length ? ' · ' : ''}
                    {group.slots.length} suất chiếu
                  </p>

                  {group.movieGenres.length > 0 && group.movieGenres[0] !== 'Dang cap nhat' && (
                    <div className="mt-2 flex flex-wrap gap-1">
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
              </div>

              {/* Showtime slots — always visible */}
              <div className="border-t border-white/5 bg-black/40 px-4 py-3">
                <p className="mb-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-neutral-600">
                  <Clock className="inline h-2.5 w-2.5 mr-1 -mt-px" />
                  Suất chiếu — {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.slots.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => navigate(`/movies/${group.routeId}/book?showtimeId=${st.id}`)}
                      className="group flex flex-col border border-white/15 bg-black px-4 py-2.5 transition hover:border-purple-400 hover:bg-purple-500/10 active:scale-95"
                      title={`${st.roomName} · Đặt vé cho suất này`}
                    >
                      <span className="flex items-center gap-1.5 font-mono text-sm font-black text-white group-hover:text-purple-300 transition">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatTime(st.startTime)}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-purple-400/70 transition">
                        {st.roomName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
