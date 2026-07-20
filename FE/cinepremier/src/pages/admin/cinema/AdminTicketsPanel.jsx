import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Ticket } from 'lucide-react';
import { adminService } from '../../../services/adminService';

const STATUS_FILTERS = ['ALL', 'PAID', 'USED', 'HOLDING', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

const STATUS_META = {
  PAID: { label: 'Đã thanh toán', className: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' },
  USED: { label: 'Đã check-in', className: 'border-sky-500/30 bg-sky-950/30 text-sky-300' },
  HOLDING: { label: 'Đang giữ', className: 'border-amber-500/30 bg-amber-950/30 text-amber-300' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'border-amber-500/30 bg-amber-950/30 text-amber-300' },
  EXPIRED: { label: 'Hết hạn', className: 'border-neutral-600 bg-neutral-900 text-neutral-400' },
  CANCELLED: { label: 'Đã hủy', className: 'border-rose-500/30 bg-rose-950/30 text-rose-300' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'border-purple-500/30 bg-purple-950/30 text-purple-300' },
};

const TICKET_TYPE_LABELS = { ADULT: 'Người lớn', CHILD: 'Trẻ em', STUDENT: 'Sinh viên' };

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

/**
 * Panel quản lý vé — xem toàn bộ booking, ghế, loại vé, bắp nước kèm theo.
 * Row có thể expand để xem vé từng ghế (ticketCode), bắp nước, và flag dữ liệu thiếu.
 * Bộ lọc trạng thái + phân trang 15 đơn/trang.
 *
 * @param {{ getAdminToken: () => string|null, showToast: (msg: string) => void }} ctx
 */
export default function AdminTicketsPanel({ ctx }) {
  const { getAdminToken, showToast } = ctx;
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadBookings = async (nextPage = 0, status = statusFilter) => {
    const token = getAdminToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const params = { page: nextPage, size: 15 };
      if (status !== 'ALL') params.status = status;
      const data = await adminService.getAdminBookings(token, params);
      setBookings(data.items || []);
      setPage(data.page || 0);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
      setExpandedId(null);
    } catch (err) {
      showToast(err?.message || 'Không thể tải danh sách vé.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadBookings(0); }, []);

  const pageStats = useMemo(() => {
    const seats = bookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
    const foods = bookings.reduce((sum, b) => sum + (b.foods || []).reduce((s, f) => s + (f.quantity || 0), 0), 0);
    const revenue = bookings
      .filter((b) => ['PAID', 'USED'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    return { seats, foods, revenue };
  }, [bookings]);

  const missingDataFlags = (b) => {
    const flags = [];
    if (['PAID', 'USED'].includes(b.status)) {
      if (!b.qrCode) flags.push('Thiếu QR');
      if (!(b.seats || []).some((s) => s.ticketCode)) flags.push('Thiếu mã vé ghế');
      if (!(b.tickets || []).length) flags.push('Thiếu loại vé');
      if (!b.paymentAccount) flags.push('Thiếu TK thanh toán');
    }
    if (!b.customerName) flags.push('Thiếu tên KH');
    if (!b.customerPhone) flags.push('Thiếu SĐT');
    return flags;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-sans font-black uppercase tracking-[0.25em] text-amber-500">Quản lý rạp</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-sans font-black uppercase tracking-wide text-white">
            <Ticket className="h-5 w-5 text-amber-500" /> Quản Lý Vé
          </h2>
          <p className="mt-1 text-xs text-neutral-500">Vé đã bán gồm những gì, thiếu dữ liệu gì, kèm số lượng bắp nước đi theo từng đơn.</p>
        </div>
        <button
          onClick={() => loadBookings(page)}
          disabled={isLoading}
          className="flex items-center gap-2 border border-white/10 bg-black px-4 py-2.5 text-[10px] font-sans font-black uppercase tracking-widest text-neutral-300 transition hover:border-amber-500/50 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {/* Stat tiles của trang hiện tại */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Vé (ghế) trang này</p>
          <p className="mt-1 text-2xl font-black font-mono text-white">{pageStats.seats}</p>
        </div>
        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Bắp nước bán kèm</p>
          <p className="mt-1 text-2xl font-black font-mono text-amber-400">{pageStats.foods}</p>
        </div>
        <div className="border border-white/10 bg-[#0a0a0a] p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Doanh thu (đã trả)</p>
          <p className="mt-1 text-2xl font-black font-mono text-emerald-400">{formatVnd(pageStats.revenue)}</p>
        </div>
      </div>

      {/* Filter chips theo trạng thái */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); loadBookings(0, status); }}
            className={`border px-3 py-1.5 text-[9px] font-sans font-black uppercase tracking-widest transition ${
              statusFilter === status
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                : 'border-white/10 bg-black text-neutral-400 hover:border-white/30 hover:text-white'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : (STATUS_META[status]?.label || status)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-white/10 bg-[#050505]">
        <table className="min-w-full divide-y divide-white/10 text-left text-xs font-sans">
          <thead className="bg-[#0B0B0B] text-[9px] uppercase tracking-[0.15em] text-neutral-500 font-bold">
            <tr>
              <th className="px-4 py-3.5">Mã đơn</th>
              <th className="px-4 py-3.5">Phim / Suất</th>
              <th className="px-4 py-3.5">Ghế · Loại vé</th>
              <th className="px-4 py-3.5">Người mua</th>
              <th className="px-4 py-3.5">🍿</th>
              <th className="px-4 py-3.5">Tổng tiền</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-neutral-300">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">Đang tải danh sách vé…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">Không có vé nào khớp bộ lọc.</td></tr>
            ) : bookings.map((b) => {
              // USED + suất chưa kết thúc = vừa check-in (đang xem); kết thúc rồi = đã sử dụng
              const isWatching = b.status === 'USED' && b.showtimeEnd && Date.now() < new Date(b.showtimeEnd).getTime();
              const statusMeta = b.status === 'USED'
                ? (isWatching
                  ? { label: 'Đã check-in', className: 'border-sky-500/30 bg-sky-950/30 text-sky-300' }
                  : { label: 'Đã sử dụng', className: 'border-neutral-600 bg-neutral-900 text-neutral-400' })
                : (STATUS_META[b.status] || { label: b.status, className: 'border-white/10 bg-neutral-900 text-neutral-300' });
              const foodQty = (b.foods || []).reduce((s, f) => s + (f.quantity || 0), 0);
              const isExpanded = expandedId === b.id;
              const flags = missingDataFlags(b);
              return (
                <React.Fragment key={b.id}>
                  <tr className="cursor-pointer transition hover:bg-white/5" onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-white">{b.bookingCode}</td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-[180px] truncate font-bold text-white">{b.movieTitle}</p>
                      <p className="text-[10px] text-neutral-500">
                        {b.roomName} · {b.showtimeStart ? new Date(b.showtimeStart).toLocaleString('vi-VN') : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-[11px] text-amber-400">{(b.seats || []).map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') || '—'}</p>
                      <p className="text-[10px] text-neutral-500">
                        {(b.tickets || []).map((t) => `${TICKET_TYPE_LABELS[t.ticketType] || t.ticketType} ×${t.quantity}`).join(', ') || 'Chưa ghi loại vé'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-[150px] truncate font-bold text-white">{b.customerName || '—'}</p>
                      <p className="max-w-[150px] truncate text-[10px] text-neutral-500">{b.userEmail || b.customerPhone || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">{foodQty || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-white">{formatVnd(b.totalAmount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusMeta.className}`}>{statusMeta.label}</span>
                    </td>
                    <td className="px-4 py-3.5"><ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-black/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid gap-4 lg:grid-cols-3">
                          <div>
                            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Vé từng ghế</p>
                            <div className="space-y-1">
                              {(b.seats || []).map((s) => (
                                <div key={s.seatId} className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="font-mono text-white">{s.rowLabel}{s.seatNumber}</span>
                                  <span className="text-neutral-500">{TICKET_TYPE_LABELS[s.ticketType] || '—'}</span>
                                  <span className="font-mono text-neutral-400">{s.ticketCode || 'chưa có mã'}</span>
                                  <span className="font-mono text-white">{formatVnd(s.unitPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Bắp nước</p>
                            {(b.foods || []).length === 0 ? (
                              <p className="text-[11px] text-neutral-600">Không mua bắp nước</p>
                            ) : (b.foods || []).map((f, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px]">
                                <span className="truncate text-neutral-300">{f.name} ×{f.quantity}</span>
                                <span className="font-mono text-neutral-400">{formatVnd(f.totalPrice)}</span>
                              </div>
                            ))}
                            <p className="mt-3 text-[10px] text-neutral-500">
                              Thanh toán: {b.paidAt ? new Date(b.paidAt).toLocaleString('vi-VN') : '—'}
                              {b.paymentAccount ? ` · ${b.paymentAccount}` : ''}
                              {b.checkedInAt ? ` · Check-in: ${new Date(b.checkedInAt).toLocaleString('vi-VN')}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Dữ liệu vé</p>
                            {flags.length === 0 ? (
                              <span className="inline-block border border-emerald-500/30 bg-emerald-950/30 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">✓ Đầy đủ dữ liệu</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {flags.map((flag) => (
                                  <span key={flag} className="border border-rose-500/30 bg-rose-950/30 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-300">{flag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] font-sans font-black uppercase tracking-widest text-neutral-500">
        <span>{totalItems} đơn · Trang {page + 1}/{totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 0 || isLoading}
            onClick={() => loadBookings(page - 1)}
            className="flex items-center gap-1 border border-white/10 px-3 py-2 text-white transition hover:border-amber-500/50 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Trước
          </button>
          <button
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => loadBookings(page + 1)}
            className="flex items-center gap-1 border border-white/10 px-3 py-2 text-white transition hover:border-amber-500/50 disabled:opacity-30"
          >
            Sau <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
