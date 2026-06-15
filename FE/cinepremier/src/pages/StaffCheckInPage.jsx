import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Film,
  LogOut,
  Monitor,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

const SHOWTIMES = [
  {
    id: 'st-01',
    movie: 'Dune: Part Two',
    format: 'IMAX 2D',
    room: 'IMAX 01',
    time: '19:30',
    endTime: '22:16',
    date: '15/06/2026',
    status: 'NOW_SHOWING',
  },
  {
    id: 'st-02',
    movie: 'Inside Out 2',
    format: '2D Phụ đề',
    room: 'Phòng 03',
    time: '20:00',
    endTime: '21:36',
    date: '15/06/2026',
    status: 'SCHEDULED',
  },
  {
    id: 'st-03',
    movie: 'Furiosa: A Mad Max Saga',
    format: '4DX',
    room: 'Phòng 4DX',
    time: '21:15',
    endTime: '23:43',
    date: '15/06/2026',
    status: 'SCHEDULED',
  },
];

const INITIAL_TICKETS = [
  { id: 'TCK-260615-001', bookingCode: 'CP8X2K9', showtimeId: 'st-01', customer: 'Nguyễn Minh Anh', phone: '090 123 4567', seat: 'H8', seatType: 'VIP', payment: 'PAID', status: 'USED', checkedAt: '19:06', checkedBy: 'Trần Gia Huy' },
  { id: 'TCK-260615-002', bookingCode: 'CP8X2K9', showtimeId: 'st-01', customer: 'Nguyễn Minh Anh', phone: '090 123 4567', seat: 'H9', seatType: 'VIP', payment: 'PAID', status: 'ACTIVE' },
  { id: 'TCK-260615-003', bookingCode: 'CP4L7M1', showtimeId: 'st-01', customer: 'Lê Hoàng Nam', phone: '098 765 4321', seat: 'G5', seatType: 'Standard', payment: 'PAID', status: 'ACTIVE' },
  { id: 'TCK-260615-004', bookingCode: 'CP4L7M1', showtimeId: 'st-01', customer: 'Lê Hoàng Nam', phone: '098 765 4321', seat: 'G6', seatType: 'Standard', payment: 'PAID', status: 'ACTIVE' },
  { id: 'TCK-260615-005', bookingCode: 'CP1Q8P4', showtimeId: 'st-01', customer: 'Phạm Thu Hà', phone: '093 456 7890', seat: 'D10', seatType: 'Couple', payment: 'PAID', status: 'USED', checkedAt: '19:12', checkedBy: 'Trần Gia Huy' },
  { id: 'TCK-260615-006', bookingCode: 'CP6N2A7', showtimeId: 'st-01', customer: 'Đỗ Quang Vinh', phone: '091 223 3445', seat: 'C3', seatType: 'Standard', payment: 'PENDING', status: 'ACTIVE' },
  { id: 'TCK-260615-007', bookingCode: 'CP3B5T8', showtimeId: 'st-02', customer: 'Vũ Ngọc Mai', phone: '097 888 1122', seat: 'F7', seatType: 'VIP', payment: 'PAID', status: 'ACTIVE' },
  { id: 'TCK-260615-008', bookingCode: 'CP3B5T8', showtimeId: 'st-02', customer: 'Vũ Ngọc Mai', phone: '097 888 1122', seat: 'F8', seatType: 'VIP', payment: 'PAID', status: 'ACTIVE' },
];

