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

const toApiLocalDateTime = (value) => {
  if (!value) return '';
  return String(value).length === 16 ? `${value}:00` : String(value).slice(0, 19);
};

const toLocalDateInput = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const buildDateTimeOnDate = (sourceDateTime, targetDate) => {
  if (!sourceDateTime || !targetDate) return '';
  const source = new Date(sourceDateTime);
  if (Number.isNaN(source.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${targetDate}T${pad(source.getHours())}:${pad(source.getMinutes())}`;
};

const isFutureDateInput = (dateValue) => {
  if (!dateValue) return false;
  const today = toLocalDateInput();
  return dateValue > today;
};

const EMPTY_FORM = {
  movieId: '', roomId: '', startTime: '',
  basePrice: '', vipPrice: '', couplePrice: '',
  adultStandardPrice: '', childStandardPrice: '', studentStandardPrice: '',
  adultVipPrice: '', childVipPrice: '', studentVipPrice: '',
  adultCouplePrice: '', childCouplePrice: '', studentCouplePrice: '',
  weekendSurcharge: false, holidaySurcharge: false,
  status: 'SCHEDULED'
};

const EMPTY_BULK = {
  movieId: '', basePrice: '', vipPrice: '', couplePrice: '',
  adultStandardPrice: '', childStandardPrice: '', studentStandardPrice: '',
  adultVipPrice: '', childVipPrice: '', studentVipPrice: '',
  adultCouplePrice: '', childCouplePrice: '', studentCouplePrice: '',
  weekendSurcharge: false, holidaySurcharge: false,
  defaultStatus: 'SCHEDULED',
  slots: [{ roomId: '', startTime: '', selected: true }]
};

const PRICE_ROWS = [
  { key: 'adult', label: 'Người lớn' },
  { key: 'child', label: 'Trẻ em' },
  { key: 'student', label: 'Sinh viên' },
];

const PRICE_COLS = [
  { key: 'Standard', label: 'Ghế thường', addon: 0 },
  { key: 'Vip', label: 'VIP', addon: 20000 },
  { key: 'Couple', label: 'Ghế đôi', addon: 30000 },
];

const priceField = (row, col) => `${row}${col}Price`;
const priceDigits = (value) => String(value ?? '').replace(/\D/g, '');
const toPriceNumber = (value) => Number(priceDigits(value) || 0);
const formatPriceInput = (value) => {
  const digits = priceDigits(value);
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
};
const withDerivedSeatPrices = (next, rowKey) => {
  const standard = toPriceNumber(next[priceField(rowKey, 'Standard')]);
  if (!standard) return next;
  return {
    ...next,
    [priceField(rowKey, 'Vip')]: formatPriceInput(standard + 20000),
    [priceField(rowKey, 'Couple')]: formatPriceInput(standard + 30000),
  };
};

const buildShowtimePayload = (formState, allowChildTickets = true) => ({
  basePrice: toPriceNumber(formState.adultStandardPrice || formState.basePrice),
  vipPrice: toPriceNumber(formState.adultVipPrice) ? toPriceNumber(formState.adultVipPrice) : null,
  couplePrice: toPriceNumber(formState.adultCouplePrice) ? toPriceNumber(formState.adultCouplePrice) : null,
  adultStandardPrice: toPriceNumber(formState.adultStandardPrice || formState.basePrice),
  childStandardPrice: allowChildTickets ? toPriceNumber(formState.childStandardPrice || formState.basePrice) : null,
  studentStandardPrice: toPriceNumber(formState.studentStandardPrice || formState.basePrice),
  adultVipPrice: toPriceNumber(formState.adultVipPrice) || toPriceNumber(formState.adultStandardPrice || formState.basePrice) + 20000,
  childVipPrice: allowChildTickets ? toPriceNumber(formState.childVipPrice) || toPriceNumber(formState.childStandardPrice || formState.basePrice) + 20000 : null,
  studentVipPrice: toPriceNumber(formState.studentVipPrice) || toPriceNumber(formState.studentStandardPrice || formState.basePrice) + 20000,
  adultCouplePrice: toPriceNumber(formState.adultCouplePrice) || toPriceNumber(formState.adultStandardPrice || formState.basePrice) + 30000,
  childCouplePrice: allowChildTickets ? toPriceNumber(formState.childCouplePrice) || toPriceNumber(formState.childStandardPrice || formState.basePrice) + 30000 : null,
  studentCouplePrice: toPriceNumber(formState.studentCouplePrice) || toPriceNumber(formState.studentStandardPrice || formState.basePrice) + 30000,
  weekendSurcharge: Boolean(formState.weekendSurcharge),
  holidaySurcharge: Boolean(formState.holidaySurcharge),
});

const addMinutes = (value, minutes) => {
  if (!value || !minutes) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

const formatTimeOnly = (value) => {
  if (!value) return '--:--';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getRoomCapacity = (room) => {
  const direct = Number(room?.capacity ?? room?.totalSeats ?? room?.seatCount ?? room?.numberOfSeats);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const rows = Number(room?.rows);
  const columns = Number(room?.columns ?? room?.cols);
  return Number.isFinite(rows) && Number.isFinite(columns) ? rows * columns : 0;
};

const isNightSlot = (value) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const hour = d.getHours();
  return hour >= 23 || hour < 5;
};

const getMovieOptionId = (movie) => String(movie?.backendId ?? movie?.id ?? '');

const getAgeRatingMinimum = (ageRating) => {
  if (!ageRating) return 0;
  const match = String(ageRating).match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const CHILD_TICKET_MAX_AGE = 12;
const allowsChildTicketsForMovie = (movie) => getAgeRatingMinimum(movie?.ageRating) <= CHILD_TICKET_MAX_AGE;

const clearChildPrices = (state) => ({
  ...state,
  childStandardPrice: '',
  childVipPrice: '',
  childCouplePrice: '',
});

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
    const d = datePart || toLocalDateInput();
    onChange(`${d}T${t}`);
  };

  // Today's date string for min attribute
  const today = toLocalDateInput();

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
        <p className="text-[9px] uppercase tracking-widest text-zinc-300 mb-2 font-bold">Nhập giờ chiếu</p>
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

function PriceMatrix({ value, onChange, errors = {}, prefix = '', allowChildTickets = true, ageRatingLabel = '' }) {
  const setPrice = (field, nextValue) => {
    const next = { ...value, [field]: formatPriceInput(nextValue) };
    const row = PRICE_ROWS.find(item => field === priceField(item.key, 'Standard'));
    onChange(row ? withDerivedSeatPrices(next, row.key) : next);
  };
  const visibleRows = PRICE_ROWS.filter(row => allowChildTickets || row.key !== 'child');

  return (
    <div className="md:col-span-2 border border-zinc-900 bg-black/30 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-amber-500 font-black">Bảng giá theo lứa tuổi</p>
          <p className="text-[10px] text-zinc-510">Nhập giá ghế thường, hệ thống tự cộng VIP +20k và ghế đôi +30k. Bạn có thể sửa từng mục.</p>
        </div>
        <div className="flex gap-3 text-[9px] uppercase tracking-wider text-zinc-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={Boolean(value.weekendSurcharge)}
              onChange={e => onChange({ ...value, weekendSurcharge: e.target.checked })}
              className="accent-amber-500" />
            Cuối tuần +10k
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={Boolean(value.holidaySurcharge)}
              onChange={e => onChange({ ...value, holidaySurcharge: e.target.checked })}
              className="accent-amber-500" />
            Ngày lễ +10k
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[10px]">
          <thead>
            <tr className="text-left text-zinc-500 uppercase tracking-wider">
              <th className="py-2 pr-2">Loại vé</th>
              {PRICE_COLS.map(col => <th key={col.key} className="py-2 px-2">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.key} className="border-t border-zinc-900">
                <td className="py-2 pr-2 text-zinc-300 font-bold uppercase whitespace-nowrap">{row.label}</td>
                {PRICE_COLS.map(col => {
                  const field = priceField(row.key, col.key);
                  return (
                    <td key={field} className="py-2 px-2">
                      <input type="text" inputMode="numeric" value={formatPriceInput(value[field])}
                        onChange={e => setPrice(field, e.target.value)}
                        placeholder={col.addon ? `+${formatPriceInput(col.addon)}` : '90.000'}
                        className="w-full bg-black border border-zinc-800 p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400" />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!allowChildTickets && (
        <p className="text-[11px] font-black uppercase tracking-wide text-amber-300">
          Phim {ageRatingLabel || '16+'} Không cho phép bán vé trẻ em, bảng giá mục này vô hiệu hóa!
        </p>
      )}
      {['adultStandardPrice', ...(allowChildTickets ? ['childStandardPrice'] : []), 'studentStandardPrice'].map(field => (
        errors[`${prefix}${field}`] ? <p key={field} className="text-rose-400 text-[9px]">{errors[`${prefix}${field}`]}</p> : null
      ))}
      <p className="text-[10px] text-zinc-400">Phụ thu đêm 23:00-04:59 được hệ thống tự cộng 20k/vé theo giờ bắt đầu suất chiếu.</p>
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
  const [editingBulkSlotIndex, setEditingBulkSlotIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null); // showtimeId
  const [confirmCancel, setConfirmCancel] = useState(null); // showtime object
  const [copySource, setCopySource] = useState(null); // showtime object
  const [copyDate, setCopyDate] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // showtime object

  const findUiMovie = useCallback((movieId) => (
    (moviesList || []).find(m => getMovieOptionId(m) === String(movieId))
  ), [moviesList]);

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
    const selectedMovie = findUiMovie(form.movieId);
    const allowChildTickets = allowsChildTicketsForMovie(selectedMovie);
    if (!form.movieId) errs.movieId = 'Chọn phim';
    if (!form.roomId) errs.roomId = 'Chọn phòng';
    if (!form.startTime || isNaN(new Date(form.startTime).getTime())) errs.startTime = 'Nhập thời gian hợp lệ';
    if (!form.adultStandardPrice && !form.basePrice) errs.adultStandardPrice = 'Nhập giá người lớn ghế thường';
    if (allowChildTickets && !form.childStandardPrice) errs.childStandardPrice = 'Nhập giá trẻ em ghế thường';
    if (!form.studentStandardPrice) errs.studentStandardPrice = 'Nhập giá sinh viên ghế thường';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      movieId: Number(form.movieId),
      roomId: Number(form.roomId),
      startTime: toApiLocalDateTime(form.startTime),
      ...buildShowtimePayload(form, allowChildTickets),
      status: form.status || 'SCHEDULED',
    };

    setSaving(true);
    try {
      if (editingId) {
        if (editingStatus === 'OPEN') {
          showToast?.('Suất chiếu đang mở bán không thể chỉnh sửa.', 'error');
          return;
        }
        await authApi.updateAdminShowtime(token, editingId, payload);
        showToast?.('Cập nhật suất chiếu thành công', 'success');
      } else {
        await authApi.createAdminShowtime(token, payload);
        showToast?.('Tạo suất chiếu thành công', 'success');
      }
      setMode('list');
      setForm(EMPTY_FORM);
      setEditingId(null);
      setEditingStatus('');
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
    const selectedMovie = findUiMovie(bulkForm.movieId);
    const allowChildTickets = allowsChildTicketsForMovie(selectedMovie);
    if (!bulkForm.movieId) errs.movieId = 'Chọn phim';
    if (!bulkForm.adultStandardPrice && !bulkForm.basePrice) errs.adultStandardPrice = 'Nhập giá người lớn ghế thường';
    if (allowChildTickets && !bulkForm.childStandardPrice) errs.childStandardPrice = 'Nhập giá trẻ em ghế thường';
    if (!bulkForm.studentStandardPrice) errs.studentStandardPrice = 'Nhập giá sinh viên ghế thường';
    const selectedSlots = bulkForm.slots.filter(s => s.selected !== false);
    if (!selectedSlots.length) errs.slot_selection = 'Chon it nhat mot khung gio';
    const seenRoomStartTimes = new Set();
    selectedSlots.forEach((s, i) => {
      if (!s.roomId) errs[`slot_room_${i}`] = 'Chọn phòng';
      if (!s.startTime || isNaN(new Date(s.startTime).getTime())) {
        errs[`slot_time_${i}`] = 'Nhập thời gian hợp lệ';
        return;
      }
      const normalizedStart = toApiLocalDateTime(s.startTime).slice(0, 16);
      const roomStartKey = `${s.roomId}|${normalizedStart}`;
      if (seenRoomStartTimes.has(roomStartKey)) {
        errs[`slot_time_${i}`] = 'Phòng này đã có slot khác cùng giờ trong danh sách đang chọn';
      }
      seenRoomStartTimes.add(roomStartKey);
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const payload = {
      movieId: Number(bulkForm.movieId),
      ...buildShowtimePayload(bulkForm, allowChildTickets),
      defaultStatus: bulkForm.defaultStatus || 'SCHEDULED',
      slots: selectedSlots.map(s => ({
        roomId: Number(s.roomId),
        startTime: toApiLocalDateTime(s.startTime),
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
      setEditingStatus('');
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
  const openCopy = (st) => {
    const sourceDate = st.startTime ? new Date(st.startTime) : new Date();
    const target = new Date(sourceDate);
    target.setDate(target.getDate() + 1);
    const defaultDate = toLocalDateInput(target);
    setCopySource(st);
    setCopyDate(isFutureDateInput(defaultDate) ? defaultDate : '');
    setErrors({});
  };

  const handleCopySubmit = async (event) => {
    event.preventDefault();
    const token = getAdminToken();
    if (!token || !copySource) return;
    if (!isFutureDateInput(copyDate)) {
      setErrors({ copyDate: 'Chọn một ngày trong tương lai.' });
      return;
    }

    const movieId = copySource.movieId ?? copySource.movie?.id;
    const roomId = copySource.roomId ?? copySource.room?.id;
    const nextStartTime = buildDateTimeOnDate(copySource.startTime, copyDate);
    const copyMovie = findUiMovie(movieId) || copySource.movie;
    const allowChildTickets = allowsChildTicketsForMovie(copyMovie);
    if (!movieId || !roomId || !nextStartTime) {
      showToast?.('Không đủ dữ liệu phim/phòng/giờ để copy suất chiếu.', 'error');
      return;
    }

    const payload = {
      movieId: Number(movieId),
      roomId: Number(roomId),
      startTime: toApiLocalDateTime(nextStartTime),
      basePrice: copySource.basePrice ?? copySource.adultStandardPrice ?? 0,
      vipPrice: copySource.vipPrice ?? copySource.adultVipPrice ?? null,
      couplePrice: copySource.couplePrice ?? copySource.adultCouplePrice ?? null,
      adultStandardPrice: copySource.adultStandardPrice ?? copySource.basePrice ?? 0,
      childStandardPrice: allowChildTickets ? copySource.childStandardPrice ?? null : null,
      studentStandardPrice: copySource.studentStandardPrice ?? copySource.basePrice ?? 0,
      adultVipPrice: copySource.adultVipPrice ?? copySource.vipPrice ?? null,
      childVipPrice: allowChildTickets ? copySource.childVipPrice ?? null : null,
      studentVipPrice: copySource.studentVipPrice ?? null,
      adultCouplePrice: copySource.adultCouplePrice ?? copySource.couplePrice ?? null,
      childCouplePrice: allowChildTickets ? copySource.childCouplePrice ?? null : null,
      studentCouplePrice: copySource.studentCouplePrice ?? null,
      weekendSurcharge: Boolean(copySource.weekendSurcharge),
      holidaySurcharge: Boolean(copySource.holidaySurcharge),
      status: 'SCHEDULED',
    };

    setIsCopying(true);
    try {
      await authApi.createAdminShowtime(token, payload);
      showToast?.('Đã copy suất chiếu sang ngày mới.', 'success');
      setCopySource(null);
      setCopyDate('');
      setErrors({});
      fetchShowtimes(page);
    } catch (e) {
      showToast?.('Lỗi: ' + e.message, 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const openEdit = (st) => {
    if (st.status === 'OPEN') {
      showToast?.('Suất chiếu đang mở bán không thể chỉnh sửa.', 'error');
      return;
    }
    setEditingId(st.id);
    setEditingStatus(st.status || '');
    setForm({
      movieId: st.movieId ?? st.movie?.id ?? '',
      roomId: st.roomId ?? st.room?.id ?? '',
      startTime: toInputDatetime(st.startTime),
      basePrice: st.basePrice ?? '',
      vipPrice: st.vipPrice ?? '',
      couplePrice: st.couplePrice ?? '',
      adultStandardPrice: st.adultStandardPrice ?? st.basePrice ?? '',
      childStandardPrice: st.childStandardPrice ?? st.basePrice ?? '',
      studentStandardPrice: st.studentStandardPrice ?? st.basePrice ?? '',
      adultVipPrice: st.adultVipPrice ?? st.vipPrice ?? '',
      childVipPrice: st.childVipPrice ?? '',
      studentVipPrice: st.studentVipPrice ?? '',
      adultCouplePrice: st.adultCouplePrice ?? st.couplePrice ?? '',
      childCouplePrice: st.childCouplePrice ?? '',
      studentCouplePrice: st.studentCouplePrice ?? '',
      weekendSurcharge: Boolean(st.weekendSurcharge),
      holidaySurcharge: Boolean(st.holidaySurcharge),
      status: st.status ?? 'SCHEDULED',
    });
    setErrors({});
    setMode('edit');
  };

  const activeMovies = (moviesList || []).filter(m => m.status === 'ACTIVE' || m.status === 'NOW_SHOWING' || m.status === 'UPCOMING');
  const formMovie = findUiMovie(form.movieId);
  const formAllowsChildTickets = allowsChildTicketsForMovie(formMovie);
  const bulkMovie = findUiMovie(bulkForm.movieId);
  const bulkAllowsChildTickets = allowsChildTicketsForMovie(bulkMovie);
  const bulkMovieDuration = Number(bulkMovie?.durationMinutes ?? bulkMovie?.duration ?? 0);
  const bulkStepMinutes = bulkMovieDuration ? bulkMovieDuration + 15 : 0;
  const selectedBulkSlotsCount = bulkForm.slots.filter(s => s.selected !== false).length;
  const activeBulkSlotIndex = Math.min(editingBulkSlotIndex, Math.max(bulkForm.slots.length - 1, 0));
  const activeBulkSlot = bulkForm.slots[activeBulkSlotIndex] || EMPTY_BULK.slots[0];

  const getBulkSlotEnd = (startTime) => addMinutes(startTime, bulkMovieDuration);

  const getBulkSlotCapacity = (slot) => {
    const room = rooms.find(r => String(r.id) === String(slot.roomId));
    return getRoomCapacity(room);
  };

  const setAllBulkSlotsRoom = (roomId) => {
    const nextSlots = (bulkForm.slots.length ? bulkForm.slots : EMPTY_BULK.slots)
      .map(slot => ({ ...slot, roomId, selected: slot.selected !== false }));
    setBulkForm({ ...bulkForm, slots: nextSlots });
  };

  const updateBulkSlot = (index, patch) => {
    const nextSlots = [...bulkForm.slots];
    nextSlots[index] = { ...nextSlots[index], ...patch };
    setBulkForm({ ...bulkForm, slots: nextSlots });
  };

  const toggleBulkSlot = (index) => {
    const nextSlots = [...bulkForm.slots];
    nextSlots[index] = { ...nextSlots[index], selected: nextSlots[index].selected === false };
    setBulkForm({ ...bulkForm, slots: nextSlots });
  };

  const addManualBulkSlot = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const sourceSlot = bulkForm.slots[activeBulkSlotIndex] || bulkForm.slots[0] || {};
    const firstSlot = {
      roomId: sourceSlot.roomId || bulkForm.slots[0]?.roomId || '',
      startTime: sourceSlot.startTime || bulkForm.slots[0]?.startTime || ''
    };
    const lastSlot = bulkForm.slots[bulkForm.slots.length - 1] || firstSlot;
    const nextStart = lastSlot.startTime && bulkStepMinutes ? toInputDatetime(addMinutes(lastSlot.startTime, bulkStepMinutes)) : '';
    const nextIndex = bulkForm.slots.length;
    setBulkForm({
      ...bulkForm,
      slots: [...bulkForm.slots, { roomId: firstSlot.roomId || '', startTime: nextStart, selected: true }]
    });
    setEditingBulkSlotIndex(nextIndex);
  };

  const removeBulkSlot = (index) => {
    if (bulkForm.slots.length === 1) return;
    const nextSlots = bulkForm.slots.filter((_, j) => j !== index);
    setBulkForm({ ...bulkForm, slots: nextSlots });
    setEditingBulkSlotIndex(prev => Math.max(0, Math.min(prev >= index ? prev - 1 : prev, nextSlots.length - 1)));
  };

  const generateBulkSlotsForDay = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const sourceSlot = bulkForm.slots[activeBulkSlotIndex] || bulkForm.slots[0] || {};
    const firstSlot = {
      roomId: sourceSlot.roomId || bulkForm.slots[0]?.roomId || '',
      startTime: sourceSlot.startTime || bulkForm.slots[0]?.startTime || ''
    };
    if (!bulkForm.movieId || !firstSlot.roomId || !firstSlot.startTime) {
      setErrors(prev => ({
        ...prev,
        ...(!bulkForm.movieId ? { movieId: 'Chọn phim trước khi tự tạo khung giờ.' } : {}),
        ...(!firstSlot.roomId ? { [`slot_room_${activeBulkSlotIndex}`]: 'Chọn phòng cho slot đang sửa.' } : {}),
        ...(!firstSlot.startTime ? { [`slot_time_${activeBulkSlotIndex}`]: 'Nhập giờ bắt đầu cho slot đang sửa.' } : {})
      }));
      showToast?.('Chọn phim, phòng và giờ bắt đầu đầu tiên để tự tạo khung giờ.', 'error');
      return;
    }
    if (!bulkMovieDuration) {
      showToast?.('Phim chưa có thời lượng hợp lệ.', 'error');
      return;
    }
    const start = new Date(firstSlot.startTime);
    if (Number.isNaN(start.getTime())) {
      showToast?.('Giờ bắt đầu không hợp lệ.', 'error');
      return;
    }
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);
    const slots = [];
    const cursor = new Date(start);
    while (cursor <= dayEnd) {
      slots.push({ roomId: firstSlot.roomId, startTime: toInputDatetime(cursor), selected: true });
      cursor.setMinutes(cursor.getMinutes() + bulkStepMinutes);
    }
    setBulkForm({ ...bulkForm, slots });
    setEditingBulkSlotIndex(0);
    showToast?.(`Đã tạo ${slots.length} khung giờ trong ngày.`, 'success');
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white font-sans">Quản lý Suất Chiếu</h2>
          <p className="text-[13px] text-zinc-520 mt-0.5">Tạo, chỉnh sửa và giám sát lịch chiếu phim</p>
        </div>
        {mode === 'list' && (
          <div className="flex gap-2">
            <button onClick={() => { setMode('create'); setForm(EMPTY_FORM); setEditingId(null); setEditingStatus(''); setErrors({}); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition">
              <Plus className="w-3 h-3" /> Tạo suất
            </button>
            <button onClick={() => { setMode('bulk'); setBulkForm(EMPTY_BULK); setEditingBulkSlotIndex(0); setEditingId(null); setEditingStatus(''); setErrors({}); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider hover:bg-amber-400 transition">
              <Zap className="w-3 h-3" /> Tạo hàng loạt
            </button>
          </div>
        )}
        {mode !== 'list' && (
          <button onClick={() => { setMode('list'); setEditingId(null); setEditingStatus(''); setErrors({}); }}
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
                <select value={form.movieId} onChange={e => {
                  const nextMovieId = e.target.value;
                  const nextState = { ...form, movieId: nextMovieId };
                  setForm(allowsChildTicketsForMovie(findUiMovie(nextMovieId)) ? nextState : clearChildPrices(nextState));
                }}
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

              <PriceMatrix
                value={form}
                onChange={setForm}
                errors={errors}
                allowChildTickets={formAllowsChildTickets}
                ageRatingLabel={formMovie?.ageRating}
              />

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

            </div>
            <form onSubmit={handleBulkSubmit} className="space-y-5 text-xs font-sans">

              {/* Shared fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Phim *</label>
                  <select value={bulkForm.movieId} onChange={e => {
                    const nextMovieId = e.target.value;
                    const nextState = { ...bulkForm, movieId: nextMovieId };
                    setBulkForm(allowsChildTicketsForMovie(findUiMovie(nextMovieId)) ? nextState : clearChildPrices(nextState));
                  }}
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
                <PriceMatrix
                  value={bulkForm}
                  onChange={setBulkForm}
                  errors={errors}
                  allowChildTickets={bulkAllowsChildTickets}
                  ageRatingLabel={bulkMovie?.ageRating}
                />
              </div>

              <div className="space-y-4 border border-zinc-900 bg-zinc-950/40 p-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">
                      Khung giờ có thể chiếu ({selectedBulkSlotsCount}/{bulkForm.slots.length} đã chọn)
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Chọn phim, phòng và giờ bắt đầu. Hệ thống cộng thời lượng phim + 15 phút dọn phòng để sinh các ca còn lại trong ngày.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button"
                      onClick={generateBulkSlotsForDay}
                      className="flex items-center gap-1.5 text-[9px] text-emerald-300 border border-emerald-500/30 px-3 py-2 hover:border-emerald-400/60 hover:bg-emerald-950/20 transition">
                      <Clock className="w-3 h-3" /> Tự tạo trong ngày
                    </button>
                    <button type="button"
                      onClick={addManualBulkSlot}
                      className="flex items-center gap-1.5 text-[9px] text-amber-300 border border-amber-500/30 px-3 py-2 hover:border-amber-400/60 hover:bg-amber-950/20 transition">
                      <Plus className="w-3 h-3" /> Thêm slot
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-start">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-300 font-bold">Phòng chiếu *</label>
                    <select value={activeBulkSlot?.roomId || ''}
                      onChange={e => updateBulkSlot(activeBulkSlotIndex, { roomId: e.target.value, selected: true })}
                      className="w-full bg-black border border-zinc-800 p-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400 appearance-none">
                      <option value="">-- Chọn phòng --</option>
                      {rooms.filter(r => r.status === 'ACTIVE').map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    {errors[`slot_room_${activeBulkSlotIndex}`] && <p className="text-rose-400 text-[8px]">{errors[`slot_room_${activeBulkSlotIndex}`]}</p>}
                    <button type="button"
                      onClick={() => setAllBulkSlotsRoom(activeBulkSlot?.roomId || '')}
                      disabled={!activeBulkSlot?.roomId}
                      className="text-[10px] uppercase tracking-wider text-amber-400 hover:text-amber-500 disabled:opacity-40">
                      Áp dụng phòng này cho tất cả slot
                    </button>
                  </div>
                  <DateTimePicker
                    label="Ngày"
                    value={activeBulkSlot?.startTime || ''}
                    onChange={v => updateBulkSlot(activeBulkSlotIndex, { startTime: v, selected: true })}
                    error={errors[`slot_time_${activeBulkSlotIndex}`]}
                  />
                  <div className="min-w-[160px] border border-amber-500/20 bg-amber-500/10 p-3 text-[9px] text-zinc-300">
                    <p className="uppercase tracking-widest text-amber-300 font-black">Bước nhảy</p>
                    <p className="mt-1 font-mono text-white">{bulkMovieDuration || '--'} phút phim + 15 phút</p>
                    <p className="mt-2 text-zinc-350">Suất bắt đầu từ 23:00 đến trước 05:00 được BE cộng +20k/vé.</p>
                  </div>
                </div>

                {errors.slot_selection && <p className="text-rose-400 text-[9px]">{errors.slot_selection}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {bulkForm.slots.map((slot, i) => {
                    const selected = slot.selected !== false;
                    const endTime = getBulkSlotEnd(slot.startTime);
                    const capacity = getBulkSlotCapacity(slot);
                    const night = isNightSlot(slot.startTime);
                    return (
                      <div key={`${slot.startTime}-${i}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setEditingBulkSlotIndex(i)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          e.preventDefault();
                          setEditingBulkSlotIndex(i);
                        }}
                        className={`relative min-h-[132px] overflow-hidden rounded-lg border-2 bg-white text-left shadow-sm transition ${activeBulkSlotIndex === i ? 'border-sky-400 ring-2 ring-sky-400/40' : selected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-zinc-300 opacity-45 hover:opacity-80'}`}>
                        <div className="px-5 py-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-normal text-zinc-950 font-mono">{formatTimeOnly(slot.startTime)}</span>
                            <span className="text-xl font-semibold text-zinc-500">~{formatTimeOnly(endTime)}</span>
                          </div>
                          <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {rooms.find(r => String(r.id) === String(slot.roomId))?.name || 'Chưa chọn phòng'}
                          </p>
                        </div>
                        <div className={`border-t px-5 py-3 text-center text-2xl font-medium ${night ? 'border-orange-100 bg-orange-50 text-orange-500' : 'border-zinc-100 bg-zinc-50 text-zinc-500'}`}>
                          Còn {capacity || '--'}/{capacity || '--'}
                        </div>
                        <div className="absolute right-2 top-2 flex gap-1">
                          {activeBulkSlotIndex === i && <span className="rounded bg-sky-400 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-black">Sửa</span>}
                          {night && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-orange-600">Đêm +20k</span>}
                          {selected && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-black">Chọn</span>}
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBulkSlot(i);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            e.stopPropagation();
                            toggleBulkSlot(i);
                          }}
                          className={`absolute bottom-2 left-2 rounded px-2 py-1 text-[8px] font-black uppercase tracking-wider ${selected ? 'bg-zinc-900 text-white hover:bg-rose-600' : 'bg-amber-400 text-black hover:bg-amber-300'}`}>
                          {selected ? 'Bỏ chọn' : 'Chọn'}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (bulkForm.slots.length === 1) return;
                            removeBulkSlot(i);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            e.stopPropagation();
                            if (bulkForm.slots.length === 1) return;
                            removeBulkSlot(i);
                          }}
                          className={`absolute bottom-2 right-2 p-1 text-zinc-400 hover:text-rose-500 ${bulkForm.slots.length === 1 ? 'pointer-events-none opacity-20' : ''}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slots */}
              <div className="hidden">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">
                    Danh sách khung giờ ({bulkForm.slots.length} slot)
                  </label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={generateBulkSlotsForDay}
                      className="flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-1 hover:border-emerald-400/50 transition">
                      <Clock className="w-2.5 h-2.5" /> Tự tạo trong ngày
                    </button>
                    <button type="button"
                      onClick={addManualBulkSlot}
                      className="flex items-center gap-1 text-[9px] text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2 py-1 hover:border-amber-400/50 transition">
                      <Plus className="w-2.5 h-2.5" /> Thêm slot
                    </button>
                  </div>
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
                {saving ? 'Đang tạo...' : `Tạo ${selectedBulkSlotsCount} suất chiếu cùng lúc`}
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
                        <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">
                          <div className="font-mono">{fmtPrice(st.adultStandardPrice ?? st.basePrice)}</div>
                          {Number(st.surchargeAmount || 0) > 0 && (
                            <div className="text-[9px] text-amber-400">+{fmtPrice(st.surchargeAmount)} phụ thu</div>
                          )}
                        </td>
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
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
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
            className="fixed inset-0 z-[250] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-20 pb-24 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="max-h-[calc(100vh-8rem)] w-full max-w-md space-y-4 overflow-y-auto border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
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
                  ['Người lớn - thường', fmtPrice(detailModal.adultStandardPrice ?? detailModal.basePrice)],
                  ['Trẻ em - thường', fmtPrice(detailModal.childStandardPrice)],
                  ['Sinh viên - thường', fmtPrice(detailModal.studentStandardPrice)],
                  ['Người lớn - VIP', fmtPrice(detailModal.adultVipPrice ?? detailModal.vipPrice)],
                  ['Người lớn - ghế đôi', fmtPrice(detailModal.adultCouplePrice ?? detailModal.couplePrice)],
                  ['Phụ thu áp dụng', fmtPrice(detailModal.surchargeAmount)],
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
