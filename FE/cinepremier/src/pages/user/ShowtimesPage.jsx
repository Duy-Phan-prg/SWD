import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Loader2, Search } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useMovies } from '../../stores/useMovieStore';

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Cache lịch chiếu theo ngày — TTL ngắn vì suất chiếu nhạy cảm thời gian.
const SHOWTIME_CACHE_TTL_MS = 90 * 1000;
const showtimeCacheByDate = new Map(); // dateKey -> { data, updatedAt }

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

// ─── Tiện ích ngày ──────────────────────────────────────────────
const today = new Date();
const todayKey = toDateKey(today);

// Tạo dải 7 ngày tới (dùng cho prefetch nền)
const PREFETCH_DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return toDateKey(d);
});

/**
 * Trang Lịch Chiếu: tìm theo tên phim và/hoặc ngày chiếu.
 * Các ngày được prefetch ngầm; cache TTL 90 giây.
 * Bấm vào giờ chiếu chuyển thẳng sang trang đặt vé với showtimeId được chọn sẵn.
 */
export default function ShowtimesPage() {
  const navigate = useNavigate();
  const { moviesList = [] } = useMovies();

  // ── State bộ lọc ──────────────────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // ── State dữ liệu ─────────────────────────────────────────────
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

  // Gom suất chiếu theo phim, join thông tin từ store, lọc theo keyword
  const movieGroups = useMemo(() => {
    const groups = new Map();
    showtimes.forEach((st) => {
      if (!groups.has(st.movieId))
        groups.set(st.movieId, { movieId: st.movieId, movieTitle: st.movieTitle, slots: [] });
      groups.get(st.movieId).slots.push(st);
    });

    const allGroups = [...groups.values()].map((group) => {
      // Ưu tiên match theo backendId/id, fallback theo tiêu đề phim
      const movie = moviesList.find((m) => String(m.backendId || m.id) === String(group.movieId))
        || moviesList.find((m) => String(m.title || m.englishTitle || '').toLowerCase() === String(group.movieTitle || '').toLowerCase());
      // routeId: ưu tiên backendId (BE id) để BookingPage tìm được bằng m.backendId
      const routeId = movie?.backendId ?? movie?.id ?? group.movieId;
      return {
        ...group,
        routeId,
        poster: movie?.posterUrl,
        duration: movie?.durationMinutes || movie?.duration,
        ageRating: movie?.ageRating,
        slots: group.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      };
    }).sort((a, b) => String(a.movieTitle).localeCompare(String(b.movieTitle), 'vi'));

    // Lọc theo keyword tên phim
    if (!keyword.trim()) return allGroups;
    const kw = keyword.trim().toLowerCase();
    return allGroups.filter((g) => g.movieTitle?.toLowerCase().includes(kw));
  }, [showtimes, moviesList, keyword]);

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // ── Render ────────────────────────────────────────────────────
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
          Nhập tên phim hoặc chọn ngày — bấm vào phim để xổ ra khung giờ chiếu.
        </p>
      </div>

      {/* ── Bộ lọc tìm kiếm ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Ô tìm kiếm theo tên phim */}
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

        {/* Ô chọn ngày chiếu */}
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
          <input
            type="date"
            value={selectedDate}
            min={todayKey}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="w-full border border-white/10 bg-neutral-950 py-3 pl-10 pr-4 text-sm text-white
                       outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40
                       [color-scheme:dark]"
          />
        </div>
      </div>

      {/* ── Danh sách phim có suất trong ngày đã chọn ── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border border-white/10 bg-neutral-950 py-16 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Đang tải lịch chiếu…</span>
        </div>
      ) : movieGroups.length === 0 ? (
        <div className="border border-dashed border-white/10 bg-neutral-950 py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-neutral-700" />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
            {keyword.trim()
              ? 'Không tìm thấy phim phù hợp trong ngày này'
              : 'Chưa có suất chiếu nào trong ngày này'}
          </p>
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