const statusStyle = {
  ACTIVE: 'border-amber-300 bg-amber-50 text-amber-700',
  USED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-rose-300 bg-rose-50 text-rose-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm transition hover:-translate-y-0.5 ${statusStyle[status] || statusStyle.CANCELLED}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'USED' ? 'bg-emerald-300' : status === 'ACTIVE' ? 'bg-amber-300' : 'bg-rose-300'}`} />
      {status === 'USED' ? 'Đã check-in' : status === 'ACTIVE' ? 'Chưa check-in' : 'Không hợp lệ'}
    </span>
  );
}

export default function StaffCheckInPage() {
  const navigate = useNavigate();
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(SHOWTIMES[0].id);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [activeMode, setActiveMode] = useState('scan');
  const [searchValue, setSearchValue] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [showtimeMenuOpen, setShowtimeMenuOpen] = useState(false);

  const selectedShowtime = SHOWTIMES.find((item) => item.id === selectedShowtimeId);
  const showtimeTickets = tickets.filter((ticket) => ticket.showtimeId === selectedShowtimeId);
  const filteredTickets = showtimeTickets.filter((ticket) => {
    const query = tableSearch.trim().toLowerCase();
    return !query || [ticket.bookingCode, ticket.customer, ticket.seat, ticket.phone].some((value) => value.toLowerCase().includes(query));
  });
  const checkedIn = showtimeTickets.filter((ticket) => ticket.status === 'USED').length;
  const active = showtimeTickets.filter((ticket) => ticket.status === 'ACTIVE').length;
  const progress = showtimeTickets.length ? Math.round((checkedIn / showtimeTickets.length) * 100) : 0;

  const manualMatches = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];
    return tickets.filter((ticket) =>
      ticket.bookingCode.toLowerCase().includes(query)
      || ticket.id.toLowerCase().includes(query)
      || ticket.phone.replace(/\s/g, '').includes(query.replace(/\s/g, ''))
    );
  }, [searchValue, tickets]);

  const checkInTicket = (ticket) => {
    if (!ticket) {
      setScanResult({ type: 'error', title: 'Vé không tồn tại.', message: 'Không tìm thấy mã vé trong hệ thống.' });
      return;
    }
    if (ticket.showtimeId !== selectedShowtimeId) {
      const actualShowtime = SHOWTIMES.find((item) => item.id === ticket.showtimeId);
      setScanResult({ type: 'error', title: 'Vé sai suất chiếu.', message: `Vé này thuộc suất ${actualShowtime?.time} · ${actualShowtime?.room}.`, ticket });
      return;
    }
    if (ticket.status === 'USED') {
      setScanResult({ type: 'error', title: 'Vé đã được sử dụng.', message: `Đã check-in lúc ${ticket.checkedAt} bởi ${ticket.checkedBy}.`, ticket });
      return;
    }
    if (ticket.payment !== 'PAID') {
      setScanResult({ type: 'error', title: 'Vé chưa được thanh toán.', message: 'Vui lòng hướng dẫn khách hoàn tất thanh toán.', ticket });
      return;
    }

    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const checkedTicket = { ...ticket, status: 'USED', checkedAt: now, checkedBy: 'Trần Gia Huy' };
    setTickets((current) => current.map((item) => item.id === ticket.id ? checkedTicket : item));
    setScanResult({ type: 'success', title: 'Check-in thành công.', message: 'Vé hợp lệ. Có thể hướng dẫn khách vào phòng chiếu.', ticket: checkedTicket });
    setSelectedTicketIds((current) => current.filter((id) => id !== ticket.id));
  };

  const runMockScan = () => {
    setIsScanning(true);
    setScanResult(null);
    window.setTimeout(() => {
      const nextTicket = tickets.find((ticket) => ticket.showtimeId === selectedShowtimeId && ticket.status === 'ACTIVE' && ticket.payment === 'PAID');
      checkInTicket(nextTicket || showtimeTickets[0]);
      setIsScanning(false);
    }, 850);
  };

  const checkInSelected = () => {
    const eligible = tickets.filter((ticket) => selectedTicketIds.includes(ticket.id) && ticket.status === 'ACTIVE' && ticket.payment === 'PAID');
    if (!eligible.length) {
      setScanResult({ type: 'error', title: 'Không có vé hợp lệ được chọn.', message: 'Chỉ vé đã thanh toán và chưa sử dụng mới có thể check-in.' });
      return;
    }
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setTickets((current) => current.map((ticket) => selectedTicketIds.includes(ticket.id) && ticket.status === 'ACTIVE' && ticket.payment === 'PAID'
      ? { ...ticket, status: 'USED', checkedAt: now, checkedBy: 'Trần Gia Huy' }
      : ticket));
    setScanResult({ type: 'success', title: `Đã check-in ${eligible.length} vé.`, message: 'Trạng thái booking đã được cập nhật.' });
    setSelectedTicketIds([]);
  };

  return (
    <div className="staff-page relative min-h-screen overflow-hidden bg-[#f4f7f6] text-slate-900">
      <div className="staff-orb staff-orb-one" />
      <div className="staff-orb staff-orb-two" />
      <div className="staff-grid-bg" />
      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} className="staff-icon-button flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:text-slate-900" title="Về trang chủ">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <motion.div animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity }} className="staff-logo-pulse relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.3)]">
              <ScanLine className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-400">CinePremier Operations</p>
              <h1 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">Staff Check-in</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-slate-900">Trần Gia Huy</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nhân viên soát vé · Ca tối</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm">
              <UserRound className="h-4 w-4" />
            </div>
            <button type="button" onClick={() => navigate('/')} className="hidden h-9 items-center gap-2 border border-slate-200 px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 transition hover:text-slate-900 lg:flex">
              <LogOut className="h-3.5 w-3.5" /> Thoát ca
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="staff-glass-card staff-hero relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-r from-white/95 to-emerald-50/90 p-5 shadow-sm sm:p-6">
            <div className="staff-hero-shimmer" />
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_62%)]" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 border border-rose-300 bg-rose-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300" /> Đang chiếu
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quầy kiểm soát cửa số 02</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">{selectedShowtime.movie}</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-emerald-400" /> {selectedShowtime.time} - {selectedShowtime.endTime}</span>
                  <span className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5 text-emerald-400" /> {selectedShowtime.room}</span>
                  <span className="flex items-center gap-2"><Film className="h-3.5 w-3.5 text-emerald-400" /> {selectedShowtime.format}</span>
                  <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-emerald-400" /> {selectedShowtime.date}</span>
                </div>
              </div>
              <div className="relative min-w-[280px]">
                <button type="button" onClick={() => setShowtimeMenuOpen((open) => !open)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg">
                  <span>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Đổi suất chiếu</span>
                    <span className="mt-1 block text-xs font-bold text-slate-900">{selectedShowtime.time} · {selectedShowtime.room}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition ${showtimeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {showtimeMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute right-0 top-full z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white/95 p-1 shadow-2xl backdrop-blur-xl">
                    {SHOWTIMES.map((showtime) => (
                      <button key={showtime.id} type="button" onClick={() => { setSelectedShowtimeId(showtime.id); setShowtimeMenuOpen(false); setScanResult(null); setSelectedTicketIds([]); }} className={`flex w-full items-center justify-between px-3 py-3 text-left transition hover:bg-slate-100 ${showtime.id === selectedShowtimeId ? 'bg-emerald-400/10' : ''}`}>
                        <span>
                          <span className="block text-xs font-bold">{showtime.movie}</span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-slate-500">{showtime.time} · {showtime.room}</span>
                        </span>
                        {showtime.id === selectedShowtimeId && <Check className="h-4 w-4 text-emerald-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="staff-glass-card rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Tiến độ check-in</p>
                <p className="mt-1 text-2xl font-black">{progress}%</p>
              </div>
              <div className="staff-progress-ring flex h-14 w-14 items-center justify-center rounded-full text-xs font-black text-emerald-700" style={{ '--staff-progress': `${progress * 3.6}deg` }}><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-inner">{checkedIn}/{showtimeTickets.length}</span></div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner"><div className="staff-progress-bar h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700" style={{ width: `${progress}%` }} /></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="staff-stat-card rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5"><p className="text-lg font-black text-emerald-700">{checkedIn}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Đã vào</p></div>
              <div className="staff-stat-card rounded-xl border border-amber-100 bg-amber-50/70 p-2.5"><p className="text-lg font-black text-amber-700">{active}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Chờ vào</p></div>
              <div className="staff-stat-card rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"><p className="text-lg font-black text-slate-900">{showtimeTickets.length}</p><p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tổng vé</p></div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(390px,0.75fr)]">
          <div className="staff-glass-card overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-sm backdrop-blur-xl">
            <div className="flex border-b border-slate-200">
              <button type="button" onClick={() => setActiveMode('scan')} className={`flex flex-1 items-center justify-center gap-2 border-r border-slate-200 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeMode === 'scan' ? 'bg-emerald-400 text-black' : 'text-slate-500 hover:text-slate-900'}`}>
                <QrCode className="h-4 w-4" /> Quét mã QR
              </button>
              <button type="button" onClick={() => setActiveMode('manual')} className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeMode === 'manual' ? 'bg-emerald-400 text-black' : 'text-slate-500 hover:text-slate-900'}`}>
                <Search className="h-4 w-4" /> Tra cứu thủ công
              </button>
            </div>

            {activeMode === 'scan' ? (
              <div className="p-5 sm:p-7">
                <div className="grid gap-6 md:grid-cols-[minmax(260px,0.8fr)_1.2fr]">
                  <div className={`staff-scanner relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border border-emerald-300 bg-slate-50 shadow-[0_20px_50px_rgba(16,185,129,0.14)] ${isScanning ? 'is-scanning' : ''}`}>
                    <div className="staff-scanner-grid" />
                    <div className="staff-scanner-ring staff-scanner-ring-one" />
                    <div className="staff-scanner-ring staff-scanner-ring-two" />
                    <div className="absolute inset-5 border border-slate-200 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.08),transparent_65%)]" />
                    <span className="absolute left-5 top-5 h-10 w-10 border-l-2 border-t-2 border-emerald-400" />
                    <span className="absolute right-5 top-5 h-10 w-10 border-r-2 border-t-2 border-emerald-400" />
                    <span className="absolute bottom-5 left-5 h-10 w-10 border-b-2 border-l-2 border-emerald-400" />
                    <span className="absolute bottom-5 right-5 h-10 w-10 border-b-2 border-r-2 border-emerald-400" />
                    <div className={`absolute left-8 right-8 h-px bg-emerald-300 shadow-[0_0_15px_rgba(52,211,153,1)] ${isScanning ? 'animate-scan-line' : 'top-1/2'}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <Camera className={`h-10 w-10 ${isScanning ? 'animate-pulse text-emerald-300' : 'text-slate-300'}`} />
                      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">{isScanning ? 'Đang nhận diện mã...' : 'Đưa mã QR vào khung'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-400">Kiểm soát vé nhanh</p>
                    <h3 className="mt-2 text-xl font-black uppercase">Sẵn sàng quét mã</h3>
                    <p className="mt-3 max-w-md text-xs leading-6 text-slate-500">Đặt mã QR của khách vào giữa khung. Hệ thống sẽ tự động kiểm tra suất chiếu, thanh toán và trạng thái sử dụng.</p>
                    <button type="button" onClick={runMockScan} disabled={isScanning} className="staff-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-[0_12px_25px_rgba(16,185,129,0.25)] transition hover:-translate-y-1 disabled:opacity-60">
                      {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />} {isScanning ? 'Đang quét...' : 'Mô phỏng quét QR'}
                    </button>
                    <p className="mt-3 text-center text-[9px] font-bold text-slate-400">Camera: Integrated Webcam · Đang hoạt động</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-7">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Nhập mã booking, mã vé hoặc số điện thoại..." className="w-full border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-400/60" />
                </div>
                {!searchValue && <div className="flex min-h-[250px] flex-col items-center justify-center text-center"><Search className="h-8 w-8 text-slate-300" /><p className="mt-4 text-xs font-bold text-slate-500">Nhập thông tin để tra cứu booking</p><p className="mt-1 text-[9px] uppercase tracking-widest text-slate-300">Thử: CP8X2K9 hoặc 0901234567</p></div>}
                {searchValue && manualMatches.length === 0 && <div className="flex min-h-[250px] flex-col items-center justify-center text-center"><XCircle className="h-8 w-8 text-rose-500" /><p className="mt-4 text-xs font-bold text-rose-700">Vé không tồn tại.</p></div>}
                {manualMatches.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {manualMatches.map((ticket) => (
                      <div key={ticket.id} className="flex flex-col justify-between gap-4 border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center border border-slate-200 text-slate-500"><Ticket className="h-4 w-4" /></div>
                          <div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black">{ticket.seat}</p><StatusBadge status={ticket.status} /></div><p className="mt-1 text-[10px] font-bold text-slate-500">{ticket.customer} · {ticket.bookingCode}</p></div>
                        </div>
                        <button type="button" disabled={ticket.status === 'USED'} onClick={() => checkInTicket(ticket)} className="border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-900 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">{ticket.status === 'USED' ? 'Đã xác nhận' : 'Xác nhận check-in'}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="staff-glass-card overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Kết quả gần nhất</p><h3 className="mt-1 text-sm font-black uppercase">Thông tin xác nhận</h3></div>
              {scanResult && <button type="button" onClick={() => setScanResult(null)} className="p-2 text-slate-400 hover:text-slate-900"><X className="h-4 w-4" /></button>}
            </div>
            <AnimatePresence mode="wait">
            {!scanResult ? (
              <motion.div key="empty-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
                <div className="staff-empty-icon flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><ShieldCheck className="h-10 w-10 text-emerald-300" /></div>
                <p className="mt-5 text-xs font-bold text-slate-500">Chưa có vé được kiểm tra</p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">Kết quả sẽ hiển thị tại đây</p>
              </motion.div>
            ) : (
              <motion.div key={`${scanResult.type}-${scanResult.title}`} initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="p-5">
                <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${scanResult.type === 'success' ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white' : 'border-rose-300 bg-gradient-to-br from-rose-50 to-white'}`}>
                  <div className="staff-result-shimmer" />
                  <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220 }} className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${scanResult.type === 'success' ? 'bg-emerald-400 text-black' : 'bg-rose-400 text-black'}`}>
                    {scanResult.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                  </motion.div>
                  <h3 className={`mt-5 text-lg font-black ${scanResult.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{scanResult.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{scanResult.message}</p>
                  {scanResult.ticket && (
                    <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-xs">
                      <div className="flex justify-between gap-3"><span className="text-slate-400">Khách hàng</span><span className="text-right font-bold">{scanResult.ticket.customer}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-400">Ghế / Loại ghế</span><span className="font-black text-slate-900">{scanResult.ticket.seat} · {scanResult.ticket.seatType}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-400">Phòng chiếu</span><span className="font-bold">{selectedShowtime.room}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-400">Mã booking</span><span className="font-mono font-bold text-emerald-700">{scanResult.ticket.bookingCode}</span></div>
                    </div>
                  )}
                  {scanResult.type === 'success' && <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-widest text-black transition hover:bg-emerald-300"><Printer className="h-3.5 w-3.5" /> In vé vào cửa</button>}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </section>

        <section className="staff-glass-card overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Theo suất chiếu</p><h3 className="mt-1 text-lg font-black uppercase">Danh sách booking</h3></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-[280px]"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="Tìm booking, khách hàng, ghế..." className="w-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[10px] font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:border-emerald-400/50" /></div>
              <button type="button" onClick={checkInSelected} disabled={!selectedTicketIds.length} className="flex items-center justify-center gap-2 bg-emerald-400 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black transition hover:bg-emerald-300 disabled:bg-slate-100 disabled:text-slate-400"><CheckCircle2 className="h-3.5 w-3.5" /> Check-in đã chọn ({selectedTicketIds.length})</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                <tr><th className="w-12 px-5 py-3"><span className="sr-only">Chọn</span></th><th className="px-3 py-3">Booking</th><th className="px-3 py-3">Khách hàng</th><th className="px-3 py-3">Ghế</th><th className="px-3 py-3">Thanh toán</th><th className="px-3 py-3">Trạng thái vé</th><th className="px-3 py-3">Thời gian check-in</th><th className="px-5 py-3 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="staff-table-row transition hover:bg-emerald-50/50">
                    <td className="px-5 py-4"><input type="checkbox" checked={selectedTicketIds.includes(ticket.id)} disabled={ticket.status === 'USED'} onChange={(event) => setSelectedTicketIds((current) => event.target.checked ? [...current, ticket.id] : current.filter((id) => id !== ticket.id))} className="h-3.5 w-3.5 accent-emerald-400 disabled:opacity-20" /></td>
                    <td className="px-3 py-4"><p className="font-mono text-[11px] font-black text-slate-900">{ticket.bookingCode}</p><p className="mt-1 font-mono text-[8px] text-slate-300">{ticket.id}</p></td>
                    <td className="px-3 py-4"><p className="text-xs font-bold">{ticket.customer}</p><p className="mt-1 text-[9px] text-slate-400">{ticket.phone}</p></td>
                    <td className="px-3 py-4"><span className="text-sm font-black text-slate-900">{ticket.seat}</span><span className="ml-2 text-[9px] font-bold text-slate-400">{ticket.seatType}</span></td>
                    <td className="px-3 py-4"><span className={`text-[9px] font-black uppercase tracking-wider ${ticket.payment === 'PAID' ? 'text-emerald-700' : 'text-rose-700'}`}>{ticket.payment === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td>
                    <td className="px-3 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-3 py-4"><p className="text-[10px] font-bold text-slate-600">{ticket.checkedAt || '--:--'}</p><p className="mt-1 text-[8px] text-slate-300">{ticket.checkedBy || 'Chưa có'}</p></td>
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => checkInTicket(ticket)} disabled={ticket.status === 'USED'} className="border border-slate-200 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-900 transition hover:border-emerald-400 hover:text-emerald-700 disabled:border-slate-100 disabled:text-slate-300">{ticket.status === 'USED' ? 'Đã xác nhận' : 'Xác nhận'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:flex-row sm:items-center">
            <span>Hiển thị {filteredTickets.length} / {showtimeTickets.length} vé của suất chiếu</span>
            <span className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" /> Cập nhật lần cuối: vừa xong</span>
          </div>
        </section>
      </main>
    </div>
  );
}

