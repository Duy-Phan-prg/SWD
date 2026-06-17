import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LogOut,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { authApi, getStoredAuth } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN');
};

const formatSeats = (booking) => {
  const seats = booking?.seats || [];
  if (!seats.length) return 'Chưa có ghế';
  return seats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ');
};

const getBookingStatusMeta = (status = '') => {
  const normalized = String(status).toUpperCase();
  if (normalized === 'PAID') {
    return {
      label: 'Sẵn sàng check-in',
      className: 'border-amber-300 bg-amber-50 text-amber-700',
    };
  }
  if (normalized === 'USED') {
    return {
      label: 'Đã check-in',
      className: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    };
  }
  return {
    label: normalized || 'Không hợp lệ',
    className: 'border-rose-300 bg-rose-50 text-rose-700',
  };
};

function StatusBadge({ status }) {
  const meta = getBookingStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-center">
        <ShieldCheck className="h-10 w-10 text-emerald-200" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Chưa có kết quả</p>
        <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">Nhập mã QR hoặc mã booking để hệ thống kiểm tra dữ liệu thật từ backend.</p>
      </div>
    );
  }

  const Icon = result.type === 'success' ? CheckCircle2 : result.type === 'warning' ? AlertCircle : XCircle;
  const color = result.type === 'success' ? 'text-emerald-600' : result.type === 'warning' ? 'text-amber-600' : 'text-rose-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">{result.title}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-500">{result.message}</p>
        </div>
      </div>

      {result.booking && (
        <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-black text-slate-900">{result.booking.bookingCode}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Booking #{result.booking.id}</p>
            </div>
            <StatusBadge status={result.booking.status} />
          </div>
          <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
            <div><span className="font-black text-slate-900">Phim:</span> {result.booking.movieTitle}</div>
            <div><span className="font-black text-slate-900">Phòng:</span> {result.booking.roomName}</div>
            <div><span className="font-black text-slate-900">Suất:</span> {formatDateTime(result.booking.showtimeStart)}</div>
            <div><span className="font-black text-slate-900">Ghế:</span> {formatSeats(result.booking)}</div>
            <div><span className="font-black text-slate-900">Tổng tiền:</span> {Number(result.booking.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
            <div><span className="font-black text-slate-900">Check-in:</span> {formatDateTime(result.booking.checkedInAt)}</div>
          </div>
        </div>
      )}

      {result.type === 'success' && (
        <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-widest text-black transition hover:bg-emerald-300">
          <Printer className="h-3.5 w-3.5" /> In vé vào cửa
        </button>
      )}
    </motion.div>
  );
}

