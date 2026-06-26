import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Star, CheckCircle, Clock, Loader2, MoreVertical, ScanLine, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getStoredAuth } from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import { useMovies } from '../../stores/useMovieStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUiStore } from '../../stores/useUiStore';

export default function MyTicketsView() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const showToast = useUiStore((state) => state.showToast);
  const setShowOTP = useUiStore((state) => state.setShowOTP);
  const { publicCinema } = useMovies();
  const onSelectMovie = (id) => navigate(`/movies/${id}`);
  const onOpenOTP = () => setShowOTP(true);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedReviewMovie, setSelectedReviewMovie] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [realBookings, setRealBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState('');

  const loadBookings = () => {
    if (!isLoggedIn) return;
    const { accessToken } = getStoredAuth();
    if (!accessToken) return;
    setIsLoading(true);
    return bookingService.getMyBookings(accessToken)
      .then(data => setRealBookings(Array.isArray(data) ? data : []))
      .catch(() => setRealBookings([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [isLoggedIn]);

  const canCancelBooking = (booking) => {
    if (!['HOLDING', 'PENDING_PAYMENT'].includes(booking.status)) return false;
    if (!booking.holdExpiresAt) return true;
    return new Date(booking.holdExpiresAt).getTime() > Date.now();
  };

  const getBookingBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'ĐÃ THANH TOÁN';
      case 'USED':
        return 'ĐÃ SỬ DỤNG';
      case 'PENDING_PAYMENT':
        return 'CHỜ THANH TOÁN';
      case 'HOLDING':
        return 'ĐANG GIỮ';
      default:
        return status || 'KHÔNG RÕ';
    }
  };

  const getBookingBadgeColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20';
      case 'USED':
        return 'bg-neutral-900 text-neutral-400 border-neutral-700';
      case 'PENDING_PAYMENT':
        return 'bg-sky-950/25 text-sky-300 border-sky-500/20';
      case 'HOLDING':
        return 'bg-amber-950/20 text-amber-400 border-amber-500/20';
      case 'CANCELLED':
        return 'bg-rose-950/25 text-rose-300 border-rose-500/20';
      case 'EXPIRED':
        return 'bg-zinc-900 text-zinc-500 border-zinc-700';
      default:
        return 'bg-neutral-900 text-neutral-400 border-neutral-700';
    }
  };

  const getBookingHelperText = (booking) => {
    if (booking.status === 'PAID') return 'Sẵn sàng quét / Đưa mã cho nhân viên soát vé';
    if (booking.status === 'PENDING_PAYMENT') return 'Có thể hủy trước thanh toán hoặc tiếp tục thanh toán';
    if (booking.status === 'HOLDING') {
      return `Ghế giữ đến ${booking.holdExpiresAt ? new Date(booking.holdExpiresAt).toLocaleTimeString('vi-VN') : ''}`;
    }
    return 'Đã sử dụng';
  };

  const handleCancelBooking = async (booking) => {
    if (!booking?.bookingId || !canCancelBooking(booking)) return;
    const confirmed = window.confirm('Hủy booking này? Ghế đang giữ sẽ được giải phóng và vé đã thanh toán không thể hủy theo yêu cầu khách hàng.');
    if (!confirmed) return;

    const { accessToken } = getStoredAuth();
    if (!accessToken) {
      showToast('Vui lòng đăng nhập lại để hủy booking.', 4500, null, 'sad');
      return;
    }

    setCancellingBookingId(String(booking.bookingId));
    try {
      await bookingService.cancelBooking(accessToken, booking.bookingId);
      showToast('Đã hủy booking trước thanh toán và giải phóng ghế.');
      await loadBookings();
    } catch (error) {
      showToast(error.message || 'Không thể hủy booking này.', 4500, null, 'sad');
    } finally {
      setCancellingBookingId('');
    }
  };

  // Map BE booking sang display format
  const activeTickets = realBookings
    .filter(b => b.status === 'PAID' || b.status === 'USED' || b.status === 'HOLDING' || b.status === 'PENDING_PAYMENT')
    .map(b => ({
      bookingId: b.id,
      id: b.bookingCode || String(b.id),
      status: b.status,
      title: b.movieTitle || b.showtime?.movieTitle || 'Phim',
      englishTitle: b.bookingCode || '',
      time: b.showtimeStart ? new Date(b.showtimeStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
      date: b.showtimeStart ? new Date(b.showtimeStart).toLocaleDateString('vi-VN') : '—',
      room: b.roomName || b.showtime?.roomName || '—',
      location: b.cinemaName || publicCinema?.name || 'Rạp chưa được cấu hình',
      seats: b.seats?.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ') || '—',
      code: b.bookingCode || String(b.id),
      qrCode: b.qrCode || '',
      badge: getBookingBadge(b.status),
      badgeColor: getBookingBadgeColor(b.status),
      helperText: getBookingHelperText(b),
      holdExpiresAt: b.holdExpiresAt,
      canCancel: canCancelBooking(b),
      totalAmount: b.totalAmount,
      poster: b.posterUrl || b.moviePosterUrl || b.showtime?.posterUrl || b.showtime?.moviePosterUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10',
      isReal: true
    }));

  const displayTickets = activeTickets;

  const bookingHistory = realBookings.map((booking) => ({
    movie: booking.movieTitle || booking.showtime?.movieTitle || 'Phim',
    date: booking.showtimeStart ? new Date(booking.showtimeStart).toLocaleDateString('vi-VN') : '—',
    location: booking.cinemaName || publicCinema?.name || 'Rạp chưa được cấu hình',
    seats: booking.seats?.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ') || '—',
    status: booking.status || 'UNKNOWN',
    statusColor: getBookingBadgeColor(booking.status)
  }));

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewContent) return;

    showToast(`Cảm ơn đóng báo của bạn về phim ${selectedReviewMovie}!\nNhận xét đã được ghi nhận trên cổng phê bình Cinephile.`);
    setReviewsList([
      {
        id: Date.now(),
        movie: selectedReviewMovie,
        rating: reviewRating,
        content: reviewContent,
        date: 'Vừa xong'
      },
      ...reviewsList
    ]);
    setReviewContent('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">

      {!isLoggedIn && (
        <div className="border border-white/10 bg-[#0E0E0E] p-6 text-center space-y-4 max-w-sm mx-auto my-12" id="guest-tickets-gate">
          <Ticket className="h-10 w-10 text-white mx-auto animate-pulse" />
          <h3 className="text-base font-serif font-light italic text-white uppercase tracking-wider">CinePremier Vé Đặc Quyền</h3>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Vui lòng đăng nhập tài khoản Cinephile VIP để hiển thị thông tin vé, kiểm nghiệm mã vạch thông minh, và tiến hành rà soát lịch chiếu cá nhân.
          </p>
          <button
            onClick={onOpenOTP}
            className="border border-white bg-white hover:bg-black hover:text-white text-black px-6 py-2.5 text-xs font-sans font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {isLoggedIn && (
        <>
          {/* HEADER SECTION */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-3xl font-serif font-light text-white tracking-widest leading-none uppercase italic">
              Vé của tôi
            </h1>
            <p className="text-xs font-sans tracking-[0.2em] text-neutral-400 uppercase">
              Quản lý trải nghiệm điện ảnh cao cấp của bạn
            </p>
          </div>

          {/* SECTION: VÉ HIỆN TẠI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-white" />
                <span className="text-[10px] uppercase font-sans font-black tracking-widest text-neutral-400">
                  🎫 Vé của tôi {isLoggedIn && !isLoading && `(${activeTickets.length})`}
                </span>
              </div>
              {isLoading && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
            </div>

            {/* Dynamic / Styled tickets flex grid matching secondary screenshot */}
            <div className="grid grid-cols-1 gap-8" id="tickets-current-grid">
              {displayTickets.map((t) => (
                <div
                  key={t.id}
                  className="group border border-neutral-800 bg-gradient-to-br from-[#0e0e11] via-[#07070a] to-[#020203] hover:border-neutral-700/80 transition-all duration-300 flex flex-col md:flex-row relative overflow-hidden shadow-2xl rounded-sm md:min-h-[260px]"
                >

                  {/* Semicircle paper ticket notch punches for authentic cinema pass feel */}
                  <div className="absolute -top-3 right-[220px] w-6 h-6 bg-black border border-neutral-850 rounded-full translate-x-1/2 z-20 hidden md:block"></div>
                  <div className="absolute -bottom-3 right-[220px] w-6 h-6 bg-black border border-neutral-850 rounded-full translate-x-1/2 z-20 hidden md:block"></div>

                  {/* Vertical line indicator representing tear ticket area */}
                  <div className="absolute right-[220px] top-0 bottom-0 border-r border-dashed border-neutral-850 hidden md:block pointer-events-none z-10 w-0"></div>

                  {/* POSTER CARD LEFT COMPONENT - Compact Fixed width on desktop */}
                  <div className="w-full md:w-[190px] h-52 md:min-h-[260px] relative bg-neutral-950 flex-shrink-0 overflow-hidden">
                    <img
                      src={t.poster}
                      alt={t.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Tech Badge on poster */}
                    <div className="absolute left-2.5 top-2.5 bg-red-950/90 border border-red-500/50 text-[9px] font-black tracking-widest px-2 py-0.5 text-white/90 uppercase shadow-sm">
                      {t.badge}
                    </div>
                  </div>

                  {/* DETAILS CONTENT MIDDLE COMPONENT - Cozy spacing, fits perfectly without huge gaps */}
                  <div className="flex-1 p-4 md:py-3.5 md:px-4 flex flex-col justify-between min-w-0 md:h-full select-none">

                    {/* Upper texts: Movie title, subtitles, dates & times */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm sm:text-base font-serif font-black text-amber-50 tracking-wide uppercase italic leading-tight truncate max-w-[65%]">
                          {t.title}
                        </h3>
                        <span className="text-[10px] font-mono font-black text-yellow-400 bg-yellow-950/40 border border-yellow-500/20 px-2.5 py-0.5 shrink-0 rounded-sm shadow-sm tracking-wider">
                          {t.time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 tracking-wider">
                        <p className="truncate uppercase font-sans font-medium max-w-[60%]">{t.englishTitle}</p>
                        <p className="font-mono font-extrabold text-zinc-300 border-b border-white/5 pb-0.5 uppercase tracking-wide shrink-0">{t.date}</p>
                      </div>
                    </div>

                    {/* Grid stats layout - Clean, tight capsules aligning with division line */}
                    <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-900/60 py-2.5 my-1.5 font-sans">
                      {/* PHÒNG CHIẾU */}
                      <div className="min-w-0 pr-1">
                        <span className="block text-[8px] text-neutral-500 font-black uppercase tracking-widest mb-1">PHÒNG:</span>
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-white bg-neutral-900/60 border border-neutral-850 px-1.5 py-0.5 rounded-sm block truncate text-center font-mono">
                          {t.room}
                        </span>
                      </div>

                      {/* GHẾ */}
                      <div className="min-w-0 px-1">
                        <span className="block text-[8px] text-amber-500 font-extrabold uppercase tracking-widest mb-1 text-center font-mono">GHẾ VIP:</span>
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-400 bg-amber-950/15 border border-amber-500/20 px-1.5 py-0.5 rounded-sm block truncate text-center font-mono">
                          {t.seats}
                        </span>
                      </div>

                      {/* MÃ ĐẶT CHỖ */}
                      <div className="min-w-0 pl-2">
                        <span className="block text-[8px] text-neutral-500 font-black uppercase tracking-widest mb-1 text-center font-mono">MÃ SỐ VÉ:</span>
                        <span className="text-[10px] sm:text-[11px] font-mono font-extrabold text-white bg-neutral-900/60 border border-neutral-850 px-1.5 py-0.5 rounded-sm block truncate text-center select-all">
                          {t.code}
                        </span>
                      </div>
                    </div>

                    {/* Sub scanning prompt */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">

                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                          <ScanLine className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[8.5px] uppercase tracking-wide text-zinc-400 font-bold leading-tight truncate">
                            {t.helperText}
                          </p>
                          <span className="text-[7.5px] font-mono text-neutral-500 block leading-none truncate uppercase mt-0.5">
                            {t.location || 'CINEPREMIER VIP RẠP'}
                          </span>
                        </div>
                      </div>

                      {/* Context trigger option */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {t.canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(t)}
                            disabled={cancellingBookingId === String(t.bookingId)}
                            className="inline-flex items-center gap-1.5 border border-rose-500/30 bg-rose-950/20 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                            title="Hủy booking trước thanh toán"
                          >
                            {cancellingBookingId === String(t.bookingId) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            Hủy booking
                          </button>
                        )}
                        <button
                          onClick={() => showToast(`Mã rạp chiếu kĩ thuật số: ${t.code} đã được gửi lên hệ thống. Đưa mã này khi nhận vé bắp nước combo VIP.`)}
                          className="p-1.5 hover:bg-neutral-900 text-neutral-500 hover:text-white transition rounded-full shrink-0"
                          title="Chi tiết vé"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* REAL QR CODE FROM BACKEND */}
                  <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3 border-t border-dashed border-neutral-800 bg-black/35 p-5 md:w-[220px] md:border-l md:border-t-0">
                    {t.qrCode ? (
                      <>
                        <div className="bg-white p-3 shadow-[0_0_28px_rgba(255,255,255,0.16)]">
                          <QRCodeSVG
                            value={t.qrCode}
                            size={148}
                            level="M"
                            marginSize={1}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            title={`QR vé ${t.code}`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">QR Check-in thật</p>
                          <p className="mt-1 text-[8px] leading-relaxed text-neutral-500">Nhân viên quét mã để lấy thông tin vé</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 text-center text-neutral-600">
                        <ScanLine className="mx-auto h-12 w-12" />
                        <p className="text-[9px] font-black uppercase tracking-[0.18em]">QR được cấp sau thanh toán</p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* SECTION: LỊCH SỬ ĐẶT VÉ TABLE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Calendar className="h-4 w-4 text-white" />
              <span className="text-[10px] uppercase font-sans font-black tracking-widest text-neutral-400">
                ⏰ Lịch sử đặt vé
              </span>
            </div>

            {/* Responsive layout list or elegant table matching the layout */}
            <div className="overflow-x-auto border border-white/10 bg-[#050505] rounded-none">
              <table className="min-w-full divide-y divide-white/10 text-left font-sans text-xs">
                <thead className="bg-[#0B0B0B] text-[9px] uppercase tracking-[0.15em] text-neutral-500 font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-4">PHIM</th>
                    <th scope="col" className="px-6 py-4">NGÀY CHIẾU</th>
                    <th scope="col" className="px-6 py-4">ĐỊA ĐIỂM</th>
                    <th scope="col" className="px-6 py-4">SỐ GHẾ</th>
                    <th scope="col" className="px-6 py-4">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300 font-light">
                  {bookingHistory.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-serif italic text-white font-bold">{row.movie}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{row.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-neutral-400">{row.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{row.seats}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block border text-[8px] font-bold px-2 py-0.5 tracking-wider uppercase rounded-sm ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION: ĐÁNH GIÁ PHIM ĐÃ XEM FEEDBACK AREA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Star className="h-4 w-4 text-white" />
              <span className="text-[10px] uppercase font-sans font-black tracking-widest text-neutral-400">
                💬 Đánh giá phim đã xem
              </span>
            </div>

            {/* Dual card form split matches screenshot perfectly */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

              {/* Left watched indicator poster matching picture */}
              <div className="md:col-span-4 border border-white/10 bg-black p-5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-28 aspect-[3/4] overflow-hidden border border-white/5 bg-neutral-900 shadow-xl relative">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10"
                    alt="Oppenheimer"
                    className="w-full h-full object-cover grayscale"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold italic text-white uppercase tracking-wider">{selectedReviewMovie}</h4>
                  <p className="text-[9px] uppercase tracking-widest text-[#888888] font-sans">Đã xem ngày 12/09/2024</p>
                </div>

                {/* Simulated star ratings click selector */}
                <div className="flex space-x-1 justify-center">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReviewRating(st)}
                      className="text-white hover:scale-110 transition"
                    >
                      <Star className={`h-4.5 w-4.5 ${reviewRating >= st ? 'text-white fill-current' : 'text-neutral-800'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Text Feedback Area matches screenshot */}
              <div className="md:col-span-8 border border-white/10 bg-black p-5 space-y-4 text-left">
                <span className="text-[10px] uppercase font-sans font-bold tracking-[0.2em] text-neutral-400">
                  Chia sẻ cảm nghĩ của bạn
                </span>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans block">Chọn phim đã xem:</span>
                      <select
                        value={selectedReviewMovie}
                        onChange={(e) => setSelectedReviewMovie(e.target.value)}
                        className="w-full border border-white/10 bg-neutral-950 p-2 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-white rounded-none"
                      >
                        <option value="Oppenheimer">Oppenheimer (12/09/2024)</option>
                        <option value="Interstellar">Interstellar (28/08/2024)</option>
                        <option value="The Batman">The Batman (15/07/2024)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans block">Xếp hạng:</span>
                      <div className="flex items-center h-9 font-bold text-xs text-white font-mono bg-neutral-950 px-3 border border-white/10">
                        <span>ĐỘ HÀI LÒNG: {reviewRating}/5 SAO</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-sans block">Nội dung phê bình:</span>
                    <textarea
                      required
                      rows={4}
                      maxLength={300}
                      placeholder="Nhập nhận xét của bạn về bộ phim này..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full border border-white/10 bg-[#090909] p-3 text-xs text-white placeholder-neutral-700 font-sans focus:outline-none focus:border-white rounded-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-purple-900 duration-250 border border-purple-500/30 hover:bg-neutral-900 hover:text-white px-6 py-2.5 text-xs text-white font-sans font-bold tracking-widest uppercase transition rounded-none flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(270deg, #D4145A 0%, #FBB03B 100%)' }}
                    >
                      GỬI ĐÁNH GIÁ
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* User reviews state displays if submitted */}
            {reviewsList.length > 0 && (
              <div className="space-y-3 pt-3">
                <span className="text-[8px] tracking-wider text-neutral-500 font-sans block uppercase">ĐÁNH GIÁ VỪA KHAI THÁC CỦA BẠN:</span>
                <div className="space-y-3">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="border border-white/5 bg-[#0a0a0a] p-4 font-sans text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-serif italic text-white font-bold">{rev.movie}</span>
                        <span className="text-neutral-500 font-mono text-[9px]">{rev.date}</span>
                      </div>
                      <div className="flex space-x-0.5">
                        {Array.from({ length: 5 }, (_, idx) => (
                          <Star key={idx} className={`h-3 w-3 ${idx < rev.rating ? 'fill-current text-white' : 'text-neutral-800'}`} />
                        ))}
                      </div>
                      <p className="text-neutral-400 font-light leading-relaxed">"{rev.content}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}

