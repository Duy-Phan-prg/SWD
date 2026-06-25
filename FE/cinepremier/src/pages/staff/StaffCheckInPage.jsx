import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getStoredAuth } from '../../services/authService';
import { staffService } from '../../services/staffService';
import { useAuthStore } from '../../stores/useAuthStore';

const FOOD_PAGE_SIZE = 10;

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
      className: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    };
  }
  if (normalized === 'USED') {
    return {
      label: 'Đã check-in',
      className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    };
  }
  return {
    label: normalized || 'Không hợp lệ',
    className: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
  };
};

function StatusBadge({ status }) {
  const meta = getBookingStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center border border-dashed border-neutral-800 bg-[#070707] p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-emerald-400/60" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-neutral-400">Chưa có kết quả</p>
        <p className="mt-2 max-w-sm text-xs leading-6 text-neutral-500">
          Nhập mã QR hoặc mã booking để hệ thống kiểm tra dữ liệu thật từ backend.
        </p>
      </div>
    );
  }

  const Icon = result.type === 'success' ? CheckCircle2 : result.type === 'warning' ? AlertCircle : XCircle;
  const color = result.type === 'success' ? 'text-emerald-300' : result.type === 'warning' ? 'text-amber-300' : 'text-rose-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-neutral-800 bg-[#070707] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-800 bg-black ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">{result.title}</h3>
          <p className="mt-1 text-xs leading-6 text-neutral-400">{result.message}</p>
        </div>
      </div>

      {result.booking && (
        <div className="mt-5 space-y-3 border border-neutral-800 bg-black p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-black text-white">{result.booking.bookingCode}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Booking #{result.booking.id}</p>
            </div>
            <StatusBadge status={result.booking.status} />
          </div>
          <div className="grid gap-3 text-xs text-neutral-400 sm:grid-cols-2">
            <div><span className="font-black text-white">Phim:</span> {result.booking.movieTitle}</div>
            <div><span className="font-black text-white">Phòng:</span> {result.booking.roomName}</div>
            <div><span className="font-black text-white">Suất:</span> {formatDateTime(result.booking.showtimeStart)}</div>
            <div><span className="font-black text-white">Ghế:</span> {formatSeats(result.booking)}</div>
            <div><span className="font-black text-white">Tổng tiền:</span> {Number(result.booking.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
            <div><span className="font-black text-white">Check-in:</span> {formatDateTime(result.booking.checkedInAt)}</div>
          </div>
        </div>
      )}

      {result.type === 'success' && (
        <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 border border-emerald-400/40 bg-emerald-400 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-black transition hover:bg-emerald-300">
          <Printer className="h-3.5 w-3.5" /> In vé vào cửa
        </button>
      )}
    </motion.div>
  );
}