export default function StaffCheckInPage() {
  const navigate = useNavigate();
  const { currentUser, handleLogout } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [result, setResult] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showtimeId, setShowtimeId] = useState('');
  const [isLoadingShowtime, setIsLoadingShowtime] = useState(false);
  const [showtimeError, setShowtimeError] = useState('');
  const [showtimeBookings, setShowtimeBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const visibleBookings = showtimeBookings.length > 0 ? showtimeBookings : recentBookings;
  const isShowingShowtimeBookings = showtimeBookings.length > 0;

  const stats = useMemo(() => {
    const checked = visibleBookings.filter((booking) => booking.status === 'USED').length;
    const paid = visibleBookings.filter((booking) => booking.status === 'PAID').length;
    return { checked, paid, total: visibleBookings.length };
  }, [visibleBookings]);

  const rememberBooking = (booking) => {
    if (!booking?.id) return;
    setShowtimeBookings((current) => current.map((item) => (
      String(item.id) === String(booking.id) ? booking : item
    )));
    setRecentBookings((current) => [
      booking,
      ...current.filter((item) => String(item.id) !== String(booking.id)),
    ].slice(0, 8));
  };

  const getToken = () => {
    const { accessToken } = getStoredAuth();
    return accessToken;
  };

  const lookupBooking = async ({ preferQr = false } = {}) => {
    const token = getToken();
    const trimmedQr = qrCode.trim();
    const trimmedCode = bookingCode.trim();
    if (!token) {
      setResult({ type: 'error', title: 'Phiên đăng nhập không hợp lệ.', message: 'Vui lòng đăng nhập bằng tài khoản STAFF.' });
      return null;
    }
    if (!trimmedQr && !trimmedCode) {
      setResult({ type: 'warning', title: 'Thiếu dữ liệu tra cứu.', message: 'Nhập mã QR hoặc mã booking trước khi tra cứu.' });
      return null;
    }

    setIsLookingUp(true);
    try {
      const booking = await authApi.lookupStaffCheckInBooking(token, {
        qrCode: preferQr ? trimmedQr : '',
        bookingCode: preferQr ? '' : trimmedCode,
      });
      rememberBooking(booking);
      setResult({
        type: booking.status === 'PAID' ? 'warning' : booking.status === 'USED' ? 'success' : 'error',
        title: booking.status === 'PAID' ? 'Booking hợp lệ, chờ check-in.' : booking.status === 'USED' ? 'Booking đã check-in.' : 'Booking chưa đủ điều kiện.',
        message: booking.status === 'PAID'
          ? 'Có thể xác nhận check-in bằng mã QR của booking này.'
          : `Trạng thái hiện tại: ${booking.status}.`,
        booking,
      });
      return booking;
    } catch (error) {
      setResult({ type: 'error', title: 'Không tìm thấy booking.', message: error.message || 'Không thể tra cứu booking từ hệ thống.' });
      return null;
    } finally {
      setIsLookingUp(false);
    }
  };

  const checkInByQr = async (value = qrCode) => {
    const token = getToken();
    const trimmedQr = String(value || '').trim();
    if (!token) {
      setResult({ type: 'error', title: 'Phiên đăng nhập không hợp lệ.', message: 'Vui lòng đăng nhập bằng tài khoản STAFF.' });
      return;
    }
    if (!trimmedQr) {
      setResult({ type: 'warning', title: 'Chưa có mã QR.', message: 'Nhập hoặc quét mã QR trước khi xác nhận check-in.' });
      return;
    }

    setIsCheckingIn(true);
    try {
      const booking = await authApi.checkInStaffBooking(token, trimmedQr);
      rememberBooking(booking);
      setResult({
        type: 'success',
        title: 'Check-in thành công.',
        message: 'Booking đã được xác nhận. Có thể hướng dẫn khách vào phòng chiếu.',
        booking,
      });
    } catch (error) {
      setResult({ type: 'error', title: 'Không thể check-in.', message: error.message || 'Booking không đủ điều kiện check-in.' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const loadShowtimeBookings = async () => {
    const token = getToken();
    const trimmedShowtimeId = showtimeId.trim();
    if (!token) {
      setShowtimeError('Vui long dang nhap bang tai khoan STAFF.');
      return;
    }
    if (!trimmedShowtimeId) {
      setShowtimeError('Nhap showtimeId truoc khi tai danh sach.');
      return;
    }

    setShowtimeError('');
    setIsLoadingShowtime(true);
    try {
      const bookings = await authApi.getStaffShowtimeBookings(token, trimmedShowtimeId);
      setShowtimeBookings(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      setShowtimeBookings([]);
      setShowtimeError(error.message || 'Khong the tai danh sach booking cua suat chieu.');
    } finally {
      setIsLoadingShowtime(false);
    }
  };

  return (
    <div className="staff-page relative min-h-screen overflow-hidden bg-[#f4f7f6] text-slate-900">
      <div className="staff-orb staff-orb-one" />
      <div className="staff-orb staff-orb-two" />
      <div className="staff-grid-bg" />

      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:text-slate-900" title="Về trang chủ">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.3)]">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-500">CinePremier Operations</p>
              <h1 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">Staff Check-in</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-slate-900">{currentUser?.fullName || currentUser?.name || currentUser?.email || 'Nhân viên'}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tài khoản STAFF</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm">
              <UserRound className="h-4 w-4" />
            </div>
            <button type="button" onClick={handleLogout} className="hidden h-9 items-center gap-2 border border-slate-200 px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 transition hover:text-slate-900 lg:flex">
              <LogOut className="h-3.5 w-3.5" /> Thoát ca
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-r from-white/95 to-emerald-50/90 p-5 shadow-sm sm:p-6">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_62%)]" />
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> API thật
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chỉ STAFF được check-in</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">Kiểm soát vé bằng QR booking</h2>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-600">
                Mỗi QR hiện gắn với một booking. Khi xác nhận, toàn bộ booking chuyển sang trạng thái đã check-in theo đúng API backend.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Phiên hiện tại</p>
            <p className="mt-1 text-2xl font-black">{stats.checked}/{stats.total}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5"><p className="text-lg font-black text-emerald-700">{stats.checked}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Đã vào</p></div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-2.5"><p className="text-lg font-black text-amber-700">{stats.paid}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Chờ vào</p></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"><p className="text-lg font-black text-slate-900">{stats.total}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Đã tra</p></div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
          <div className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-500">Quét/Xác nhận QR</p>
                  <h3 className="mt-2 text-xl font-black uppercase">Check-in bằng mã QR</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">Dán chuỗi QR dạng `CINEAI:...` từ vé khách hàng để xác nhận check-in.</p>
                </div>
                <textarea
                  value={qrCode}
                  onChange={(event) => setQrCode(event.target.value)}
                  placeholder="Dán mã QR booking tại đây..."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-400/60"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => lookupBooking({ preferQr: true })}
                    disabled={isLookingUp || !qrCode.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-emerald-400 disabled:opacity-50"
                  >
                    {isLookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Kiểm tra QR
                  </button>
                  <button
                    type="button"
                    onClick={() => checkInByQr()}
                    disabled={isCheckingIn || !qrCode.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-[0_12px_25px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {isCheckingIn ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />} Xác nhận check-in
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Tra cứu thủ công</p>
                  <h3 className="mt-2 text-xl font-black uppercase">Tìm theo mã booking</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">Dùng khi khách đọc mã booking nhưng chưa mở được QR.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={bookingCode}
                    onChange={(event) => setBookingCode(event.target.value)}
                    placeholder="VD: BKABC123..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-400/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => lookupBooking()}
                  disabled={isLookingUp || !bookingCode.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-emerald-400 disabled:opacity-50"
                >
                  {isLookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tra cứu booking
                </button>
                {result?.booking?.qrCode && result.booking.status === 'PAID' && (
                  <button
                    type="button"
                    onClick={() => checkInByQr(result.booking.qrCode)}
                    disabled={isCheckingIn}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {isCheckingIn ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Check-in booking vừa tra
                  </button>
                )}
              </div>
            </div>
          </div>

          <ResultCard result={result} />
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Danh sach theo suat chieu</p>
              <h3 className="mt-1 text-lg font-black uppercase">Tai booking cua mot showtime</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                STAFF co the nhap showtimeId de xem toan bo booking that cua suat do, sau do check-in truc tiep cac booking PAID.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                value={showtimeId}
                onChange={(event) => setShowtimeId(event.target.value)}
                placeholder="showtimeId..."
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-400/60"
              />
              <button
                type="button"
                onClick={loadShowtimeBookings}
                disabled={isLoadingShowtime || !showtimeId.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500 hover:text-black disabled:opacity-50"
              >
                {isLoadingShowtime ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tai danh sach
              </button>
              {isShowingShowtimeBookings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowtimeBookings([]);
                    setShowtimeError('');
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-400"
                >
                  Ve danh sach phien
                </button>
              )}
            </div>
          </div>
          {showtimeError && <p className="mt-3 text-xs font-bold text-rose-600">{showtimeError}</p>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-sm backdrop-blur-xl">
          <div className="border-b border-slate-200 p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">
              {isShowingShowtimeBookings ? 'Du lieu showtime tu API' : 'Dữ liệu phiên làm việc'}
            </p>
            <h3 className="mt-1 text-lg font-black uppercase">
              {isShowingShowtimeBookings ? `Booking cua showtime #${showtimeId}` : 'Booking vừa tra cứu/check-in'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-3 py-3">Phim</th>
                  <th className="px-3 py-3">Suất</th>
                  <th className="px-3 py-3">Ghế</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleBookings.length > 0 ? visibleBookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-emerald-50/50">
                    <td className="px-5 py-4"><p className="font-mono text-[11px] font-black text-slate-900">{booking.bookingCode}</p><p className="mt-1 font-mono text-[8px] text-slate-300">#{booking.id}</p></td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-700">{booking.movieTitle}</td>
                    <td className="px-3 py-4 text-[10px] font-bold text-slate-500">{formatDateTime(booking.showtimeStart)}</td>
                    <td className="px-3 py-4 text-xs font-black text-slate-900">{formatSeats(booking)}</td>
                    <td className="px-3 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => checkInByQr(booking.qrCode)}
                        disabled={booking.status !== 'PAID' || !booking.qrCode || isCheckingIn}
                        className="border border-slate-200 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-900 transition hover:border-emerald-400 hover:text-emerald-700 disabled:border-slate-100 disabled:text-slate-300"
                      >
                        {booking.status === 'USED' ? 'Đã xác nhận' : 'Check-in'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Ticket className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-xs font-bold text-slate-500">Chưa có booking nào trong phiên này.</p>
                      {isShowingShowtimeBookings && <p className="mt-1 text-[10px] font-bold text-slate-400">Showtime nay chua co booking.</p>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:flex-row sm:items-center">
            <span>{isShowingShowtimeBookings ? 'Danh sach booking lay truc tiep theo showtimeId' : 'Hiển thị tối đa 8 booking gần nhất trong phiên làm việc'}</span>
            <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Cập nhật theo API backend</span>
          </div>
        </section>
      </main>
    </div>
  );
}
