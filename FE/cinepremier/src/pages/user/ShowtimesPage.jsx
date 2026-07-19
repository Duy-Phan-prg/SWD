import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, Clock, Loader2, MapPin } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { useMovies } from '../../stores/useMovieStore';

const toDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Cache lịch chiếu theo ngày — TTL ngắn vì suất chiếu nhạy cảm thời gian.
// Lưu danh sách thô; lọc trạng thái + giờ bắt đầu được áp lại mỗi lần đọc.
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

// Trang "Lịch chiếu": chọn rạp + ngày trước, xổ phim và giờ chiếu, chọn phim cuối cùng
export default function ShowtimesPage() {
  const navigate = useNavigate();
  const { moviesList = [], publicCinema, fetchPublicCinema } = useMovies();

  const dateOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      key: toDateKey(date),
      dayLabel: i === 0 ? 'Hôm nay' : DAY_LABELS[date.getDay()],
      dateLabel: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    };
  }), []);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0].key);
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMovieId, setExpandedMovieId] = useState(null);

  useEffect(() => {
    if (!publicCinema) fetchPublicCinema?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setExpandedMovieId(null);

    const cached = getFreshShowtimes(selectedDate);
    if (cached) {
      // Cache hit — hiển thị ngay, lọc lại theo giờ hiện tại
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

  // Prefetch nền các ngày còn lại để bấm tab là hiện ngay
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const option of dateOptions) {
        if (cancelled) return;
        try { await fetchShowtimesForDate(option.key); } catch { /* bỏ qua lỗi prefetch */ }
      }
    })();
    return () => { cancelled = true; };
  }, [dateOptions]);

  // Gom suất chiếu theo phim, join poster/thông tin từ store phim
  const movieGroups = useMemo(() => {
    const groups = new Map();
    showtimes.forEach((st) => {
      if (!groups.has(st.movieId)) groups.set(st.movieId, { movieId: st.movieId, movieTitle: st.movieTitle, slots: [] });
      groups.get(st.movieId).slots.push(st);
    });
    return [...groups.values()].map((group) => {
      const movie = moviesList.find((m) => String(m.backendId || m.id) === String(group.movieId));
      return {
        ...group,
        routeId: movie?.id || group.movieId,
        poster: movie?.posterUrl,
        duration: movie?.durationMinutes || movie?.duration,
        ageRating: movie?.ageRating,
        slots: group.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      };
    }).sort((a, b) => String(a.movieTitle).localeCompare(String(b.movieTitle), 'vi'));
  }, [showtimes, moviesList]);

  const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-purple-400">Tìm suất chiếu theo ngày</p>
        <h1 className="mt-1 text-2xl font-sans font-black uppercase tracking-wide text-white">Lịch Chiếu Phim</h1>
        <p className="mt-1 text-xs text-neutral-500">Chọn rạp và ngày trước — bấm vào phim để xổ ra khung giờ chiếu.</p>
      </div>

      {/* Chọn rạp (hiện hệ thống có một rạp) */}
      <div className="flex items-center gap-3 border border-white/10 bg-neutral-950 px-4 py-3">
        <MapPin className="h-4 w-4 shrink-0 text-purple-400" />
        <span className="w-full text-xs font-bold uppercase tracking-wider text-white">
          {publicCinema?.name || 'CinePremier'} — {publicCinema?.address || publicCinema?.city || 'Rạp chính'}
        </span>
      </div>

      {/* Dải chọn ngày 7 ngày tới */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dateOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setSelectedDate(option.key)}
            className={`flex shrink-0 flex-col items-center border px-4 py-2.5 transition ${
              selectedDate === option.key
                ? 'border-purple-400 bg-purple-500/15 text-white'
                : 'border-white/10 bg-neutral-950 text-neutral-400 hover:border-white/30 hover:text-white'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest">{option.dayLabel}</span>
            <span className="mt-0.5 font-mono text-sm font-black">{option.dateLabel}</span>
          </button>
        ))}
      </div>

      {/* Danh sách phim có suất trong ngày */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 border border-white/10 bg-neutral-950 py-16 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Đang tải lịch chiếu…</span>
        </div>
      ) : movieGroups.length === 0 ? (
        <div className="border border-dashed border-white/10 bg-neutral-950 py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-neutral-700" />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-neutral-500">Chưa có suất chiếu nào trong ngày này</p>
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
                    <img src={group.poster} alt={group.movieTitle} className="h-20 w-14 shrink-0 border border-white/10 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-20 w-14 shrink-0 border border-white/10 bg-neutral-900" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-sans font-black uppercase tracking-wide text-white">{group.movieTitle}</h3>
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      {group.ageRating ? `${group.ageRating} · ` : ''}{group.duration ? `${group.duration} phút · ` : ''}{group.slots.length} suất chiếu
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">{st.roomName}</span>
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
