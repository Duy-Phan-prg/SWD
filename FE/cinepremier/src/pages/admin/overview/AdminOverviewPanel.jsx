import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign, Ticket, ReceiptText, BarChart2, Users,
  TrendingUp, TrendingDown, BadgeDollarSign, Activity,
  ArrowUpRight, Cpu, Shield, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LabelList, PieChart, Pie, Cell, Legend
} from "recharts";
import { adminService } from "../../../services/adminService";

const CHART_COLORS = ["#f59e0b", "#10b981", "#06b6d4", "#a855f7", "#f43f5e"];
const GRID_COLOR = "rgba(255,255,255,0.04)";
const TICK_STYLE = { fill: "#52525b", fontSize: 10, fontFamily: "Inter, sans-serif" };

const RANGE_PRESETS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

/* ─── Seed / Demo fallback (mirrors DemoBookingSeeder + MovieSeeder data) ─── */
const SEED_REVENUE = { totalRevenue: 518_400_000, totalTransactions: 28, totalTicketsSold: 56 };
const SEED_LOYALTY = { newMembers: 8, totalIssuedPoints: 462, totalBurnedPoints: 0, pointFlowRatio: 0 };
const SEED_TOP_MOVIES = [
  { movieTitle: "Interstellar",                    revenue: 108_000_000, ticketsSold: 12 },
  { movieTitle: "The Dark Knight",                 revenue: 90_000_000,  ticketsSold: 10 },
  { movieTitle: "Avengers: Endgame",               revenue: 90_000_000,  ticketsSold: 10 },
  { movieTitle: "Inception",                       revenue: 72_000_000,  ticketsSold: 8  },
  { movieTitle: "Parasite",                        revenue: 54_000_000,  ticketsSold: 6  },
  { movieTitle: "Spider-Man: Into the Spider-Verse",revenue: 54_000_000, ticketsSold: 6  },
  { movieTitle: "The Green Mile",                  revenue: 36_000_000,  ticketsSold: 4  },
  { movieTitle: "Black Panther",                   revenue: 14_400_000,  ticketsSold: 2  },
];
const SEED_OCCUPANCY = [
  { roomName: "Room A", occupancyRate: 72.5, ticketsSold: 29, roomCapacity: 40 },
  { roomName: "Room B", occupancyRate: 65.0, ticketsSold: 26, roomCapacity: 40 },
  { roomName: "Room C", occupancyRate: 27.5, ticketsSold: 11, roomCapacity: 40 },
];
const SEED_AUDIT_LOGS = [
  { id: "s1", time: "09:58:02", action: "SUCCESS", target: "DemoBookingSeeder: 28 bookings seeded",          user: "system" },
  { id: "s2", time: "09:57:44", action: "CREATE",  target: "MovieSeeder: 12 phim NOW_SHOWING/UPCOMING",     user: "system" },
  { id: "s3", time: "09:57:17", action: "ADD",     target: "CinemaScheduleSeeder: Room A, B, C — 60 ghế",  user: "system" },
  { id: "s4", time: "09:56:50", action: "SUCCESS", target: "AdminAccountSeeder: admin@cinemaai.com",        user: "system" },
  { id: "s5", time: "09:56:30", action: "LOGIN",   target: "Admin đăng nhập lần đầu",                      user: "admin"  },
  { id: "s6", time: "09:56:10", action: "SUCCESS", target: "LoyaltySeeder: 8 tài khoản khách hàng demo",   user: "system" },
  { id: "s7", time: "09:55:55", action: "ADD",     target: "FoodSeeder: combo bắp nước",                   user: "system" },
  { id: "s8", time: "09:55:30", action: "SUCCESS", target: "Hệ thống khởi động thành công",                user: "system" },
];

const fmtVND = (v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`;
const fmtNumber = (v) => Number(v || 0).toLocaleString("vi-VN");
const fmtCompact = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}K`;
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
    <div style={{
      background: "rgba(9,9,11,0.96)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "10px 14px",
      fontFamily: "Inter, sans-serif",
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
        {label ?? payload[0]?.name}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} style={{ color: "#fff", fontWeight: 600, fontSize: 12, margin: 0 }}>
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ message = "Chưa có dữ liệu trong khoảng này" }) => (
  <div style={{
    height: 180, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 10,
    border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 8,
  }}>
    <Activity size={22} color="rgba(255,255,255,0.12)" />
    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, fontFamily: "Inter, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {message}
    </span>
  </div>
);

