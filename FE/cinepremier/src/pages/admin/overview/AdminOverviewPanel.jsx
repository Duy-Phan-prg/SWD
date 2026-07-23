import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign, Ticket, ReceiptText, BarChart2, Users,
  TrendingUp, TrendingDown, BadgeDollarSign, Activity,
  ArrowUpRight, Cpu, Shield, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LabelList, PieChart, Pie, Cell, Legend, AreaChart, Area
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

const fmtVND = (v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`;
const fmtNumber = (v) => Number(v || 0).toLocaleString("vi-VN");
const fmtCompact = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}K`;
  return String(n);
};
const isoDaysAgo = (days) => {
  // Ngày LOCAL, không dùng toISOString() (UTC) — trước 7h sáng VN sẽ bị lùi 1 ngày,
  // làm rơi mất giao dịch trong ngày khỏi báo cáo
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9,9,11,0.96)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 0,
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
    border: "1px dashed rgba(255,255,255,0.06)",
  }}>
    <Activity size={22} color="rgba(255,255,255,0.12)" />
    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, fontFamily: "Inter, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {message}
    </span>
  </div>
);

const KpiCard = ({ label, value, icon: Icon, accent, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    style={{
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
        {label}
      </span>
      <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${accent}35`, background: `${accent}0f` }}>
        <Icon size={12} color={accent} />
      </div>
    </div>
    <div>
      <span style={{ display: "block", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", marginTop: 5, display: "block" }}>
          {sub}
        </span>
      )}
    </div>
  </motion.div>
);

const SectionHeader = ({ eyebrow, title }) => (
  <div style={{ marginBottom: 16 }}>
    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
      {eyebrow}
    </span>
    <h3 style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif" }}>
      {title}
    </h3>
  </div>
);

const ChartCard = ({ children, style = {} }) => (
  <div style={{
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "18px 20px 16px",
    ...style,
  }}>
    {children}
  </div>
);

export default function AdminOverviewPanel({ ctx }) {
  const { activeTab, getAdminToken, playPulseSound } = ctx;

  const [rangeDays, setRangeDays] = useState(30);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loyaltyReport, setLoyaltyReport] = useState(null);
  const [topMovies, setTopMovies] = useState([]);
  const [dailyOccupancy, setDailyOccupancy] = useState([]);
  const [occupancyGroupBy, setOccupancyGroupBy] = useState("day"); // 'day' | 'week' | 'month'
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (activeTab !== "overview") return undefined;
    const token = getAdminToken?.(false);
    if (!token) return undefined;
    let cancelled = false;
    const params = { from: isoDaysAgo(rangeDays), to: isoDaysAgo(0) };
    setIsLoadingReports(true);
    Promise.all([
      adminService.getRevenueReport(token, params).catch(() => null),
      adminService.getLoyaltyReport(token, { from: `${params.from}T00:00:00`, to: `${params.to}T23:59:59` }).catch(() => null),
      adminService.getTopMovies(token, { ...params, limit: 10 }).catch(() => []),
      adminService.getAuditLogs(token, { page: 0, size: 8 }).catch(() => null),
      adminService.getDailyOccupancy(token, params).catch(() => []),
    ])
      .then(([revenue, loyalty, movies, audit, daily]) => {
        if (cancelled) return;
        setRevenueReport(revenue || null);
        setLoyaltyReport(loyalty || null);
        setTopMovies(Array.isArray(movies) ? movies : []);
        setDailyOccupancy(Array.isArray(daily) ? daily : []);
        setRecentAuditLogs((audit?.items || []).map((log) => ({
          id: log.id,
          time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString("vi-VN") : "--:--:--",
          action: log.action,
          target: `${log.targetType}${log.targetId ? ` #${log.targetId}` : ""}${log.detail ? ` — ${log.detail}` : ""}`,
          user: log.actorEmail || "hệ thống",
        })));
        setLastRefresh(new Date());
      })
      .finally(() => { if (!cancelled) setIsLoadingReports(false); });
    return () => { cancelled = true; };
  }, [activeTab, rangeDays, getAdminToken]);

  if (activeTab !== "overview") return null;

  // Chỉ dùng dữ liệu thật; DB rỗng thì hiện empty state, không còn số liệu SEED giả
  const effectiveRevenue = revenueReport || { totalRevenue: 0, totalTransactions: 0, totalTicketsSold: 0 };
  const effectiveLoyalty = loyaltyReport || { newMembers: 0, totalIssuedPoints: 0, totalBurnedPoints: 0, pointFlowRatio: 0 };
  const effectiveMovies = topMovies;
  const effectiveAuditLogs = recentAuditLogs;

  const revenueByMovie = effectiveMovies
    .map((m) => ({ name: m.movieTitle, revenue: Number(m.revenue || 0), tickets: m.ticketsSold }))
    .sort((a, b) => b.revenue - a.revenue);

  // Gộp dữ liệu lấp đầy theo mức Ngày / Tuần / Tháng do admin chọn
  const GROUP_LABELS = { day: "ngày", week: "tuần", month: "tháng" };
  const occupancyChartData = (() => {
    if (occupancyGroupBy === "day") {
      return dailyOccupancy.map((d) => ({
        label: d.date ? d.date.slice(5).split("-").reverse().join("/") : "",
        rate: Math.round((d.occupancyRate || 0) * 10) / 10,
        sold: d.ticketsSold,
        capacity: d.totalCapacity,
        shows: d.totalShowtimes,
      }));
    }
    const buckets = new Map();
    dailyOccupancy.forEach((d) => {
      if (!d.date) return;
      const date = new Date(`${d.date}T00:00:00`);
      let key; let label;
      if (occupancyGroupBy === "week") {
        // Đầu tuần = thứ Hai
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        key = monday.toISOString().slice(0, 10);
        label = `Tuần ${String(monday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        label = `Th${date.getMonth() + 1}/${date.getFullYear()}`;
      }
      const bucket = buckets.get(key) || { label, sold: 0, capacity: 0, shows: 0 };
      bucket.sold += d.ticketsSold || 0;
      bucket.capacity += d.totalCapacity || 0;
      bucket.shows += d.totalShowtimes || 0;
      buckets.set(key, bucket);
    });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, b]) => ({
        ...b,
        rate: b.capacity > 0 ? Math.round((b.sold / b.capacity) * 1000) / 10 : 0,
      }));
  })();

  const ticketShareSource = [...effectiveMovies].sort((a, b) => b.ticketsSold - a.ticketsSold);
  const ticketShare = ticketShareSource.slice(0, 4).map((m) => ({ name: m.movieTitle, value: m.ticketsSold }));
  const restTickets = ticketShareSource.slice(4).reduce((s, m) => s + (m.ticketsSold || 0), 0);
  if (restTickets > 0) ticketShare.push({ name: "Khác", value: restTickets });
  const totalTicketsInShare = ticketShare.reduce((s, t) => s + t.value, 0);

  const PROVIDER_LABELS = { CASH: "Tiền mặt (quầy)", VNPAY: "VNPay", MOMO: "MoMo", MOCK: "Demo" };
  const providerBreakdown = (effectiveRevenue.byProvider || [])
    .filter((p) => Number(p.revenue) > 0)
    .map((p) => ({ ...p, label: PROVIDER_LABELS[p.provider] || p.provider }));

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
            <div style={{ width: 32, height: 32, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={15} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace" }}>
                Analytics Dashboard
              </p>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                Tổng quan hệ thống
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
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

        {/* Range presets */}
        <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
          {RANGE_PRESETS.map((preset) => {
            const isActive = rangeDays === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => { playPulseSound?.(500, "sine", 0.03); setRangeDays(preset.days); }}
                style={{
                  padding: "7px 18px", fontSize: 10, fontWeight: 700,
                  fontFamily: "Inter, sans-serif", border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer", transition: "all 0.15s",
                  background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                  color: isActive ? "#f59e0b" : "rgba(255,255,255,0.3)",
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

      {/* ── Phân rã doanh thu theo phương thức thanh toán ── */}
      {providerBreakdown.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)", padding: "10px 14px" }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#a3a3a3", fontFamily: "Inter, sans-serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Theo phương thức
          </span>
          {providerBreakdown.map((p) => (
            <span key={p.provider} style={{ fontSize: 11, fontFamily: "Inter, sans-serif", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.35)", padding: "4px 10px" }}>
              <b style={{ color: p.provider === "CASH" ? "#34d399" : "#fbbf24" }}>{p.label}</b>
              {": "}{fmtVND(p.revenue)}
              <span style={{ color: "#737373" }}> ({fmtNumber(p.transactions)} GD)</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Loyalty Health ── */}
      <ChartCard>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <SectionHeader eyebrow="Loyalty Health" title="Tổng quan điểm thành viên" />
          <div style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.07)", padding: "3px 10px" }}>
            <Shield size={9} />
            <span style={{ fontSize: 8, fontWeight: 800, color: "#10b981", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}>Active</span>
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
          <SectionHeader eyebrow="Xếp hạng phát hành" title="Top phim theo doanh thu" />
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
                <Bar dataKey="revenue" name="Doanh thu" fill="url(#barGradRev)" barSize={16} radius={[0, 2, 2, 0]}>
                  <LabelList dataKey="revenue" position="right" formatter={fmtCompact} style={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "Inter, sans-serif" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Donut */}
        <ChartCard>
          <SectionHeader eyebrow="Phân bổ sản lượng" title="Cơ cấu vé theo phim" />
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

      {/* ── Occupancy trend (Ngày / Tuần / Tháng) ── */}
      <ChartCard>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <SectionHeader eyebrow="Hiệu suất hạ tầng" title={`Tỷ lệ lấp đầy theo ${GROUP_LABELS[occupancyGroupBy]} (${rangeDays} ngày gần nhất)`} />
          <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { key: "day", label: "Ngày" },
              { key: "week", label: "Tuần" },
              { key: "month", label: "Tháng" },
            ].map((option) => {
              const isActive = occupancyGroupBy === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => { playPulseSound?.(510, "sine", 0.03); setOccupancyGroupBy(option.key); }}
                  style={{
                    padding: "6px 14px", fontSize: 9, fontWeight: 700,
                    fontFamily: "Inter, sans-serif", border: "none",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", transition: "all 0.15s",
                    background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                    color: isActive ? "#10b981" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        {occupancyChartData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={occupancyChartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="areaGradOccTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                content={<ChartTooltip formatter={(e) => `${e.payload.rate}% · ${Number(e.payload.sold || 0).toLocaleString("vi-VN")}/${Number(e.payload.capacity || 0).toLocaleString("vi-VN")} ghế · ${e.payload.shows} suất`} />}
              />
              <Area type="monotone" dataKey="rate" name="Lấp đầy" stroke="#10b981" strokeWidth={2} fill="url(#areaGradOccTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Audit Log ── */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu size={10} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>System Audit Log</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 5, height: 5, background: "#10b981" }} />
            <span style={{ fontSize: 8, color: "#10b981", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em" }}>LIVE</span>
          </div>
        </div>
        <div style={{ padding: "10px 16px", maxHeight: 220, overflowY: "auto" }} id="terminal-audit-box">
          {effectiveAuditLogs.length === 0 && (
            <p style={{ margin: 0, padding: "10px 0", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
              Chưa có hoạt động quản trị nào được ghi nhận.
            </p>
          )}
          {effectiveAuditLogs.map((log) => (
            <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace" }}>
              <div style={{ display: "flex", gap: 8, fontSize: 10, flexWrap: "wrap" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ color: logColor(log.action), fontWeight: 700, flexShrink: 0 }}>{log.action}:</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{log.target}</span>
              </div>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", flexShrink: 0, border: "1px solid rgba(255,255,255,0.06)", padding: "2px 7px", fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {log.user}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
