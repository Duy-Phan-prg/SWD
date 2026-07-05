import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Ticket, ReceiptText, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminService } from '../../../services/adminService';

// Categorical palette — validated for dark surface #0a0a0a (dataviz six checks: PASS).
// Fixed order, never cycled; slot 1 doubles as the single-series bar hue.
const CHART_COLORS = ['#d97706', '#059669', '#0891b2', '#a855f7', '#f43f5e'];
const GRID_COLOR = '#1d1d21';
const TICK_STYLE = { fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' };

const RANGE_PRESETS = [
  { days: 7, label: '7 NGÀY' },
  { days: 30, label: '30 NGÀY' },
  { days: 90, label: '90 NGÀY' }
];

const fmtVND = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const fmtCompact = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`;
  return String(n);
};
const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/90 border border-neutral-800 px-3 py-2 font-mono text-[10.5px] text-neutral-300 shadow-lg">
      <p className="text-amber-400 font-extrabold mb-0.5">{label ?? payload[0]?.name}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="text-white font-bold">
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ message = 'Chưa có dữ liệu trong khoảng này' }) => (
  <div className="flex h-48 items-center justify-center border border-dashed border-white/10 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
    {message}
  </div>
);

export default function AdminOverviewPanel({ ctx }) {
  const { activeTab, getAdminToken, auditLogs, playPulseSound } = ctx;

  const [rangeDays, setRangeDays] = useState(30);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [revenueReport, setRevenueReport] = useState(null);
  const [topMovies, setTopMovies] = useState([]);
  const [occupancy, setOccupancy] = useState([]);

  useEffect(() => {
    if (activeTab !== 'overview') return undefined;
    const token = getAdminToken?.(false);
    if (!token) return undefined;

    let cancelled = false;
    const params = { from: isoDaysAgo(rangeDays), to: isoDaysAgo(0) };
    setIsLoadingReports(true);
    Promise.all([
      adminService.getRevenueReport(token, params),
      adminService.getTopMovies(token, { ...params, limit: 10 }),
      adminService.getRoomOccupancy(token, params)
    ])
      .then(([revenue, movies, rooms]) => {
        if (cancelled) return;
        setRevenueReport(revenue || null);
        setTopMovies(Array.isArray(movies) ? movies : []);
        setOccupancy(Array.isArray(rooms) ? rooms : []);
      })
      .catch(() => {
        if (cancelled) return;
        setRevenueReport(null);
        setTopMovies([]);
        setOccupancy([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReports(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, rangeDays, getAdminToken]);

  if (activeTab !== 'overview') return null;

  const revenueByMovie = topMovies
    .map((m) => ({ name: m.movieTitle, revenue: Number(m.revenue || 0), tickets: m.ticketsSold }))
    .sort((a, b) => b.revenue - a.revenue);

  const occupancyByRoom = occupancy.map((r) => ({
    name: r.roomName,
    rate: Math.round((r.occupancyRate || 0) * 10) / 10,
    tickets: r.ticketsSold,
    capacity: r.roomCapacity
  }));

  // Donut: ticket share by movie — top 4 slices + "Khác" (fixed-order palette, never cycled).
  const ticketShareSource = [...topMovies].sort((a, b) => b.ticketsSold - a.ticketsSold);
  const ticketShare = ticketShareSource.slice(0, 4).map((m) => ({ name: m.movieTitle, value: m.ticketsSold }));
  const restTickets = ticketShareSource.slice(4).reduce((sum, m) => sum + (m.ticketsSold || 0), 0);
  if (restTickets > 0) ticketShare.push({ name: 'Khác', value: restTickets });
  const totalTicketsInShare = ticketShare.reduce((sum, s) => sum + s.value, 0);

  const kpis = [
    { label: 'Tổng doanh thu', value: revenueReport ? fmtVND(revenueReport.totalRevenue) : '—', icon: DollarSign, tone: 'text-amber-500 bg-amber-500/10' },
    { label: 'Giao dịch thành công', value: revenueReport ? Number(revenueReport.totalTransactions || 0).toLocaleString('vi-VN') : '—', icon: ReceiptText, tone: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Vé bán ra', value: revenueReport ? Number(revenueReport.totalTicketsSold || 0).toLocaleString('vi-VN') : '—', icon: Ticket, tone: 'text-cyan-500 bg-cyan-500/10' }
  ];

  return (
    <motion.div
      key="panel-overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header: title + time-range presets */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[8px] font-mono tracking-widest text-amber-500 uppercase font-black">THỐNG KÊ VẬN HÀNH THEO DỮ LIỆU THẬT</span>
          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <BarChart2 className="h-3.5 w-3.5 text-amber-500" />
            Tổng quan doanh thu &amp; sản lượng
            {isLoadingReports && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => {
                playPulseSound?.(500, 'sine', 0.03);
                setRangeDays(preset.days);
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-black tracking-widest uppercase border transition ${
                rangeDays === preset.days
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-400'
                  : 'border-neutral-850 bg-black text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip — real numbers from /reports/revenue for the selected range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-neutral-850 p-5 space-y-2.5 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-wider font-extrabold text-[#7E8B93] uppercase font-sans">{kpi.label}</span>
              <span className={`p-1 ${kpi.tone}`}><kpi.icon className="h-3.5 w-3.5" /></span>
            </div>
            <p className="text-xl sm:text-2xl font-mono font-black text-white">{kpi.value}</p>
            <p className="text-[8.5px] font-mono text-neutral-600 uppercase">{rangeDays} ngày gần nhất</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top movies by revenue — horizontal bars, single hue, value at bar tip */}
        <div className="col-span-1 lg:col-span-2 border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-[8px] font-mono tracking-widest text-amber-500 uppercase font-black">XẾP HẠNG PHÁT HÀNH</span>
            <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Top phim theo doanh thu</h3>
          </div>
          {revenueByMovie.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, revenueByMovie.length * 42)}>
              <BarChart data={revenueByMovie} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }}>
                <CartesianGrid horizontal={false} stroke={GRID_COLOR} strokeWidth={1} />
                <XAxis type="number" tickFormatter={fmtCompact} tick={TICK_STYLE} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={<ChartTooltip formatter={(entry) => `${fmtVND(entry.payload.revenue)} · ${entry.payload.tickets} vé`} />}
                />
                <Bar dataKey="revenue" name="Doanh thu" fill={CHART_COLORS[0]} barSize={18} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="revenue" position="right" formatter={fmtCompact} style={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ticket share donut — categorical identity, fixed palette order, legend always on */}
        <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-[8px] font-mono tracking-widest text-[#a855f7] uppercase font-black">PHÂN BỔ SẢN LƯỢNG</span>
            <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Cơ cấu vé theo phim</h3>
          </div>
          {ticketShare.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={ticketShare}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={ticketShare.length > 1 ? 2 : 0}
                    stroke="#0a0a0a"
                    strokeWidth={2}
                  >
                    {ticketShare.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(entry) => `${entry.value} vé (${totalTicketsInShare ? Math.round((entry.value / totalTicketsInShare) * 100) : 0}%)`} />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={7}
                    formatter={(value) => <span className="text-[9.5px] font-mono text-zinc-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="block text-[7.5px] font-mono text-neutral-500 uppercase tracking-wider font-bold">Tổng vé</span>
                <span className="block text-base font-mono font-black text-white">{totalTicketsInShare.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Room occupancy — columns, 0–100% domain */}
      <div className="border border-neutral-850 p-5 bg-gradient-to-b from-[#0a0a0a] to-[#030303] space-y-4">
        <div className="border-b border-zinc-900 pb-3">
          <span className="text-[8px] font-mono tracking-widest text-emerald-500 uppercase font-black">HIỆU SUẤT HẠ TẦNG</span>
          <h3 className="text-xs font-sans font-black uppercase tracking-wider text-neutral-300">Tỷ lệ lấp đầy theo phòng chiếu</h3>
        </div>
        {occupancyByRoom.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={occupancyByRoom} margin={{ top: 18, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
              <XAxis dataKey="name" tick={TICK_STYLE} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                content={<ChartTooltip formatter={(entry) => `${entry.payload.rate}% · ${entry.payload.tickets}/${entry.payload.capacity} ghế`} />}
              />
              <Bar dataKey="rate" name="Lấp đầy" fill={CHART_COLORS[1]} barSize={22} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} style={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Server Audit logs in pristine terminal view */}
      <div className="border border-neutral-850 bg-black p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
          <span className="text-[9.5px] font-black text-amber-500 tracking-widest uppercase">ĐỒNG HỒ GIAO DỊCH VÀ KIỂM TOÁN HỆ THỐNG</span>
          <span className="text-[8.5px] text-zinc-500 uppercase">SYSTEM LOG PROTOCOL</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2" id="terminal-audit-box">
          {auditLogs.map((log) => (
            <div key={log.id} className="text-[11px] flex justify-between gap-4 text-zinc-400">
              <div>
                <span className="text-[#6272A4] font-bold">[{log.time}]</span>{' '}
                <span className="text-amber-400 font-extrabold">{log.action}:</span>{' '}
                <span className="text-zinc-200">{log.target}</span>
              </div>
              <span className="text-zinc-500 shrink-0 uppercase text-[9.5px]">[{log.user}]</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