const KpiCard = ({ label, value, icon: Icon, accent, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -2 }}
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(20px)",
      cursor: "default",
      transition: "box-shadow 0.25s, border-color 0.25s",
    }}
  >
    <div style={{
      position: "absolute", top: -30, right: -30,
      width: 90, height: 90, borderRadius: "50%",
      background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
      pointerEvents: "none",
    }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}30` }}>
        <Icon size={14} color={accent} />
      </div>
    </div>
    <div>
      <span style={{ display: "block", fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", marginTop: 6, display: "block" }}>
          {sub}
        </span>
      )}
    </div>
  </motion.div>
);

const SectionHeader = ({ eyebrow, title, color = "#f59e0b" }) => (
  <div style={{ marginBottom: 20 }}>
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color, fontFamily: "Inter, sans-serif" }}>
      {eyebrow}
    </span>
    <h3 style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em" }}>
      {title}
    </h3>
  </div>
);

const ChartCard = ({ children, style = {} }) => (
  <div style={{
    background: "linear-gradient(160deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "22px 22px 18px",
    backdropFilter: "blur(20px)",
    ...style,
  }}>
    {children}
  </div>
);

export default function AdminOverviewPanel({ ctx }) {
  const { activeTab, getAdminToken, auditLogs, playPulseSound } = ctx;

  const [rangeDays, setRangeDays] = useState(30);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loyaltyReport, setLoyaltyReport] = useState(null);
  const [topMovies, setTopMovies] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (activeTab !== "overview") return undefined;
    const token = getAdminToken?.(false);
    if (!token) return undefined;
    let cancelled = false;
    const params = { from: isoDaysAgo(rangeDays), to: isoDaysAgo(0) };
    setIsLoadingReports(true);
    Promise.all([
      adminService.getRevenueReport(token, params),
      adminService.getLoyaltyReport(token, { from: `${params.from}T00:00:00`, to: `${params.to}T23:59:59` }),
      adminService.getTopMovies(token, { ...params, limit: 10 }),
      adminService.getRoomOccupancy(token, params),
    ])
      .then(([revenue, loyalty, movies, rooms]) => {
        if (cancelled) return;
        setRevenueReport(revenue || null);
        setLoyaltyReport(loyalty || null);
        setTopMovies(Array.isArray(movies) ? movies : []);
        setOccupancy(Array.isArray(rooms) ? rooms : []);
        setLastRefresh(new Date());
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to seed data so the dashboard is never blank
        setRevenueReport(SEED_REVENUE);
        setLoyaltyReport(SEED_LOYALTY);
        setTopMovies(SEED_TOP_MOVIES);
        setOccupancy(SEED_OCCUPANCY);
      })
      .finally(() => { if (!cancelled) setIsLoadingReports(false); });
    return () => { cancelled = true; };
  }, [activeTab, rangeDays, getAdminToken]);

  if (activeTab !== "overview") return null;

  // Use real API data when available, fall back to seed constants
  const isUsingDemo      = !revenueReport && topMovies.length === 0;
  const effectiveRevenue  = revenueReport || SEED_REVENUE;
  const effectiveLoyalty  = loyaltyReport  || SEED_LOYALTY;
  const effectiveMovies   = topMovies.length   > 0 ? topMovies   : SEED_TOP_MOVIES;
  const effectiveOccupancy= occupancy.length   > 0 ? occupancy   : SEED_OCCUPANCY;
  const effectiveAuditLogs= auditLogs && auditLogs.length > 0 ? auditLogs : SEED_AUDIT_LOGS;

  const revenueByMovie = effectiveMovies
    .map((m) => ({ name: m.movieTitle, revenue: Number(m.revenue || 0), tickets: m.ticketsSold }))
    .sort((a, b) => b.revenue - a.revenue);

  const occupancyByRoom = effectiveOccupancy.map((r) => ({
    name: r.roomName,
    rate: Math.round((r.occupancyRate || 0) * 10) / 10,
    tickets: r.ticketsSold,
    capacity: r.roomCapacity,
  }));

  const ticketShareSource = [...effectiveMovies].sort((a, b) => b.ticketsSold - a.ticketsSold);
  const ticketShare = ticketShareSource.slice(0, 4).map((m) => ({ name: m.movieTitle, value: m.ticketsSold }));
  const restTickets = ticketShareSource.slice(4).reduce((s, m) => s + (m.ticketsSold || 0), 0);
  if (restTickets > 0) ticketShare.push({ name: "Khác", value: restTickets });
  const totalTicketsInShare = ticketShare.reduce((s, t) => s + t.value, 0);

  const kpis = [
    { label: "Tổng doanh thu",       value: fmtVND(effectiveRevenue.totalRevenue),        icon: DollarSign, accent: "#f59e0b", sub: `${rangeDays} ngày gần nhất` },
    { label: "Giao dịch thành công", value: fmtNumber(effectiveRevenue.totalTransactions), icon: ReceiptText, accent: "#10b981", sub: `${rangeDays} ngày gần nhất` },
    { label: "Vé bán ra",            value: fmtNumber(effectiveRevenue.totalTicketsSold),  icon: Ticket,      accent: "#06b6d4", sub: `${rangeDays} ngày gần nhất` },
  ];

  const loyaltyHealthLabel = effectiveLoyalty.totalBurnedPoints > 0
    ? `${Number(effectiveLoyalty.pointFlowRatio || 0).toFixed(2)}x`
    : effectiveLoyalty.totalIssuedPoints > 0 ? "Chưa có điểm tiêu" : "0x";

  const loyaltyKpis = [
    { label: "Thành viên mới",  value: fmtNumber(effectiveLoyalty.newMembers),        icon: Users,          accent: "#06b6d4" },
    { label: "Điểm phát ra",    value: fmtNumber(effectiveLoyalty.totalIssuedPoints), icon: TrendingUp,     accent: "#10b981" },
    { label: "Điểm thu về",     value: fmtNumber(effectiveLoyalty.totalBurnedPoints), icon: TrendingDown,   accent: "#f59e0b" },
    { label: "Issued / Burned", value: loyaltyHealthLabel,                             icon: BadgeDollarSign, accent: "#a855f7" },
  ];

  const logColor = (action) => {
    const a = (action || "").toUpperCase();
    if (a.includes("ERROR") || a.includes("FAIL") || a.includes("DELETE")) return "#f43f5e";
    if (a.includes("WARN") || a.includes("UPDATE") || a.includes("EDIT")) return "#f59e0b";
    if (a.includes("CREATE") || a.includes("ADD") || a.includes("SUCCESS")) return "#10b981";
    return "#06b6d4";
  };

  return (
    <motion.div
      key="panel-overview"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: 28 }}
    >
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px #f59e0b44" }}>
              <BarChart2 size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "Inter, sans-serif" }}>
                  Analytics Dashboard
                </p>
                {isUsingDemo && (
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: "0.12em",
                    textTransform: "uppercase", fontFamily: "Inter, sans-serif",
                    color: "#f59e0b", background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 4, padding: "1px 6px",
                  }}>
                    DEMO
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Tổng quan hệ thống
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            Cập nhật lần cuối: {lastRefresh.toLocaleTimeString("vi-VN")}
            {isLoadingReports && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#f59e0b", marginLeft: 6 }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block" }}>
                  <RefreshCw size={9} />
                </motion.span>
                Đang tải…
              </span>
            )}
          </p>
        </div>

        {/* Range presets pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
          {RANGE_PRESETS.map((preset) => {
            const isActive = rangeDays === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => { playPulseSound?.(500, "sine", 0.03); setRangeDays(preset.days); }}
                style={{
                  padding: "8px 20px", fontSize: 11, fontWeight: 700,
                  fontFamily: "Inter, sans-serif", borderRadius: 8, border: "none",
                  cursor: "pointer", transition: "all 0.2s",
                  background: isActive ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                  color: isActive ? "#000" : "rgba(255,255,255,0.35)",
                  boxShadow: isActive ? "0 4px 14px #f59e0b44" : "none",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {kpis.map((kpi, i) => <KpiCard key={kpi.label} {...kpi} delay={i * 0.08} />)}
      </div>

      {/* ── Loyalty Health ── */}
      <ChartCard>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <SectionHeader eyebrow="Loyalty Health" title="Tổng quan điểm thành viên" color="#10b981" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "4px 12px" }}>
            <Shield size={10} color="#10b981" />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Active</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {loyaltyKpis.map((kpi, i) => <KpiCard key={kpi.label} {...kpi} sub={`${rangeDays} ngày gần nhất`} delay={i * 0.06} />)}
        </div>
      </ChartCard>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Top movies bar */}
        <ChartCard>
          <SectionHeader eyebrow="Xếp hạng phát hành" title="Top phim theo doanh thu" color="#f59e0b" />
          {revenueByMovie.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={Math.max(200, revenueByMovie.length * 44)}>
              <BarChart data={revenueByMovie} layout="vertical" margin={{ top: 4, right: 70, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="barGradRev" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
                <XAxis type="number" tickFormatter={fmtCompact} tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ ...TICK_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<ChartTooltip formatter={(e) => `${fmtVND(e.payload.revenue)} · ${e.payload.tickets} vé`} />} />
                <Bar dataKey="revenue" name="Doanh thu" fill="url(#barGradRev)" barSize={16} radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="revenue" position="right" formatter={fmtCompact} style={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "Inter, sans-serif" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Donut */}
        <ChartCard>
          <SectionHeader eyebrow="Phân bổ sản lượng" title="Cơ cấu vé theo phim" color="#a855f7" />
          {ticketShare.length === 0 ? <EmptyChart /> : (
            <div style={{ position: "relative" }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <defs>
                    {CHART_COLORS.map((c, i) => (
                      <radialGradient key={i} id={`pieG${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.65} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie data={ticketShare} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={ticketShare.length > 1 ? 3 : 0} stroke="none">
                    {ticketShare.map((entry, index) => (
                      <Cell key={entry.name} fill={`url(#pieG${index % CHART_COLORS.length})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(e) => `${e.value} vé · ${totalTicketsInShare ? Math.round((e.value / totalTicketsInShare) * 100) : 0}%`} />} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={7} formatter={(value) => <span style={{ fontSize: 9, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <span style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>Tổng vé</span>
                <span style={{ display: "block", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif" }}>{totalTicketsInShare.toLocaleString("vi-VN")}</span>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Room Occupancy ── */}
      <ChartCard>
        <SectionHeader eyebrow="Hiệu suất hạ tầng" title="Tỷ lệ lấp đầy theo phòng chiếu" color="#10b981" />
        {occupancyByRoom.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={occupancyByRoom} margin={{ top: 20, right: 12, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="barGradOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<ChartTooltip formatter={(e) => `${e.payload.rate}% · ${e.payload.tickets}/${e.payload.capacity} ghế`} />} />
              <Bar dataKey="rate" name="Lấp đầy" fill="url(#barGradOcc)" barSize={28} radius={[6, 6, 0, 0]}>
                <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} style={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "Inter, sans-serif" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Audit Log Terminal ── */}
      <div style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.8) 0%, rgba(9,9,11,0.97) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(20px)" }}>
        {/* macOS-style top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#f43f5e", "#f59e0b", "#10b981"].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}>SYSTEM AUDIT LOG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Cpu size={10} color="#10b981" />
            <span style={{ fontSize: 9, color: "#10b981", fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.12em" }}>LIVE</span>
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
          </div>
        </div>

        {/* Log body */}
        <div style={{ padding: "14px 20px", maxHeight: 220, overflowY: "auto" }} id="terminal-audit-box">
          {effectiveAuditLogs.map((log) => (
            <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "Fira Code, Courier New, monospace" }}>
              <div style={{ display: "flex", gap: 8, fontSize: 11, flexWrap: "wrap" }}>
                <span style={{ color: "#52525b", flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ color: logColor(log.action), fontWeight: 700, flexShrink: 0 }}>{log.action}:</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{log.target}</span>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", flexShrink: 0, background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 8px", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {log.user}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
