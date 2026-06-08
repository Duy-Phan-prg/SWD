import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, Calendar, Clock, MapPin, Film,
  Search, RefreshCw, Eye, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight, Layers, DollarSign,
  Play, PauseCircle, Ban, Check, X, Info, Zap
} from 'lucide-react';
import { authApi } from '../../services/authApi';

/* ─── helpers ────────────────────────────────────────────── */
const STATUS_META = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-500/30', dot: 'bg-blue-400' },
  OPEN: { label: 'Đang mở bán', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/30', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Đã kết thúc', color: 'text-zinc-400', bg: 'bg-zinc-900/50 border-zinc-700/30', dot: 'bg-zinc-500' },
  CANCELLED: { label: 'Đã hủy', color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/30', dot: 'bg-rose-400' },
};

const fmt = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtPrice = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const toInputDatetime = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = {
  movieId: '', roomId: '', startTime: '',
  basePrice: '', vipPrice: '', couplePrice: '', status: 'SCHEDULED'
};

const EMPTY_BULK = {
  movieId: '', basePrice: '', vipPrice: '', couplePrice: '', defaultStatus: 'SCHEDULED',
  slots: [{ roomId: '', startTime: '' }]
};

/**
 * DateTimePicker
 * Renders a compact date <input> + manual time inputs.
 * value  : "YYYY-MM-DDTHH:mm" (same as datetime-local)
 * onChange: (newValue: string) => void
 */
function DateTimePicker({ value, onChange, error, label }) {
  const datePart = value ? value.split('T')[0] : '';
  const timePart = value && value.includes('T') ? value.split('T')[1].slice(0, 5) : '';

  const handleDate = (e) => {
    const d = e.target.value;
    onChange(d ? `${d}T${timePart || '00:00'}` : '');
  };

  const handleTime = (t) => {
    const d = datePart || new Date().toISOString().split('T')[0];
    onChange(`${d}T${t}`);
  };

  // Today's date string for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">{label}</label>
      )}
      {/* Date row */}
      <input
        type="date"
        min={today}
        value={datePart}
        onChange={handleDate}
        className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
      />
      {/* Time inputs */}
      <div className="border border-zinc-800 bg-black p-3 mt-1">
        <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Nhập giờ chiếu</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="23"
              value={timePart ? parseInt(timePart.split(':')[0], 10) : ''}
              onChange={(e) => {
                let hStr = e.target.value;
                if (hStr === '') return handleTime(`00:${timePart ? timePart.split(':')[1] : '00'}`);
                let h = parseInt(hStr, 10);
                if (h < 0) h = 0;
                if (h > 23) h = 23;
                const m = timePart ? timePart.split(':')[1] : '00';
                handleTime(`${String(h).padStart(2, '0')}:${m}`);
              }}
              placeholder="Giờ (0-23)"
              className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs text-center text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>
          <span className="text-zinc-600 font-bold">:</span>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="59"
              value={timePart ? parseInt(timePart.split(':')[1], 10) : ''}
              onChange={(e) => {
                let mStr = e.target.value;
                if (mStr === '') return handleTime(`${timePart ? timePart.split(':')[0] : '00'}:00`);
                let m = parseInt(mStr, 10);
                if (m < 0) m = 0;
                if (m > 59) m = 59;
                const h = timePart ? timePart.split(':')[0] : '00';
                handleTime(`${h}:${String(m).padStart(2, '0')}`);
              }}
              placeholder="Phút (0-59)"
              className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs text-center text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        {timePart && (
          <p className="text-[9px] text-amber-400 font-mono font-bold mt-3 text-center bg-amber-900/20 py-1.5 rounded border border-amber-900/30">
            ✓ Đã chọn: {datePart ? `${datePart.split('-').reverse().join('/')} lúc ${timePart}` : timePart}
          </p>
        )}
      </div>
      {error && <p className="text-rose-400 text-[9px]">{error}</p>}
    </div>
  );
}