export default function StaffCheckInPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
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
  const [staffFoodItems, setStaffFoodItems] = useState([]);
  const [staffFoodCombos, setStaffFoodCombos] = useState([]);
  const [staffFoodError, setStaffFoodError] = useState('');
  const [isLoadingStaffFoods, setIsLoadingStaffFoods] = useState(false);
  const [savingStaffFoodKey, setSavingStaffFoodKey] = useState('');
  const [staffFoodPage, setStaffFoodPage] = useState(1);

  const visibleBookings = showtimeBookings.length > 0 ? showtimeBookings : recentBookings;
  const isShowingShowtimeBookings = showtimeBookings.length > 0;
  const staffFoods = useMemo(() => [
    ...staffFoodCombos.map((item) => ({ ...item, kind: 'combo' })),
    ...staffFoodItems.map((item) => ({ ...item, kind: 'item' })),
  ], [staffFoodCombos, staffFoodItems]);

  const foodStats = useMemo(() => {
    const outOfStock = staffFoods.filter((item) => item.status === 'OUT_OF_STOCK' || Number(item.stockQuantity || 0) === 0).length;
    const active = staffFoods.filter((item) => item.status === 'ACTIVE').length;
    return { active, outOfStock, total: staffFoods.length };
  }, [staffFoods]);
  const staffFoodTotalPages = Math.max(1, Math.ceil(staffFoods.length / FOOD_PAGE_SIZE));
  const safeStaffFoodPage = Math.min(staffFoodPage, staffFoodTotalPages);
  const staffFoodStartIndex = (safeStaffFoodPage - 1) * FOOD_PAGE_SIZE;
  const paginatedStaffFoods = staffFoods.slice(staffFoodStartIndex, staffFoodStartIndex + FOOD_PAGE_SIZE);
  const staffFoodDisplayStart = staffFoods.length === 0 ? 0 : staffFoodStartIndex + 1;
  const staffFoodDisplayEnd = Math.min(staffFoodStartIndex + FOOD_PAGE_SIZE, staffFoods.length);

  useEffect(() => {
    setStaffFoodPage((page) => Math.min(page, staffFoodTotalPages));
  }, [staffFoodTotalPages]);

  const stats = useMemo(() => {
    const checked = visibleBookings.filter((booking) => booking.status === 'USED').length;
    const paid = visibleBookings.filter((booking) => booking.status === 'PAID').length;
    return { checked, paid, total: visibleBookings.length };
  }, [visibleBookings]);

  const getToken = () => {
    const { accessToken } = getStoredAuth();
    return accessToken;
  };

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

  const loadStaffFoods = async () => {
    const token = getToken();
    if (!token) {
      setStaffFoodError('Vui lòng đăng nhập bằng tài khoản STAFF.');
      return;
    }

    setIsLoadingStaffFoods(true);
    setStaffFoodError('');
    try {
      const [items, combos] = await Promise.all([
        staffService.getStaffFoodItems(token),
        staffService.getStaffFoodCombos(token),
      ]);
      setStaffFoodItems(Array.isArray(items) ? items : []);
      setStaffFoodCombos(Array.isArray(combos) ? combos : []);
    } catch (error) {
      setStaffFoodError(error.message || 'Không thể tải danh sách bắp nước.');
    } finally {
      setIsLoadingStaffFoods(false);
    }
  };

  const updateStaffFoodStatus = async (food, nextStatus) => {
    const token = getToken();
    if (!token) {
      setStaffFoodError('Vui lòng đăng nhập bằng tài khoản STAFF.');
      return;
    }

    const foodKey = `${food.kind}-${food.id}`;
    setSavingStaffFoodKey(foodKey);
    setStaffFoodError('');
    try {
      const saved = food.kind === 'combo'
        ? await staffService.updateStaffFoodComboStatus(token, food.id, nextStatus)
        : await staffService.updateStaffFoodItemStatus(token, food.id, nextStatus);

      if (food.kind === 'combo') {
        setStaffFoodCombos((current) => current.map((item) => (item.id === food.id ? saved : item)));
      } else {
        setStaffFoodItems((current) => current.map((item) => (item.id === food.id ? saved : item)));
      }
    } catch (error) {
      setStaffFoodError(error.message || 'Không thể đổi trạng thái món.');
    } finally {
      setSavingStaffFoodKey('');
    }
  };

  useEffect(() => {
    loadStaffFoods();
  }, []);

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
      const booking = await staffService.lookupStaffCheckInBooking(token, {
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
      const booking = await staffService.checkInStaffBooking(token, trimmedQr);
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
      setShowtimeError('Vui lòng đăng nhập bằng tài khoản STAFF.');
      return;
    }
    if (!trimmedShowtimeId) {
      setShowtimeError('Nhập showtimeId trước khi tải danh sách.');
      return;
    }

    setShowtimeError('');
    setIsLoadingShowtime(true);
    try {
      const bookings = await staffService.getStaffShowtimeBookings(token, trimmedShowtimeId);
      setShowtimeBookings(Array.isArray(bookings) ? bookings : []);
    } catch (error) {
      setShowtimeBookings([]);
      setShowtimeError(error.message || 'Không thể tải danh sách booking của suất chiếu.');
    } finally {
      setIsLoadingShowtime(false);
    }
  };

  return (
    <div className="staff-page relative overflow-hidden bg-black text-white">
      <div className="staff-orb staff-orb-one" />
      <div className="staff-orb staff-orb-two" />
      <div className="staff-grid-bg" />

      <main className="relative z-10 mx-auto max-w-[1500px] space-y-5 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden border border-neutral-800 bg-gradient-to-r from-[#090909] to-[#050505] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_62%)]" />
            <div className="relative">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> API thật
                </span>
                <span className="border border-amber-400/20 bg-amber-500/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-300">
                  STAFF OPERATIONS
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">Kiểm soát vé bằng QR booking</h2>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-neutral-400">
                Mỗi QR gắn với một booking thật. Khi xác nhận, toàn bộ booking chuyển sang trạng thái đã check-in theo API backend.
              </p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">
                Nhân viên: {currentUser?.fullName || currentUser?.name || currentUser?.email || 'STAFF'}
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="border border-neutral-800 bg-[#070707] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Phiên hiện tại</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.checked}/{stats.total}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="border border-emerald-400/20 bg-emerald-400/10 p-2.5"><p className="text-lg font-black text-emerald-300">{stats.checked}</p><p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Đã vào</p></div>
              <div className="border border-amber-400/20 bg-amber-500/10 p-2.5"><p className="text-lg font-black text-amber-300">{stats.paid}</p><p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Chờ vào</p></div>
              <div className="border border-neutral-800 bg-black p-2.5"><p className="text-lg font-black text-white">{stats.total}</p><p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Đã tra</p></div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
          <div className="border border-neutral-800 bg-[#070707] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:p-7">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-400">Quét/Xác nhận QR</p>
                  <h3 className="mt-2 text-xl font-black uppercase text-white">Check-in bằng mã QR</h3>
                  <p className="mt-2 text-xs leading-6 text-neutral-500">Dán chuỗi QR dạng `CINEAI:...` từ vé khách hàng để xác nhận check-in.</p>
                </div>
                <textarea
                  value={qrCode}
                  onChange={(event) => setQrCode(event.target.value)}
                  placeholder="Dán mã QR booking tại đây..."
                  rows={6}
                  className="w-full resize-none border border-neutral-800 bg-black p-4 text-sm font-bold text-white outline-none transition placeholder:text-neutral-700 focus:border-emerald-400/70"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => lookupBooking({ preferQr: true })}
                    disabled={isLookingUp || !qrCode.trim()}
                    className="flex items-center justify-center gap-2 border border-neutral-700 bg-black px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300 transition hover:border-emerald-400 hover:text-white disabled:opacity-50"
                  >
                    {isLookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Kiểm tra QR
                  </button>
                  <button
                    type="button"
                    onClick={() => checkInByQr()}
                    disabled={isCheckingIn || !qrCode.trim()}
                    className="flex items-center justify-center gap-2 bg-emerald-400 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {isCheckingIn ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />} Xác nhận check-in
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400">Tra cứu thủ công</p>
                  <h3 className="mt-2 text-xl font-black uppercase text-white">Tìm theo mã booking</h3>
                  <p className="mt-2 text-xs leading-6 text-neutral-500">Dùng khi khách đọc mã booking nhưng chưa mở được QR.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={bookingCode}
                    onChange={(event) => setBookingCode(event.target.value)}
                    placeholder="VD: BKABC123..."
                    className="w-full border border-neutral-800 bg-black py-4 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-neutral-700 focus:border-emerald-400/70"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => lookupBooking()}
                  disabled={isLookingUp || !bookingCode.trim()}
                  className="flex w-full items-center justify-center gap-2 border border-neutral-700 bg-black px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300 transition hover:border-amber-400 hover:text-white disabled:opacity-50"
                >
                  {isLookingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tra cứu booking
                </button>
                {result?.booking?.qrCode && result.booking.status === 'PAID' && (
                  <button
                    type="button"
                    onClick={() => checkInByQr(result.booking.qrCode)}
                    disabled={isCheckingIn}
                    className="flex w-full items-center justify-center gap-2 border border-emerald-400/40 bg-emerald-400/10 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:opacity-50"
                  >
                    {isCheckingIn ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Check-in booking vừa tra
                  </button>
                )}
              </div>
            </div>
          </div>

          <ResultCard result={result} />
        </section>

        <section className="border border-neutral-800 bg-[#070707] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Danh sách theo suất chiếu</p>
              <h3 className="mt-1 text-lg font-black uppercase text-white">Tải booking của một showtime</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                STAFF có thể nhập showtimeId để xem toàn bộ booking thật của suất đó, sau đó check-in trực tiếp các booking PAID.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                value={showtimeId}
                onChange={(event) => setShowtimeId(event.target.value)}
                placeholder="showtimeId..."
                className="min-w-[220px] border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-neutral-700 focus:border-emerald-400/70"
              />
              <button
                type="button"
                onClick={loadShowtimeBookings}
                disabled={isLoadingShowtime || !showtimeId.trim()}
                className="flex items-center justify-center gap-2 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isLoadingShowtime ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tải danh sách
              </button>
              {isShowingShowtimeBookings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowtimeBookings([]);
                    setShowtimeError('');
                  }}
                  className="border border-neutral-700 bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white hover:text-white"
                >
                  Về danh sách phiên
                </button>
              )}
            </div>
          </div>
          {showtimeError && <p className="mt-3 text-xs font-bold text-rose-400">{showtimeError}</p>}
        </section>

        <section className="border border-neutral-800 bg-[#070707] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Quầy bắp nước</p>
              <h3 className="mt-1 text-lg font-black uppercase text-white">Trạng thái món/combo</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                STAFF có thể đổi nhanh trạng thái khi món hết đột ngột. Số lượng tồn sẽ tự giảm khi khách tạo booking có bắp nước.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="border border-neutral-700 bg-black px-3 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300">
                {foodStats.active}/{foodStats.total} đang bán
              </span>
              <span className="border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-300">
                {foodStats.outOfStock} hết hàng
              </span>
              <button
                type="button"
                onClick={loadStaffFoods}
                disabled={isLoadingStaffFoods}
                className="flex items-center gap-2 border border-neutral-700 bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 transition hover:border-emerald-400 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStaffFoods ? 'animate-spin' : ''}`} /> Làm mới
              </button>
            </div>
          </div>

          {staffFoodError && <p className="mt-3 text-xs font-bold text-rose-400">{staffFoodError}</p>}

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingStaffFoods ? (
              <div className="border border-neutral-800 bg-black p-4 text-xs font-bold text-neutral-500">Đang tải danh sách bắp nước...</div>
            ) : staffFoods.length > 0 ? paginatedStaffFoods.map((food) => {
              const foodKey = `${food.kind}-${food.id}`;
              const stock = Number(food.stockQuantity || 0);
              return (
                <div key={foodKey} className="border border-neutral-800 bg-black p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase text-white">{food.name}</p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-neutral-500">{food.kind === 'combo' ? 'Combo' : 'Món lẻ'}</p>
                    </div>
                    <span className={`px-2 py-1 text-[9px] font-black uppercase ${stock === 0 ? 'bg-rose-500/10 text-rose-300' : stock <= 5 ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
                      Tồn {stock.toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <select
                    value={food.status || 'ACTIVE'}
                    onChange={(event) => updateStaffFoodStatus(food, event.target.value)}
                    disabled={savingStaffFoodKey === foodKey}
                    className="mt-4 w-full border border-neutral-800 bg-[#070707] px-3 py-2.5 text-xs font-black text-white outline-none transition focus:border-emerald-400 disabled:opacity-50"
                  >
                    <option value="ACTIVE">ACTIVE - Đang bán</option>
                    <option value="OUT_OF_STOCK">OUT_OF_STOCK - Hết hàng</option>
                    <option value="INACTIVE">INACTIVE - Tạm ẩn</option>
                  </select>
                </div>
              );
            }) : (
              <div className="border border-dashed border-neutral-800 bg-black p-4 text-xs font-bold text-neutral-500">Chưa có món bắp nước nào.</div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 border border-neutral-800 bg-black/80 p-3 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Hiển thị {staffFoodDisplayStart}-{staffFoodDisplayEnd}/{staffFoods.length} món - Trang {safeStaffFoodPage}/{staffFoodTotalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeStaffFoodPage <= 1}
                onClick={() => setStaffFoodPage((page) => Math.max(1, page - 1))}
                className="inline-flex items-center gap-1 border border-neutral-700 px-3 py-2 text-white transition hover:border-emerald-400 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Trước
              </button>
              <button
                type="button"
                disabled={safeStaffFoodPage >= staffFoodTotalPages}
                onClick={() => setStaffFoodPage((page) => Math.min(staffFoodTotalPages, page + 1))}
                className="inline-flex items-center gap-1 border border-neutral-700 px-3 py-2 text-white transition hover:border-emerald-400 disabled:opacity-30"
              >
                Sau <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border border-neutral-800 bg-[#070707]">
          <div className="border-b border-neutral-800 p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
              {isShowingShowtimeBookings ? 'Dữ liệu showtime từ API' : 'Dữ liệu phiên làm việc'}
            </p>
            <h3 className="mt-1 text-lg font-black uppercase text-white">
              {isShowingShowtimeBookings ? `Booking của showtime #${showtimeId}` : 'Booking vừa tra cứu/check-in'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-neutral-800 bg-black text-[8px] font-black uppercase tracking-[0.18em] text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-3 py-3">Phim</th>
                  <th className="px-3 py-3">Suất</th>
                  <th className="px-3 py-3">Ghế</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {visibleBookings.length > 0 ? visibleBookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-emerald-400/5">
                    <td className="px-5 py-4"><p className="font-mono text-[11px] font-black text-white">{booking.bookingCode}</p><p className="mt-1 font-mono text-[8px] text-neutral-600">#{booking.id}</p></td>
                    <td className="px-3 py-4 text-xs font-bold text-neutral-300">{booking.movieTitle}</td>
                    <td className="px-3 py-4 text-[10px] font-bold text-neutral-500">{formatDateTime(booking.showtimeStart)}</td>
                    <td className="px-3 py-4 text-xs font-black text-white">{formatSeats(booking)}</td>
                    <td className="px-3 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => checkInByQr(booking.qrCode)}
                        disabled={booking.status !== 'PAID' || !booking.qrCode || isCheckingIn}
                        className="border border-neutral-700 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-neutral-300 transition hover:border-emerald-400 hover:text-emerald-300 disabled:border-neutral-900 disabled:text-neutral-700"
                      >
                        {booking.status === 'USED' ? 'Đã xác nhận' : 'Check-in'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Ticket className="mx-auto h-8 w-8 text-neutral-700" />
                      <p className="mt-3 text-xs font-bold text-neutral-500">Chưa có booking nào trong phiên này.</p>
                      {isShowingShowtimeBookings && <p className="mt-1 text-[10px] font-bold text-neutral-600">Showtime này chưa có booking.</p>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-neutral-800 px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-neutral-500 sm:flex-row sm:items-center">
            <span>{isShowingShowtimeBookings ? 'Danh sách booking lấy trực tiếp theo showtimeId' : 'Hiển thị tối đa 8 booking gần nhất trong phiên làm việc'}</span>
            <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Cập nhật theo API backend</span>
          </div>
        </section>
      </main>
    </div>
  );
}
