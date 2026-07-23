import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, RefreshCw, Search, Calendar, User, Ticket,
  DollarSign, FileText, CheckCircle2, ChevronDown, ChevronUp,
  Printer, ShieldAlert, Clock, ArrowLeft, Filter, Sparkles
} from 'lucide-react';
import { getStoredAuth } from '../../../services/authService';
import { adminService } from '../../../services/adminService';

const fmtVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function AdminShowtimeIncidentsPanel({ ctx }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedShowtimeId, setExpandedShowtimeId] = useState(null);

  const getAdminToken = () => {
    const { accessToken } = getStoredAuth();
    return accessToken;
  };

  const fetchReport = async () => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await adminService.getShowtimeIncidentsReport(token, params);
      const data = res?.data || res || {};
      setReport(data);
      if (data?.incidents?.length > 0 && expandedShowtimeId === null) {
        setExpandedShowtimeId(data.incidents[0].showtimeId);
      }
    } catch (e) {
      setError(e.message || 'Không thể tải báo cáo sự cố hủy suất chiếu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  // Client-side filtering by search query (Movie Title, Customer Name, Email, Booking Code)
  const filteredIncidents = useMemo(() => {
    if (!report?.incidents) return [];
    if (!searchQuery.trim()) return report.incidents;

    const q = searchQuery.toLowerCase().trim();
    return report.incidents.filter((incident) => {
      const matchMovie = (incident.movieTitle || '').toLowerCase().includes(q);
      const matchReason = (incident.cancellationReason || '').toLowerCase().includes(q);
      const matchRoom = (incident.roomName || '').toLowerCase().includes(q);
      const matchUsers = incident.refundedUsers?.some((u) =>
        (u.userName || '').toLowerCase().includes(q) ||
        (u.userEmail || '').toLowerCase().includes(q) ||
        (u.bookingCode || '').toLowerCase().includes(q) ||
        (u.userPhone || '').toLowerCase().includes(q)
      );
      return matchMovie || matchReason || matchRoom || matchUsers;
    });
  }, [report, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedShowtimeId(expandedShowtimeId === id ? null : id);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 font-mono">
              Báo Cáo Sự Cố &amp; Hoàn Tiền Rạp
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-serif italic text-white uppercase tracking-wider font-bold">
            Thống Kê Suất Chiếu Hủy &amp; Tài Khoản Hoàn Tiền
          </h1>
          <p className="mt-1 text-xs text-neutral-400 font-sans">
            Theo dõi chi tiết các suất chiếu tạm dừng do sự cố kỹ thuật/vận hành và lịch sử tài khoản khách hàng được hoàn tiền.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 border border-white/10 bg-neutral-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300 transition hover:bg-neutral-800 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500 hover:text-black cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="border border-amber-500/20 bg-gradient-to-br from-[#120f08] to-[#080704] p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">Suất Chiếu Hủy</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-white tracking-wider">
            {report?.totalCancelledShowtimes ?? 0} <span className="text-xs font-sans text-neutral-400 font-normal">suất</span>
          </div>
          <p className="text-[10px] text-neutral-400 font-sans">Tổng sự cố suất chiếu phát sinh</p>
        </div>

        <div className="border border-emerald-500/20 bg-gradient-to-br from-[#08120d] to-[#040805] p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">Đơn/Vé Đã Hoàn</span>
            <Ticket className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-400 tracking-wider">
            {report?.totalRefundedBookings ?? 0} <span className="text-xs font-sans text-neutral-400 font-normal">đơn</span>
          </div>
          <p className="text-[10px] text-neutral-400 font-sans">Tổng đơn hàng đã xử lý hoàn tiền</p>
        </div>

        <div className="border border-sky-500/20 bg-gradient-to-br from-[#081014] to-[#040608] p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-sky-400">Tổng Tiền Hoàn Trả</span>
            <DollarSign className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-sky-300 tracking-wider">
            {fmtVND(report?.totalRefundedAmount)}
          </div>
          <p className="text-[10px] text-neutral-400 font-sans">Hoàn về Ví CineWallet khách hàng</p>
        </div>

        <div className="border border-purple-500/20 bg-gradient-to-br from-[#100814] to-[#060408] p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-400">Tài Khoản Khách Hàng</span>
            <User className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-purple-300 tracking-wider">
            {report?.totalRefundedUsers ?? 0} <span className="text-xs font-sans text-neutral-400 font-normal">khách</span>
          </div>
          <p className="text-[10px] text-neutral-400 font-sans">Tài khoản ảnh hưởng được đền bù</p>
        </div>

      </div>

      {/* FILTER CONTROLS */}
      <div className="border border-white/10 bg-[#090909] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên phim, lý do, họ tên khách, email, mã vé..."
              className="w-full border border-white/10 bg-black pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto text-xs font-sans">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-400 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* INCIDENT DETAILS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="border border-white/5 bg-[#080808] p-12 text-center text-xs text-neutral-400 space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500" />
            <p className="uppercase tracking-widest font-mono">Đang tải dữ liệu sự cố &amp; hoàn tiền...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-[#070707] p-12 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto" />
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Không Có Sự Cố Nào Được Ghi Nhận</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Không tìm thấy suất chiếu bị hủy trong khoảng thời gian được chọn hoặc không có dữ liệu trùng khớp với từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident, idx) => {
            const isExpanded = expandedShowtimeId === incident.showtimeId;
            return (
              <div
                key={incident.showtimeId || idx}
                className="border border-white/10 bg-[#0A0A0A] overflow-hidden transition duration-200 hover:border-white/20"
              >
                {/* SHOWTIME HEADER */}
                <div
                  onClick={() => toggleExpand(incident.showtimeId)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-[#0C0C0C] via-[#0E0E0E] to-[#0A0A0A] border-b border-white/5 hover:bg-neutral-900/60 transition"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                        SUẤT #{incident.showtimeId}
                      </span>
                      <span className="bg-red-950/40 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> ĐÃ HỦY DO SỰ CỐ
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        | {incident.cinemaName || 'Rạp'} - {incident.roomName || 'Phòng chiếu'}
                      </span>
                    </div>

                    <h2 className="text-base font-serif font-bold text-white uppercase tracking-wide">
                      {incident.movieTitle || 'Phim chưa xác định'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-sans">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                        Giờ chiếu: <strong className="text-white font-mono">{fmtDateTime(incident.showtimeStart)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                        Thời điểm hủy: <strong className="text-white font-mono">{fmtDateTime(incident.cancelledAt)}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-amber-300/90 font-sans italic bg-amber-950/20 border border-amber-500/20 px-3 py-1.5 mt-2 rounded-sm inline-block">
                      Lý do hủy: {incident.cancellationReason || 'Sự cố vận hành rạp'}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Tổng Hoàn Trả</div>
                      <div className="text-lg font-serif font-bold text-emerald-400">
                        {fmtVND(incident.totalRefundedAmount)}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {incident.refundedBookingsCount} đơn ({incident.refundedUsers?.length ?? 0} vé)
                      </div>
                    </div>

                    <button
                      className="p-2 border border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                      title={isExpanded ? 'Thu gọn' : 'Xem danh sách tài khoản'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED REFUNDED ACCOUNTS TABLE */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 sm:p-5 space-y-3 bg-black/60"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[11px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-2">
                          <User className="h-3.5 w-3.5" /> Danh Sách Khách Hàng Được Hoàn Tiền ({incident.refundedUsers?.length ?? 0})
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Tự động hoàn tiền vào CineWallet của tài khoản khách
                        </span>
                      </div>

                      {(!incident.refundedUsers || incident.refundedUsers.length === 0) ? (
                        <div className="p-6 text-center text-xs text-neutral-500 italic">
                          Chưa có đơn hàng thanh toán nào bị ảnh hưởng/hoàn tiền trong suất chiếu này.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-white/5">
                          <table className="w-full text-left text-xs text-neutral-300">
                            <thead className="border-b border-white/10 bg-neutral-900/90 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Mã Vé / Booking</th>
                                <th className="p-3">Tài Khoản Khách Hàng</th>
                                <th className="p-3">Liên Hệ</th>
                                <th className="p-3">Vị Trí Ghế</th>
                                <th className="p-3">Số Tiền Hoàn</th>
                                <th className="p-3">Phương Thức</th>
                                <th className="p-3">Thời Gian Hoàn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-sans">
                              {incident.refundedUsers.map((userRefund, uIdx) => (
                                <tr key={userRefund.bookingId || uIdx} className="hover:bg-white/[0.02] transition">
                                  <td className="p-3 text-neutral-500 font-mono">{uIdx + 1}</td>
                                  <td className="p-3">
                                    <span className="font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 text-[11px]">
                                      {userRefund.bookingCode || `BK-${userRefund.bookingId}`}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-white">{userRefund.userName || 'Khách hàng'}</div>
                                    <div className="text-[10px] font-mono text-neutral-500">ID: USER-{userRefund.userId}</div>
                                  </td>
                                  <td className="p-3 font-mono text-[11px]">
                                    <div className="text-neutral-300">{userRefund.userEmail || '—'}</div>
                                    <div className="text-neutral-400">{userRefund.userPhone || '—'}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono text-xs text-amber-300">
                                      {userRefund.seatLabels || '—'}
                                    </span>
                                  </td>
                                  <td className="p-3 font-serif font-bold text-emerald-400">
                                    {fmtVND(userRefund.amount)}
                                  </td>
                                  <td className="p-3">
                                    <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                                      {userRefund.refundMethod === 'CINEWALLET' ? 'VÍ CINEWALLET' : (userRefund.refundMethod || 'CINEWALLET')}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-neutral-400">
                                    {fmtDateTime(userRefund.refundedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