/* ─── main component ─────────────────────────────────────── */
export default function AdminShowtimesPanel({ ctx }) {
  const { getAdminToken, showToast, moviesList } = ctx;

  /* state */
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ movieId: '', roomId: '', status: '', date: '' });

  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'bulk' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [bulkForm, setBulkForm] = useState(EMPTY_BULK);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null); // showtimeId
  const [detailModal, setDetailModal] = useState(null); // showtime object

  /* fetch rooms once */
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    authApi.getAdminRooms(token).then(data => {
      const list = Array.isArray(data) ? data : (data?.content || data?.items || []);
      setRooms(list);
    }).catch(() => { });
  }, []);

  /* fetch showtimes */
  const fetchShowtimes = useCallback(async (p = 0) => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = { page: p, size: 10, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const data = await authApi.getAdminShowtimes(token, params);
      const items = data?.content || data?.items || (Array.isArray(data) ? data : []);
      setShowtimes(items);
      setTotalPages(data?.totalPages || 1);
      setPage(p);
    } catch (e) {
      showToast?.('Không thể tải danh sách suất chiếu: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, getAdminToken, showToast]);

  useEffect(() => { fetchShowtimes(0); }, []);

  /* ── create / edit submit ── */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    setErrors({});
    const errs = {};
    if (!form.movieId) errs.movieId = 'Chọn phim';
    if (!form.roomId) errs.roomId = 'Chọn phòng';
    if (!form.startTime || isNaN(new Date(form.startTime).getTime())) errs.startTime = 'Nhập thời gian hợp lệ';
    if (!form.basePrice) errs.basePrice = 'Nhập giá cơ bản';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      movieId: Number(form.movieId),
      roomId: Number(form.roomId),
      startTime: new Date(form.startTime).toISOString().slice(0, 19),
      basePrice: Number(form.basePrice),
      vipPrice: form.vipPrice ? Number(form.vipPrice) : null,
      couplePrice: form.couplePrice ? Number(form.couplePrice) : null,
      status: form.status || 'SCHEDULED',
    };

    setSaving(true);
    try {
      if (editingId) {
        await authApi.updateAdminShowtime(token, editingId, payload);
        showToast?.('Cập nhật suất chiếu thành công', 'success');
      } else {
        await authApi.createAdminShowtime(token, payload);
        showToast?.('Tạo suất chiếu thành công', 'success');
      }
      setMode('list');
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchShowtimes(0);
    } catch (e) {
      showToast?.('Lỗi: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── bulk submit ── */
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    const errs = {};
    if (!bulkForm.movieId) errs.movieId = 'Chọn phim';
    if (!bulkForm.basePrice) errs.basePrice = 'Nhập giá';
    bulkForm.slots.forEach((s, i) => {
      if (!s.roomId) errs[`slot_room_${i}`] = 'Chọn phòng';
      if (!s.startTime || isNaN(new Date(s.startTime).getTime())) errs[`slot_time_${i}`] = 'Nhập thời gian hợp lệ';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const payload = {
      movieId: Number(bulkForm.movieId),
      basePrice: Number(bulkForm.basePrice),
      vipPrice: bulkForm.vipPrice ? Number(bulkForm.vipPrice) : null,
      couplePrice: bulkForm.couplePrice ? Number(bulkForm.couplePrice) : null,
      defaultStatus: bulkForm.defaultStatus || 'SCHEDULED',
      slots: bulkForm.slots.map(s => ({
        roomId: Number(s.roomId),
        startTime: new Date(s.startTime).toISOString().slice(0, 19),
        status: s.status || null,
      })),
    };

    setSaving(true);
    try {
      const result = await authApi.createAdminShowtimesBulk(token, payload);
      const count = Array.isArray(result) ? result.length : '?';
      showToast?.(`Tạo thành công ${count} suất chiếu`, 'success');
      setMode('list');
      setBulkForm(EMPTY_BULK);
      fetchShowtimes(0);
    } catch (e) {
      showToast?.('Lỗi: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── status change ── */
  const handleStatusChange = async (showtimeId, newStatus) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await authApi.updateAdminShowtimeStatus(token, showtimeId, newStatus);
      showToast?.('Cập nhật trạng thái thành công', 'success');
      fetchShowtimes(page);
    } catch (e) {
      showToast?.('Lỗi: ' + e.message, 'error');
    }
  };

  /* ── delete ── */
  const handleDelete = async (showtimeId) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await authApi.deleteAdminShowtime(token, showtimeId);
      showToast?.('Đã xóa suất chiếu', 'success');
      setConfirmDelete(null);
      fetchShowtimes(page);
    } catch (e) {
      showToast?.('Lỗi: ' + e.message, 'error');
      setConfirmDelete(null);
    }
  };

  /* ── open edit form ── */
  const openEdit = (st) => {
    setEditingId(st.id);
    setForm({
      movieId: st.movieId ?? st.movie?.id ?? '',
      roomId: st.roomId ?? st.room?.id ?? '',
      startTime: toInputDatetime(st.startTime),
      basePrice: st.basePrice ?? '',
      vipPrice: st.vipPrice ?? '',
      couplePrice: st.couplePrice ?? '',
      status: st.status ?? 'SCHEDULED',
    });
    setErrors({});
    setMode('edit');
  };

  const activeMovies = (moviesList || []).filter(m => m.status === 'ACTIVE' || m.status === 'NOW_SHOWING' || m.status === 'UPCOMING');

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white font-sans">Quản lý Suất Chiếu</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">Tạo, chỉnh sửa và giám sát lịch chiếu phim</p>
        </div>
        {mode === 'list' && (
          <div className="flex gap-2">
            <button onClick={() => { setMode('create'); setForm(EMPTY_FORM); setEditingId(null); setErrors({}); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition">
              <Plus className="w-3 h-3" /> Tạo suất
            </button>
            <button onClick={() => { setMode('bulk'); setBulkForm(EMPTY_BULK); setErrors({}); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider hover:bg-amber-400 transition">
              <Zap className="w-3 h-3" /> Tạo hàng loạt
            </button>
          </div>
        )}
        {mode !== 'list' && (
          <button onClick={() => { setMode('list'); setErrors({}); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider hover:border-zinc-500 transition">
            <X className="w-3 h-3" /> Hủy
          </button>
        )}
      </div>

      {/* ── CREATE / EDIT FORM ── */}
      <AnimatePresence mode="wait">
        {(mode === 'create' || mode === 'edit') && (
          <motion.div key="form-single" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-zinc-800 bg-gradient-to-b from-[#0a0a0a] to-[#040404] p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-4 pb-2 border-b border-zinc-900">
              {mode === 'edit' ? '✏️ Chỉnh sửa suất chiếu' : '➕ Tạo suất chiếu mới'}
            </h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">

              {/* Movie */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Phim *</label>
                <select value={form.movieId} onChange={e => setForm({ ...form, movieId: e.target.value })}
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                  <option value="">-- Chọn phim --</option>
                  {(moviesList || []).map(m => (
                    <option key={m.id} value={m.backendId ?? m.id}>{m.title}</option>
                  ))}
                </select>
                {errors.movieId && <p className="text-rose-400 text-[9px]">{errors.movieId}</p>}
              </div>

              {/* Room */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Phòng chiếu *</label>
                <select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })}
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                  <option value="">-- Chọn phòng --</option>
                  {rooms.filter(r => r.status === 'ACTIVE').map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>
                  ))}
                </select>
                {errors.roomId && <p className="text-rose-400 text-[9px]">{errors.roomId}</p>}
              </div>

              {/* Start time */}
              <DateTimePicker
                label="Thời gian bắt đầu *"
                value={form.startTime}
                onChange={v => setForm({ ...form, startTime: v })}
                error={errors.startTime}
              />

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Trạng thái ban đầu</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                  <option value="SCHEDULED">SCHEDULED — lên lịch, chưa bán</option>
                  <option value="OPEN">OPEN — mở bán ngay</option>
                </select>
              </div>

              {/* Prices */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá cơ bản (VND) *</label>
                <input type="number" min="1000" value={form.basePrice}
                  onChange={e => setForm({ ...form, basePrice: e.target.value })}
                  placeholder="90000"
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
                {errors.basePrice && <p className="text-rose-400 text-[9px]">{errors.basePrice}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá Ghế VIP (VND)</label>
                <input type="number" min="1000" value={form.vipPrice}
                  onChange={e => setForm({ ...form, vipPrice: e.target.value })}
                  placeholder="130000 (tùy chọn)"
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá ghế đôi (VND)</label>
                <input type="number" min="1000" value={form.couplePrice}
                  onChange={e => setForm({ ...form, couplePrice: e.target.value })}
                  placeholder="160000 (tùy chọn)"
                  className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
              </div>

              <div className="md:col-span-2">
                <button type="submit" disabled={saving}
                  className="w-full py-3.5 bg-white text-black font-black uppercase text-[10.5px] tracking-widest hover:bg-zinc-200 transition disabled:opacity-50">
                  {saving ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật suất chiếu' : 'Tạo suất chiếu'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── BULK FORM ── */}
        {mode === 'bulk' && (
          <motion.div key="form-bulk" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-amber-500/30 bg-gradient-to-b from-[#0d0900] to-[#040404] p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-900">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Tạo hàng loạt suất chiếu</h3>
              <span className="text-[9px] text-zinc-500">— Cùng 1 phim, nhiều phòng/thời gian</span>
            </div>
            <form onSubmit={handleBulkSubmit} className="space-y-5 text-xs font-sans">

              {/* Shared fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Phim *</label>
                  <select value={bulkForm.movieId} onChange={e => setBulkForm({ ...bulkForm, movieId: e.target.value })}
                    className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                    <option value="">-- Chọn phim --</option>
                    {(moviesList || []).map(m => (
                      <option key={m.id} value={m.backendId ?? m.id}>{m.title}</option>
                    ))}
                  </select>
                  {errors.movieId && <p className="text-rose-400 text-[9px]">{errors.movieId}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Trạng thái mặc định</label>
                  <select value={bulkForm.defaultStatus} onChange={e => setBulkForm({ ...bulkForm, defaultStatus: e.target.value })}
                    className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400">
                    <option value="SCHEDULED">SCHEDULED — lên lịch, chưa bán</option>
                    <option value="OPEN">OPEN — mở bán ngay</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá cơ bản (VND) *</label>
                  <input type="number" value={bulkForm.basePrice} onChange={e => setBulkForm({ ...bulkForm, basePrice: e.target.value })}
                    placeholder="90000"
                    className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
                  {errors.basePrice && <p className="text-rose-400 text-[9px]">{errors.basePrice}</p>}
                </div>
                <div className="flex gap-2">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá Ghế VIP (VND)</label>
                    <input type="number" value={bulkForm.vipPrice} onChange={e => setBulkForm({ ...bulkForm, vipPrice: e.target.value })}
                      placeholder="VIP"
                      className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Giá ghế đôi (VND)</label>
                    <input type="number" value={bulkForm.couplePrice} onChange={e => setBulkForm({ ...bulkForm, couplePrice: e.target.value })}
                      placeholder="Đôi"
                      className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
                  </div>
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">
                    Danh sách khung giờ ({bulkForm.slots.length} slot)
                  </label>
                  <button type="button"
                    onClick={() => setBulkForm({ ...bulkForm, slots: [...bulkForm.slots, { roomId: '', startTime: '' }] })}
                    className="flex items-center gap-1 text-[9px] text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2 py-1 hover:border-amber-400/50 transition">
                    <Plus className="w-2.5 h-2.5" /> Thêm slot
                  </button>
                </div>

                {bulkForm.slots.map((slot, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-start border border-zinc-900 p-4 bg-black/30">
                    <div className="space-y-2 mt-4">
                      <label className="text-xs uppercase tracking-widest text-amber-500 font-black block text-center">Phòng chiếu {i + 1}</label>
                      <select value={slot.roomId}
                        onChange={e => {
                          const s = [...bulkForm.slots]; s[i] = { ...s[i], roomId: e.target.value };
                          setBulkForm({ ...bulkForm, slots: s });
                        }}
                        className="w-full bg-black border border-zinc-800 p-2.5 text-sm text-center font-bold text-white focus:outline-none focus:border-amber-400 appearance-none">
                        <option value="">-- Chọn phòng --</option>
                        {rooms.filter(r => r.status === 'ACTIVE').map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {errors[`slot_room_${i}`] && <p className="text-rose-400 text-[8px]">{errors[`slot_room_${i}`]}</p>}
                    </div>
                    <div className="space-y-1">
                      <DateTimePicker
                        label="Giờ bắt đầu"
                        value={slot.startTime}
                        onChange={v => {
                          const s = [...bulkForm.slots]; s[i] = { ...s[i], startTime: v };
                          setBulkForm({ ...bulkForm, slots: s });
                        }}
                        error={errors[`slot_time_${i}`]}
                      />
                    </div>
                    <button type="button" disabled={bulkForm.slots.length === 1}
                      onClick={() => {
                        const s = bulkForm.slots.filter((_, j) => j !== i);
                        setBulkForm({ ...bulkForm, slots: s });
                      }}
                      className="p-2 text-zinc-600 hover:text-rose-400 transition disabled:opacity-30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3.5 bg-amber-500 text-black font-black uppercase text-[10.5px] tracking-widest hover:bg-amber-400 transition disabled:opacity-50">
                {saving ? 'Đang tạo...' : `Tạo ${bulkForm.slots.length} suất chiếu cùng lúc`}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER BAR ── */}
      {mode === 'list' && (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-wider text-zinc-600 block">Phim</label>
            <select value={filters.movieId} onChange={e => setFilters({ ...filters, movieId: e.target.value })}
              className="bg-black border border-zinc-800 text-xs text-zinc-300 px-2.5 py-2 focus:outline-none focus:border-zinc-600">
              <option value="">Tất cả phim</option>
              {(moviesList || []).map(m => <option key={m.id} value={m.backendId ?? m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-wider text-zinc-600 block">Trạng thái</label>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="bg-black border border-zinc-800 text-xs text-zinc-300 px-2.5 py-2 focus:outline-none focus:border-zinc-600">
              <option value="">Tất cả</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="OPEN">Đang mở bán</option>
              <option value="COMPLETED">Đã kết thúc</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-wider text-zinc-600 block">Ngày</label>
            <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })}
              className="bg-black border border-zinc-800 text-xs text-zinc-300 px-2.5 py-2 focus:outline-none focus:border-zinc-600 font-mono" />
          </div>
          <button onClick={() => fetchShowtimes(0)}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase hover:border-zinc-500 transition">
            <Search className="w-3 h-3" /> Lọc
          </button>
          <button onClick={() => { setFilters({ movieId: '', roomId: '', status: '', date: '' }); fetchShowtimes(0); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase hover:border-zinc-700 hover:text-zinc-300 transition">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* ── TABLE ── */}
      {mode === 'list' && (
        <div className="border border-zinc-900 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-600">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Đang tải...
            </div>
          ) : showtimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Film className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Không có suất chiếu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/80">
                    {['Phim', 'Phòng', 'Bắt đầu', 'Kết thúc', 'Giá vé', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[9px] uppercase tracking-wider text-zinc-500 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {showtimes.map((st, idx) => {
                    const meta = STATUS_META[st.status] || STATUS_META.SCHEDULED;
                    const movieTitle = st.movieTitle ?? st.movie?.title ?? '—';
                    const roomName = st.roomName ?? st.room?.name ?? '—';
                    return (
                      <tr key={st.id ?? idx}
                        className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                        <td className="px-3 py-3 max-w-[160px]">
                          <span className="font-bold text-white truncate block" title={movieTitle}>{movieTitle}</span>
                        </td>
                        <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{roomName}</td>
                        <td className="px-3 py-3 font-mono text-zinc-300 whitespace-nowrap">{fmt(st.startTime)}</td>
                        <td className="px-3 py-3 font-mono text-zinc-500 whitespace-nowrap">{fmt(st.endTime)}</td>
                        <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">{fmtPrice(st.basePrice)}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[8.5px] px-1.5 py-0.5 font-bold border ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {/* Status actions */}
                            {st.status === 'SCHEDULED' && (
                              <button onClick={() => handleStatusChange(st.id, 'OPEN')} title="Mở bán"
                                className="p-1 text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950/30 rounded transition">
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            {(st.status === 'SCHEDULED' || st.status === 'OPEN') && (
                              <button onClick={() => handleStatusChange(st.id, 'CANCELLED')} title="Hủy suất chiếu"
                                className="p-1 text-amber-500 hover:text-amber-300 hover:bg-amber-950/30 rounded transition">
                                <Ban className="w-3 h-3" />
                              </button>
                            )}
                            {/* Edit */}
                            {(st.status === 'SCHEDULED' || st.status === 'OPEN') && (
                              <button onClick={() => openEdit(st)} title="Chỉnh sửa"
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition">
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {/* Detail */}
                            <button onClick={() => setDetailModal(st)} title="Chi tiết"
                              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded transition">
                              <Eye className="w-3 h-3" />
                            </button>
                            {/* Delete */}
                            <button onClick={() => setConfirmDelete(st.id)} title="Xóa"
                              className="p-1 text-zinc-600 hover:text-rose-400 hover:bg-rose-950/30 rounded transition">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-900 bg-zinc-950/50">
              <span className="text-[9px] text-zinc-600 font-mono">Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => fetchShowtimes(page - 1)}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => fetchShowtimes(page + 1)}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div key="delete-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-zinc-950 border border-rose-500/30 p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">Xác nhận xóa suất chiếu</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                Suất chiếu sẽ bị xóa vĩnh viễn. Nếu còn booking đang hoạt động, thao tác sẽ bị từ chối (409).
                Hãy hủy suất chiếu trước để tự động xử lý booking.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase hover:border-zinc-500 transition">
                  Hủy bỏ
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase hover:bg-rose-500 transition">
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {detailModal && (
          <motion.div key="detail-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailModal(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Chi tiết suất chiếu #{detailModal.id}</h3>
                <button onClick={() => setDetailModal(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2 text-[11px]">
                {[
                  ['Phim', detailModal.movieTitle ?? detailModal.movie?.title],
                  ['Phòng', detailModal.roomName ?? detailModal.room?.name],
                  ['Bắt đầu', fmt(detailModal.startTime)],
                  ['Kết thúc', fmt(detailModal.endTime)],
                  ['Giá cơ bản', fmtPrice(detailModal.basePrice)],
                  ['Giá VIP', fmtPrice(detailModal.vipPrice)],
                  ['Giá ghế đôi', fmtPrice(detailModal.couplePrice)],
                  ['Trạng thái', STATUS_META[detailModal.status]?.label ?? detailModal.status],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 font-bold">{label}</span>
                    <span className="text-zinc-200 font-mono">{val ?? '—'}</span>
                  </div>
                ))}
              </div>
              {/* Quick status actions in detail */}
              {(detailModal.status === 'SCHEDULED' || detailModal.status === 'OPEN') && (
                <div className="flex gap-2 pt-2">
                  {detailModal.status === 'SCHEDULED' && (
                    <button onClick={() => { handleStatusChange(detailModal.id, 'OPEN'); setDetailModal(null); }}
                      className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-500 transition">
                      Mở bán ngay
                    </button>
                  )}
                  <button onClick={() => { handleStatusChange(detailModal.id, 'CANCELLED'); setDetailModal(null); }}
                    className="flex-1 py-2 bg-rose-900 text-rose-300 text-[10px] font-black uppercase hover:bg-rose-800 transition">
                    Hủy suất chiếu
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
