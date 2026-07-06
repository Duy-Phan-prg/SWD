import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit3, ShieldAlert, FileText, Database,
  Calendar, Users, DollarSign, Activity, AlertCircle, CheckCircle2,
  Search, Sliders, ChevronDown, Check, RefreshCw, Layers, ShoppingBag,
  BarChart2, Clock, Film, Play, Eye, EyeOff, TrendingUp, Info, Tags, LogOut
} from 'lucide-react';
import { expireAuthSession, getStoredAuth, hasBackendAdminAccess } from '../../services/authService';
import { adminService } from '../../services/adminService';
import { useAuthStore } from '../../stores/useAuthStore';
import AdminOverviewPanel from './overview/AdminOverviewPanel';
import AdminMoviesPanel from './catalog/AdminMoviesPanel';
import AdminGenresPanel from './catalog/AdminGenresPanel';
import AdminActorsPanel from './catalog/AdminActorsPanel';
import AdminFoodsPanel from './catalog/AdminFoodsPanel';
import AdminShowtimesPanel from './cinema/AdminShowtimesPanel';
import AdminTransactionsPanel from './system/AdminTransactionsPanel';
import AdminUsersPanel from './system/AdminUsersPanel';
import AdminCinemaPanel from './cinema/AdminCinemaPanel';
import AdminRoomsPanel from './cinema/AdminRoomsPanel';

const getNavGroup = (section) => {
  if (['genres', 'actors', 'movies', 'foods'].includes(section)) return 'movies';
  if (['rooms', 'showtimes', 'transactions'].includes(section)) return 'cinema';
  if (['users'].includes(section)) return 'system';
  return null;
};

const ADMIN_SECTIONS = new Set([
  'overview',
  'genres',
  'actors',
  'movies',
  'foods',
  'rooms',
  'showtimes',
  'transactions',
  'users',
  'cinema'
]);

const normalizeAdminSection = (section) => (ADMIN_SECTIONS.has(section) ? section : 'overview');

export default function AdminDashboard({
  moviesList,
  setMoviesList,
  bookedTickets,
  setBookedTickets,
  publicCinema,
  onCinemaChanged = () => { },
  onSelectMovie,
  showToast = () => { },
  initialSection = 'overview',
  onSectionChange = () => { },
  onFoodCatalogChanged = () => { },
  isAdmin = false,
  currentUser = null
}) {
  const [activeTab, setActiveTab] = useState(normalizeAdminSection(initialSection)); // 'overview' | 'movies' | 'genres' | 'foods' | 'showtimes' | 'transactions' | 'users'
  const [openNavGroup, setOpenNavGroup] = useState(getNavGroup(normalizeAdminSection(initialSection)));
  const [activeChartPoint, setActiveChartPoint] = useState(6);

  // Create state for movies so the dashboard can add/update them
  const [searchQuery, setSearchQuery] = useState('');
  const [filmFilter, setFilmFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'UPCOMING'
  const [adminGenreFilter, setAdminGenreFilter] = useState('');
  const [adminMoviePagination, setAdminMoviePagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: moviesList.length
  });

  const toDateInputValue = (date) => {
    const value = new Date(date);
    value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
    return value.toISOString().slice(0, 10);
  };
  const addDaysInputValue = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toDateInputValue(date);
  };
  const buildDefaultMovieForm = () => ({
    title: '',
    englishTitle: '',
    genre: '',
    genreIds: [],
    duration: 120,
    ageRating: 'T13',
    director: '',
    synopsis: '',
    trailerUrl: '',
    language: 'Tiếng Việt',
    subtitleLanguage: 'EN Sub',
    status: 'NOW_SHOWING',
    castList: '',
    actorIds: [],
    mainActorIds: [],
    posterUrl: '',
    bannerUrl: '',
    releaseDate: toDateInputValue(new Date()),
    endDate: addDaysInputValue(30)
  });

  // Form state for creating/editing movie
  const [editingMovie, setEditingMovie] = useState(null); // null means adding a new one
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [isMovieSaving, setIsMovieSaving] = useState(false);
  const [formData, setFormData] = useState(buildDefaultMovieForm);

  // State to add a screening schedule
  const [newShowtime, setNewShowtime] = useState({
    movieId: moviesList[0]?.id || '',
    hall: 'Phòng Chiếu Thượng Hạng Gold 01',
    date: 'Thứ Bảy, 23/05/2026',
    time: '19:30',
    price: 120000
  });
  const [isAddingShowtime, setIsAddingShowtime] = useState(false);
  const [showtimeSuccessMessage, setShowtimeSuccessMessage] = useState('');
  const [genres, setGenres] = useState([]);
  const [genrePagination, setGenrePagination] = useState({ page: 0, size: 10, totalPages: 1, totalItems: 0 });
  const [genreSearch, setGenreSearch] = useState('');
  const [genreForm, setGenreForm] = useState({ name: '', description: '' });
  const [genreErrors, setGenreErrors] = useState({});
  const [editingGenreId, setEditingGenreId] = useState(null);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  const [isGenreSaving, setIsGenreSaving] = useState(false);
  const [actors, setActors] = useState([]);
  const [actorSearch, setActorSearch] = useState('');
  const [actorForm, setActorForm] = useState({ name: '', biography: '', avatarUrl: '' });
  const [actorErrors, setActorErrors] = useState({});
  const [editingActorId, setEditingActorId] = useState(null);
  const [isActorLoading, setIsActorLoading] = useState(false);
  const [isActorSaving, setIsActorSaving] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [foodCombos, setFoodCombos] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodKind, setFoodKind] = useState('item');
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    stockQuantity: '',
    status: 'ACTIVE'
  });
  const [foodErrors, setFoodErrors] = useState({});
  const [isFoodLoading, setIsFoodLoading] = useState(false);
  const [isFoodSaving, setIsFoodSaving] = useState(false);
  const [isFoodImageUploading, setIsFoodImageUploading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  const [isUserStatusSaving, setIsUserStatusSaving] = useState(false);
  const [isStaffCreating, setIsStaffCreating] = useState(false);

  React.useEffect(() => {
    if (!isAdmin || activeTab !== 'movies') return undefined;

    const token = getAdminToken(false);
    if (!token) {
      setAdminMoviePagination((prev) => ({
        ...prev,
        totalElements: moviesList.length,
        totalPages: Math.max(1, Math.ceil(moviesList.length / Math.max(prev.size, 1)))
      }));
      return undefined;
    }

    let cancelled = false;
    const status = filmFilter === 'ACTIVE'
      ? 'NOW_SHOWING'
      : filmFilter === 'UPCOMING'
        ? 'UPCOMING'
        : '';

    const timeoutId = setTimeout(async () => {
      try {
        const pageData = await adminService.searchAdminMoviesPage(token, {
          keyword: searchQuery.trim(),
          status,
          genreId: adminGenreFilter,
          page: adminMoviePagination.page,
          size: adminMoviePagination.size
        });
        if (!cancelled) {
          setMoviesList(pageData.items);
          setAdminMoviePagination((prev) => ({
            ...prev,
            page: pageData.page,
            size: pageData.size,
            totalPages: pageData.totalPages,
            totalElements: pageData.totalElements
          }));
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error.message || 'Không thể tải danh sách phim quản trị.');
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAdmin, activeTab, searchQuery, filmFilter, adminGenreFilter, adminMoviePagination.page, adminMoviePagination.size, moviesList.length, setMoviesList]);

  const visibleFoods = [
    ...foodCombos.map((item) => ({ ...item, kind: 'combo' })),
    ...foodItems.map((item) => ({ ...item, kind: 'item' }))
  ].filter((item) => item.name?.toLowerCase().includes(foodSearch.toLowerCase()));

  // Predefined lists of halls and times for quick selection
  const HALL_OPTIONS = [
    'Phòng Chiếu Thượng Hạng Gold 01',
    'Khán Phòng IMAX 3D Theatre',
    'Phòng Standard Suite 03',
    'Phòng Trải Nghiệm 4DX Extreme'
  ];

  const TIME_OPTIONS = [
    '09:00', '11:30', '14:15', '16:45', '19:15', '21:30', '23:45'
  ];

  // Sounds configuration
  const playPulseSound = (frequency = 440, type = 'sine', duration = 0.08) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { }
  };

  // Log of simulated changes within session
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Khởi tạo hệ thống', target: 'Cơ sở dữ liệu CinePremier v2.0', time: '03:15:02', user: 'Quản trị viên' },
    { id: 2, action: 'Cập nhật dữ liệu', target: 'Trung tâm phát hành thẻ VIP', time: '03:20:11', user: 'Hệ thống tự động' }
  ]);

  const addAuditLog = (action, target) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setAuditLogs(prev => [
      { id: Date.now(), action, target, time: timeStr, user: 'Quản trị viên' },
      ...prev
    ]);
  };

  const resetFoodForm = () => {
    setFoodForm({ name: '', description: '', price: '', imageUrl: '', stockQuantity: '', status: 'ACTIVE' });
    setFoodErrors({});
    setEditingFood(null);
    setFoodKind('item');
  };

  const validateFoodForm = () => {
    const errors = {};
    const name = foodForm.name.trim();
    const description = foodForm.description.trim();
    const price = Number(foodForm.price);
    const imageUrl = foodForm.imageUrl.trim();
    const stockQuantity = Number(foodForm.stockQuantity);

    if (!name) errors.name = 'Tên món là bắt buộc.';
    if (name.length > 255) errors.name = 'Tên món tối đa 255 ký tự.';
    if (description.length > 500) errors.description = 'Mô tả tối đa 500 ký tự.';
    if (!foodForm.price) errors.price = 'Giá bán là bắt buộc.';
    if (!Number.isFinite(price) || price <= 0) errors.price = 'Giá bán phải lớn hơn 0.';
    if (imageUrl.length > 500) errors.imageUrl = 'URL hình ảnh tối đa 500 ký tự.';

    if (foodForm.stockQuantity === '') errors.stockQuantity = 'Số lượng tồn kho là bắt buộc.';
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) errors.stockQuantity = 'Số lượng tồn kho phải là số nguyên từ 0 trở lên.';

    const allFoods = foodKind === 'item' ? foodItems : foodCombos;
    const duplicate = allFoods.some((item) => (
      item.name?.trim().toLowerCase() === name.toLowerCase()
      && !(editingFood && item.id === editingFood.id)
    ));
    if (duplicate) errors.name = 'Tên món đã tồn tại trong nhóm đang chọn.';

    setFoodErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchFoods = async () => {
    const token = getAdminToken();
    if (!token) {
      setFoodItems([]);
      setFoodCombos([]);
      return;
    }

    setIsFoodLoading(true);
    try {
      const [items, combos] = await Promise.all([
        adminService.getAdminFoodItems(token),
        adminService.getAdminFoodCombos(token)
      ]);
      setFoodItems(Array.isArray(items) ? items : []);
      setFoodCombos(Array.isArray(combos) ? combos : []);
    } catch (error) {
      showToast(error.message || 'Không thể tải danh sách bắp nước từ BE.');
    } finally {
      setIsFoodLoading(false);
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!validateFoodForm()) return;

    const token = getAdminToken();
    if (!token) return;

    setIsFoodSaving(true);
    const payload = {
      name: foodForm.name.trim(),
      description: foodForm.description.trim(),
      price: Number(foodForm.price),
      imageUrl: foodForm.imageUrl.trim(),
      stockQuantity: Number(foodForm.stockQuantity),
      status: foodForm.status
    };

    try {
      const saved = editingFood
        ? foodKind === 'combo'
          ? await adminService.updateAdminFoodCombo(token, editingFood.id, payload)
          : await adminService.updateAdminFoodItem(token, editingFood.id, payload)
        : foodKind === 'combo'
          ? await adminService.createAdminFoodCombo(token, payload)
          : await adminService.createAdminFoodItem(token, payload);

      if (foodKind === 'combo') {
        setFoodCombos((prev) => editingFood
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev]);
      } else {
        setFoodItems((prev) => editingFood
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev]);
      }

      addAuditLog(editingFood ? 'Cập nhật bắp nước' : 'Tạo bắp nước', saved.name);
      showToast(editingFood ? `Đã cập nhật món: ${saved.name}` : `Đã tạo món mới: ${saved.name}`);
      resetFoodForm();
      onFoodCatalogChanged();
    } catch (error) {
      showToast(error.message || 'Không thể lưu món bắp nước.');
    } finally {
      setIsFoodSaving(false);
    }
  };

  const handleEditFood = (food, kind) => {
    setFoodKind(kind);
    setEditingFood(food);
    setFoodForm({
      name: food.name || '',
      description: food.description || '',
      price: food.price || '',
      imageUrl: food.imageUrl || '',
      stockQuantity: food.stockQuantity ?? '',
      status: food.status || 'ACTIVE'
    });
    setFoodErrors({});
  };

  const handleToggleFoodStatus = async (food, kind) => {
    const nextStatus = food.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const token = getAdminToken();
    if (!token) return;

    const payload = {
      name: food.name,
      description: food.description || '',
      price: Number(food.price),
      imageUrl: food.imageUrl || '',
      stockQuantity: Number(food.stockQuantity ?? 0),
      status: nextStatus
    };

    try {
      const saved = kind === 'combo'
        ? await adminService.updateAdminFoodCombo(token, food.id, payload)
        : await adminService.updateAdminFoodItem(token, food.id, payload);

      if (kind === 'combo') {
        setFoodCombos((prev) => prev.map((item) => (item.id === food.id ? saved : item)));
      } else {
        setFoodItems((prev) => prev.map((item) => (item.id === food.id ? saved : item)));
      }
      showToast(`${nextStatus === 'ACTIVE' ? 'Đã bật bán' : 'Đã ẩn'} món: ${food.name}`);
      onFoodCatalogChanged();
    } catch (error) {
      showToast(error.message || 'Không thể đổi trạng thái món.');
    }
  };

  const getAdminToken = (notify = true) => {
    const sessionExpiredMessage = 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
    const { accessToken, user } = getStoredAuth();
    if (!accessToken) {
      if (notify) showToast(sessionExpiredMessage);
      expireAuthSession();
      return null;
    }

    const tokenPayload = (() => {
      try {
        if (!accessToken.includes('.')) return null;
        return JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      } catch (error) {
        return null;
      }
    })();
    const isTokenExpired = tokenPayload?.exp ? tokenPayload.exp * 1000 <= Date.now() : false;

    if (isTokenExpired) {
      if (notify) showToast(sessionExpiredMessage);
      expireAuthSession();
      return null;
    }

    if (!hasBackendAdminAccess(accessToken, user)) {
      if (notify) showToast('Tài khoản hiện tại không có quyền ADMIN. Vui lòng đăng nhập bằng tài khoản admin để dùng trang quản trị.', 5500, null, 'sad');
      return null;
    }

    return accessToken;
  };

  const handleFoodImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = getAdminToken();
    if (!token) return;

    setIsFoodImageUploading(true);
    try {
      const uploaded = await adminService.uploadAdminImage(token, file, 'foods');
      const uploadedUrl = uploaded?.url || uploaded?.secureUrl || uploaded?.imageUrl || uploaded?.data?.url;
      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh từ Storage.');
      }

      setFoodForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      setFoodErrors((prev) => ({ ...prev, imageUrl: undefined }));
      showToast('Đã upload ảnh món lên Storage.');
    } catch (error) {
      showToast(error.message || 'Không thể upload ảnh món lên Storage.');
    } finally {
      setIsFoodImageUploading(false);
    }
  };

  const changeAdminSection = (section) => {
    const nextSection = normalizeAdminSection(section);
    setActiveTab(nextSection);
    onSectionChange(nextSection);
    window.history.replaceState(null, '', `/admin/${nextSection}`);
  };

  const validateGenreForm = () => {
    const errors = {};
    const name = genreForm.name.trim();
    const description = genreForm.description.trim();

    if (!name) {
      errors.name = 'Tên thể loại là bắt buộc.';
    } else if (name.length > 100) {
      errors.name = 'Tên thể loại tối đa 100 ký tự.';
    }

    if (!description) {
      errors.description = 'Nội dung mô tả là bắt buộc.';
    } else if (description.length < 50) {
      errors.description = 'Nội dung mô tả cần tối thiểu 50 ký tự.';
    } else if (description.length > 1000) {
      errors.description = 'Nội dung mô tả phải dưới 1000 ký tự.';
    }

    const isDuplicate = genres.some((genre) => {
      const sameName = genre.name?.trim().toLowerCase() === name.toLowerCase();
      const isSameRecord = editingGenreId && genre.id === editingGenreId;
      return sameName && !isSameRecord;
    });

    if (name && isDuplicate) {
      errors.name = 'Tên thể loại đã tồn tại trong danh sách hiện tại.';
    }

    setGenreErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchGenres = async (page = 0) => {
    const token = getAdminToken();
    if (!token) return;

    setIsGenreLoading(true);
    try {
      const data = await adminService.getAdminGenres({ page, size: 10 });
      const genreList = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setGenres(genreList);
      if (data && !Array.isArray(data)) {
        setGenrePagination({
          page: data.page ?? page,
          size: data.size ?? 10,
          totalPages: data.totalPages ?? 1,
          totalItems: data.totalItems ?? genreList.length
        });
      }
    } catch (error) {
      showToast(error.message || 'Không thể tải danh sách thể loại phim.');
    } finally {
      setIsGenreLoading(false);
    }
  };

  const fetchActors = async (keyword = '') => {
    const token = getAdminToken();
    if (!token) return;

    setIsActorLoading(true);
    try {
      const data = await adminService.getAdminActors(token, { keyword: keyword.trim(), limit: 50 });
      setActors(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(error.message || 'Không thể tải danh sách diễn viên.');
    } finally {
      setIsActorLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    const token = getAdminToken();
    if (!token) return;

    setIsUsersLoading(true);
    try {
      const data = await adminService.getAdminUsers(token);
      const users = Array.isArray(data) ? data : [];
      setAdminUsers(users);
      setSelectedAdminUser((prev) => {
        if (!prev) return users[0] || null;
        return users.find((user) => String(user.id) === String(prev.id)) || users[0] || null;
      });
    } catch (error) {
      showToast(error.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleSelectAdminUser = async (userId) => {
    const token = getAdminToken();
    if (!token) return;

    setIsUserDetailLoading(true);
    try {
      const user = await adminService.getAdminUserDetail(token, userId);
      setSelectedAdminUser(user);
    } catch (error) {
      showToast(error.message || 'Không thể tải chi tiết người dùng.');
    } finally {
      setIsUserDetailLoading(false);
    }
  };

  const handleCreateStaff = async (payload) => {
    const token = getAdminToken();
    if (!token) return null;

    setIsStaffCreating(true);
    try {
      const createdStaff = await adminService.createAdminStaff(token, payload);
      setAdminUsers((prev) => [createdStaff, ...prev.filter((user) => String(user.id) !== String(createdStaff.id))]);
      setSelectedAdminUser(createdStaff);
      addAuditLog('Cấp tài khoản STAFF', createdStaff.email);
      showToast(`Đã cấp tài khoản STAFF cho ${createdStaff.email}.`);
      return createdStaff;
    } catch (error) {
      showToast(error.message || 'Không thể cấp tài khoản STAFF.');
      throw error;
    } finally {
      setIsStaffCreating(false);
    }
  };

  const handleUpdateAdminUserStatus = async (userId, status) => {
    const isCurrentAdmin =
      String(currentUser?.id || '') === String(userId || '') ||
      (selectedAdminUser?.email && currentUser?.email && selectedAdminUser.email === currentUser.email);

    if (isCurrentAdmin) {
      showToast('Không thể đổi trạng thái của chính tài khoản admin đang đăng nhập.');
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    setIsUserStatusSaving(true);
    try {
      const updatedUser = await adminService.updateAdminUserStatus(token, userId, status);
      setAdminUsers((prev) => prev.map((user) => (
        String(user.id) === String(userId) ? updatedUser : user
      )));
      setSelectedAdminUser(updatedUser);
      addAuditLog('Cập nhật trạng thái người dùng', `${updatedUser.email} -> ${updatedUser.status}`);
      showToast(`Đã đổi trạng thái ${updatedUser.email} thành ${updatedUser.status}.`);
    } catch (error) {
      showToast(error.message || 'Không thể đổi trạng thái người dùng.');
    } finally {
      setIsUserStatusSaving(false);
    }
  };

  React.useEffect(() => {
    const nextSection = normalizeAdminSection(initialSection);
    setActiveTab(nextSection);
    setOpenNavGroup(getNavGroup(nextSection));
    if (nextSection !== initialSection) {
      onSectionChange(nextSection);
      window.history.replaceState(null, '', `/admin/${nextSection}`);
    }
  }, [initialSection]);

  React.useEffect(() => {
    if (activeTab === 'genres' || activeTab === 'movies') {
      fetchGenres();
    }
    if (activeTab === 'movies') {
      fetchActors('');
    }
    if (activeTab === 'foods') {
      fetchFoods();
    }
    if (activeTab === 'users') {
      fetchAdminUsers();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== 'actors') return undefined;
    const timeoutId = setTimeout(() => fetchActors(actorSearch), 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, actorSearch]);

  const resetGenreForm = () => {
    setGenreForm({ name: '', description: '' });
    setGenreErrors({});
    setEditingGenreId(null);
  };

  const resetActorForm = () => {
    setActorForm({ name: '', biography: '', avatarUrl: '' });
    setActorErrors({});
    setEditingActorId(null);
  };

  const validateActorForm = () => {
    const errors = {};
    const name = actorForm.name.trim();
    if (!name) errors.name = 'Tên diễn viên là bắt buộc.';
    else if (name.length > 50) errors.name = 'Tên diễn viên tối đa 50 ký tự.';
    if (actorForm.biography.length > 1000) errors.biography = 'Tiểu sử tối đa 1000 ký tự.';
    if (actorForm.avatarUrl.length > 500) errors.avatarUrl = 'Avatar URL tối đa 500 ký tự.';
    if (actors.some((actor) => (
      actor.name?.trim().toLowerCase() === name.toLowerCase() &&
      String(actor.id) !== String(editingActorId)
    ))) {
      errors.name = 'Tên diễn viên đã tồn tại.';
    }
    setActorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleActorSubmit = async (event) => {
    event.preventDefault();
    if (!validateActorForm()) return;
    const token = getAdminToken();
    if (!token) return;

    setIsActorSaving(true);
    const payload = {
      name: actorForm.name.trim(),
      biography: actorForm.biography.trim(),
      avatarUrl: actorForm.avatarUrl.trim()
    };
    try {
      const savedActor = editingActorId
        ? await adminService.updateAdminActor(token, editingActorId, payload)
        : await adminService.createAdminActor(token, payload);
      setActors((prev) => editingActorId
        ? prev.map((actor) => String(actor.id) === String(editingActorId) ? savedActor : actor)
        : [savedActor, ...prev]);
      addAuditLog(editingActorId ? 'Cập nhật diễn viên' : 'Tạo diễn viên', savedActor.name);
      showToast(editingActorId ? `Đã cập nhật diễn viên: ${savedActor.name}` : `Đã tạo diễn viên: ${savedActor.name}`);
      resetActorForm();
    } catch (error) {
      showToast(error.message || 'Không thể lưu diễn viên.');
    } finally {
      setIsActorSaving(false);
    }
  };

  const handleEditActor = (actor) => {
    setEditingActorId(actor.id);
    setActorForm({
      name: actor.name || '',
      biography: actor.biography || '',
      avatarUrl: actor.avatarUrl || ''
    });
    setActorErrors({});
  };

  const performDeleteActor = async (actor) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminService.deleteAdminActor(token, actor.id);
      setActors((prev) => prev.filter((item) => String(item.id) !== String(actor.id)));
      addAuditLog('Xóa diễn viên', actor.name);
      showToast(`Đã xóa diễn viên: ${actor.name}`);
      if (String(editingActorId) === String(actor.id)) resetActorForm();
    } catch (error) {
      showToast(error.message || 'Không thể xóa diễn viên đang được sử dụng trong phim.');
    }
  };

  const handleDeleteActor = (actor) => {
    showToast(`Bạn có chắc muốn xóa diễn viên "${actor.name}"?`, 9000, {
      label: 'Xóa',
      onClick: () => performDeleteActor(actor)
    });
  };

  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    if (!validateGenreForm()) return;

    const token = getAdminToken();
    if (!token) return;

    setIsGenreSaving(true);
    const payload = {
      name: genreForm.name.trim(),
      description: genreForm.description.trim()
    };

    try {
      const savedGenre = editingGenreId
        ? await adminService.updateAdminGenre(token, editingGenreId, payload)
        : await adminService.createAdminGenre(token, payload);

      addAuditLog(editingGenreId ? 'Cập nhật thể loại phim' : 'Tạo thể loại phim', savedGenre.name);
      showToast(editingGenreId ? `Đã cập nhật thể loại: ${savedGenre.name}` : `Đã tạo thể loại mới: ${savedGenre.name}`);
      resetGenreForm();
      await fetchGenres(0);
    } catch (error) {
      showToast(error.message || 'Không thể lưu thể loại phim.');
    } finally {
      setIsGenreSaving(false);
    }
  };

  const handleEditGenre = (genre) => {
    setEditingGenreId(genre.id);
    setGenreForm({
      name: genre.name || '',
      description: genre.description || ''
    });
    setGenreErrors({});
  };

  const performDeleteGenre = async (genre) => {
    const token = getAdminToken();
    if (!token) return;

    try {
      await adminService.deleteAdminGenre(token, genre.id);
      addAuditLog('Xóa thể loại phim', genre.name);
      showToast(`Đã xóa thể loại: ${genre.name}`);
      if (editingGenreId === genre.id) resetGenreForm();
      // Reload trang hiện tại; nếu page bị rỗng thì lùi 1 trang
      const currentPage = genrePagination.page;
      const isLastOnPage = genres.length === 1 && currentPage > 0;
      await fetchGenres(isLastOnPage ? currentPage - 1 : currentPage);
    } catch (error) {
      showToast(error.message || 'Không thể xóa thể loại phim.');
    }
  };

  const handleDeleteGenre = (genre) => {
    showToast(`Bạn có chắc muốn xóa thể loại "${genre.name}" khỏi hệ thống?`, 9000, {
      label: 'Xóa',
      onClick: () => performDeleteGenre(genre)
    });
  };

  // Real headline metrics from /api/v1/admin/reports (last 30 days) — replaces the old simulated numbers.
  const [overviewMetrics, setOverviewMetrics] = useState({ revenue: 0, tickets: 0, fillRate: 0 });
  useEffect(() => {
    const token = getAdminToken(false);
    if (!token) return undefined;
    let cancelled = false;
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);
    Promise.all([
      adminService.getRevenueReport(token, { from, to }),
      adminService.getRoomOccupancy(token, { from, to })
    ])
      .then(([revenue, rooms]) => {
        if (cancelled) return;
        const occupancyList = Array.isArray(rooms) ? rooms : [];
        const avgFill = occupancyList.length
          ? occupancyList.reduce((acc, room) => acc + (room.occupancyRate || 0), 0) / occupancyList.length
          : 0;
        setOverviewMetrics({
          revenue: Number(revenue?.totalRevenue || 0),
          tickets: Number(revenue?.totalTicketsSold || 0),
          fillRate: Math.round(avgFill * 10) / 10
        });
      })
      .catch(() => { /* keep zeros — cards render real (empty) data, never fake numbers */ });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const totalBookingsCount = overviewMetrics.tickets;
  const calculatedRevenue = overviewMetrics.revenue;
  const averageFillRate = overviewMetrics.fillRate;

  const normalizeDateInput = (value) => {
    if (!value) return '';
    const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : String(value);
  };

  const resolveMovieId = (movie) => movie?.backendId ?? movie?.id ?? movie?.raw?.id ?? movie?.raw?.movieId;
  const hasReleaseDatePassed = (value) => {
    if (!value) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const releaseDate = new Date(value);
    releaseDate.setHours(0, 0, 0, 0);
    return !Number.isNaN(releaseDate.getTime()) && releaseDate < today;
  };
  const resolveMovieStatusFromDates = (releaseDateValue, endDateValue) => {
    const releaseDate = new Date(releaseDateValue);
    const endDate = new Date(endDateValue);
    const today = new Date();
    releaseDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(releaseDate.getTime()) || Number.isNaN(endDate.getTime())) return 'UPCOMING';
    if (today < releaseDate) return 'UPCOMING';
    if (today > endDate) return 'ENDED';
    return 'NOW_SHOWING';
  };
  const movieStatusRank = (status) => ({ UPCOMING: 0, NOW_SHOWING: 1, ENDED: 2 }[String(status || '').toUpperCase()] ?? -1);
  const isInvalidMovieStatusTransition = (movie, requestedStatus) => {
    if (requestedStatus === 'INACTIVE' || !hasReleaseDatePassed(movie?.releaseDate)) return false;
    if (requestedStatus === 'UPCOMING') return true;
    const currentRank = movieStatusRank(movie?.status);
    const requestedRank = movieStatusRank(requestedStatus);
    return currentRank >= 0 && requestedRank >= 0 && requestedRank < currentRank;
  };

  const resolveGenreIdsForMovie = (movie) => {
    const raw = movie?.raw || movie || {};
    const ids = [];
    const names = [];

    const pushId = (value) => {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) ids.push(parsed);
    };

    if (Array.isArray(raw.genreIds)) {
      raw.genreIds.forEach(pushId);
    }

    if (Array.isArray(raw.genres)) {
      raw.genres.forEach((item) => {
        if (typeof item === 'string') {
          names.push(item);
        } else if (item && typeof item === 'object') {
          if (item.id !== undefined || item.genreId !== undefined) {
            pushId(item.id ?? item.genreId);
          } else if (item.name) {
            names.push(item.name);
          }
        }
      });
    }

    if (!ids.length && Array.isArray(raw.genre)) {
      raw.genre.forEach((item) => {
        if (typeof item === 'string') {
          names.push(item);
        } else if (item && typeof item === 'object') {
          if (item.id !== undefined || item.genreId !== undefined) {
            pushId(item.id ?? item.genreId);
          } else if (item.name) {
            names.push(item.name);
          }
        }
      });
    }

    if (!ids.length && typeof raw.genre === 'string') {
      names.push(...raw.genre.split(','));
    }

    if (!ids.length && Array.isArray(movie?.genre)) {
      names.push(...movie.genre);
    }

    if (ids.length) {
      return Array.from(new Set(ids));
    }

    const nameLookup = new Map(
      genres
        .filter((genre) => genre?.name)
        .map((genre) => [genre.name.trim().toLowerCase(), Number(genre.id)])
    );
    const mapped = names
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean)
      .map((name) => nameLookup.get(name))
      .filter((value) => Number.isFinite(value));

    return Array.from(new Set(mapped));
  };

  const resetMovieForm = () => {
    setFormData(buildDefaultMovieForm());
    setEditingMovie(null);
  };

  const populateMovieForm = (movie) => {
    if (movie?.status === 'INACTIVE' || movie?.isInactive) {
      showToast('Phim đang ở trạng thái INACTIVE nên không thể cập nhật.');
      return;
    }
    if (String(movie?.status || '').toUpperCase() !== 'UPCOMING') {
      showToast('Chỉ cho cập nhật thông tin phim khi phim đang ở trạng thái UPCOMING.');
      return;
    }

    const defaultForm = buildDefaultMovieForm();
    const genreIds = resolveGenreIdsForMovie(movie);
    const genreNames = genreIds.length
      ? genres
        .filter((genre) => genreIds.includes(Number(genre.id)))
        .map((genre) => genre.name)
        .join(', ')
      : Array.isArray(movie?.genre)
        ? movie.genre.join(', ')
        : String(movie?.genre || '');

    setEditingMovie(movie);
    setFormData({
      ...defaultForm,
      title: movie?.title || defaultForm.title,
      englishTitle: movie?.englishTitle || defaultForm.englishTitle,
      genre: genreNames,
      genreIds,
      duration: Number(movie?.duration ?? movie?.durationMinutes ?? defaultForm.duration),
      ageRating: movie?.ageRating || defaultForm.ageRating,
      director: movie?.director || defaultForm.director,
      synopsis: movie?.synopsis || movie?.description || movie?.raw?.description || defaultForm.synopsis,
      trailerUrl: movie?.trailerUrl || defaultForm.trailerUrl,
      language: movie?.language || defaultForm.language,
      subtitleLanguage: movie?.subtitleLanguage || movie?.raw?.subtitleLanguage || defaultForm.subtitleLanguage,
      status: movie?.status || defaultForm.status,
      castList: movie?.castList || movie?.raw?.castList || movie?.cast || defaultForm.castList,
      actorIds: Array.isArray(movie?.actorIds)
        ? movie.actorIds.map(Number).filter(Number.isFinite)
        : Array.isArray(movie?.actors)
          ? movie.actors.map((actor) => Number(actor.id ?? actor.actorId)).filter(Number.isFinite)
          : Array.isArray(movie?.raw?.actors)
            ? movie.raw.actors.map((actor) => Number(actor.id ?? actor.actorId)).filter(Number.isFinite)
            : defaultForm.actorIds,
      mainActorIds: Array.isArray(movie?.mainActorIds)
        ? movie.mainActorIds.map(Number).filter(Number.isFinite)
        : Array.isArray(movie?.raw?.mainActorIds)
          ? movie.raw.mainActorIds.map(Number).filter(Number.isFinite)
          : defaultForm.mainActorIds,
      posterUrl: movie?.posterUrl || defaultForm.posterUrl,
      bannerUrl: movie?.bannerUrl || defaultForm.bannerUrl,
      releaseDate: normalizeDateInput(movie?.releaseDate) || defaultForm.releaseDate,
      endDate: normalizeDateInput(movie?.endDate || movie?.raw?.endDate) || defaultForm.endDate
    });
    setShowMovieForm(true);
  };

  const handleEditMovie = async (movie) => {
    const movieId = resolveMovieId(movie);
    const token = getAdminToken();
    if (!token || !movieId) return;

    setIsMovieSaving(true);
    try {
      const detail = await adminService.getAdminMovieDetail(token, movieId);
      populateMovieForm({ ...movie, ...detail });
    } catch (error) {
      showToast(error.message || 'Không thể tải chi tiết phim quản trị.');
    } finally {
      setIsMovieSaving(false);
    }
  };

  const handleCreateMovieSubmit = async (e) => {
    e.preventDefault();
    playPulseSound(587.33, 'sine', 0.2); // D5 success note

    const token = getAdminToken();
    if (!token) return;

    const targetMovieId = editingMovie ? resolveMovieId(editingMovie) : null;
    if (editingMovie && (editingMovie.status === 'INACTIVE' || editingMovie.isInactive)) {
      showToast('Phim đang ở trạng thái INACTIVE nên không thể cập nhật.');
      return;
    }
    if (editingMovie && String(editingMovie.status || '').toUpperCase() !== 'UPCOMING') {
      showToast('Chỉ cho cập nhật thông tin phim khi phim đang ở trạng thái UPCOMING.');
      return;
    }
    if (editingMovie && !targetMovieId) {
      showToast('Không xác định được mã phim để cập nhật.');
      return;
    }

    if (!formData.releaseDate || !formData.endDate) {
      showToast('Vui lòng chọn ngày phát hành và ngày kết thúc phim.');
      return;
    }
    if (formData.releaseDate < toDateInputValue(new Date())) {
      showToast('Ngày phát hành phải là hôm nay hoặc trong tương lai.');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.releaseDate)) {
      showToast('Ngày kết thúc phải bằng hoặc sau ngày phát hành.');
      return;
    }
    if (!String(formData.posterUrl || '').trim()) {
      showToast('Vui lòng upload ảnh poster trước khi tạo phim.');
      return;
    }
    if (!String(formData.bannerUrl || '').trim()) {
      showToast('Vui lòng upload ảnh banner trước khi tạo phim.');
      return;
    }
    if (!String(formData.trailerUrl || '').trim()) {
      showToast('Vui lòng upload video trailer trước khi tạo phim.');
      return;
    }

    const computedStatus = resolveMovieStatusFromDates(formData.releaseDate, formData.endDate);
    const payload = {
      title: formData.title.trim().toLocaleUpperCase('vi-VN'),
      englishTitle: formData.englishTitle.trim(),
      description: formData.synopsis.trim(),
      trailerUrl: formData.trailerUrl.trim(),
      posterUrl: formData.posterUrl.trim(),
      avatarUrl: formData.bannerUrl.trim(),
      durationMinutes: Number(formData.duration),
      releaseDate: formData.releaseDate || null,
      endDate: formData.endDate || null,
      language: formData.language.trim(),
      subtitleLanguage: formData.subtitleLanguage.trim(),
      status: computedStatus,
      ageRating: formData.ageRating,
      director: formData.director.trim(),
      genreIds: (formData.genreIds || []).map((id) => Number(id)),
      actorIds: (formData.actorIds || []).map(Number).filter(Number.isFinite),
      mainActorIds: (formData.mainActorIds || []).map(Number).filter(Number.isFinite)
    };

    setIsMovieSaving(true);
    try {
      const savedMovie = editingMovie
        ? await adminService.updateAdminMovie(token, targetMovieId, payload)
        : await adminService.createAdminMovie(token, payload);
      setMoviesList((prev) => editingMovie
        ? prev.map((item) => {
          const itemId = resolveMovieId(item);
          return String(itemId) === String(targetMovieId) ? savedMovie : item;
        })
        : [savedMovie, ...prev]);
      if (!editingMovie) {
        setAdminMoviePagination((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
      }
      addAuditLog(editingMovie ? 'Cập nhật phim' : 'Thêm phim mới', savedMovie.title);
      resetMovieForm();
      setShowMovieForm(false);
      showToast(editingMovie
        ? `Đã cập nhật phim: ${savedMovie.title}`
        : `Đã tạo phim mới: ${savedMovie.title}`);
    } catch (error) {
      showToast(error.message || (editingMovie ? 'Không thể cập nhật phim.' : 'Không thể tạo phim mới.'));
    } finally {
      setIsMovieSaving(false);
    }
    return;

    const generatedId = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newMovieObj = {
      id: generatedId,
      title: formData.title.toUpperCase(),
      englishTitle: formData.englishTitle || formData.title,
      genre: formData.genre.split(',').map(g => g.trim()),
      synopsis: formData.synopsis || 'Chưa cung cấp mô tả chi tiết phim.',
      duration: Number(formData.duration) || 120,
      ageRating: formData.ageRating,
      posterUrl: formData.posterUrl,
      bannerUrl: formData.bannerUrl,
      releaseDate: formData.releaseDate,
      director: formData.director || 'Chưa rõ',
      ratings: {
        overall: 9.0,
        story: 9.0,
        acting: 9.0,
        visual: 9.0,
        audio: 9.0
      },
      tags: ['Được_Đề_Xuất', 'Phát_Hành_Mới'],
    };

    setMoviesList([newMovieObj, ...moviesList]);
    addAuditLog('Thêm phim mới', newMovieObj.title);

    // Reset form
    setFormData({
      title: '',
      englishTitle: '',
      genre: '',
      duration: 120,
      ageRating: 'T13',
      director: '',
      synopsis: '',
      posterUrl: '',
      bannerUrl: '',
      releaseDate: toDateInputValue(new Date()),
      endDate: addDaysInputValue(30)
    });

    setShowMovieForm(false);
    showToast(`Đã biên tập thành công và thêm bản ghi phim: ${newMovieObj.title}`);
  };

  const handleDeleteMovie = (movie) => {
    const movieId = resolveMovieId(movie);
    const title = movie?.title || movie?.name || 'phim này';

    showToast(`Ngừng phát hành bản ghi phim "${title}"? Hành động này sẽ rút toàn bộ cổng suất chiếu liên quan.`, 9000, {
      label: 'Đình chỉ',
      onClick: async () => {
        playPulseSound(220, 'sawtooth', 0.25);

        const token = getAdminToken();
        if (!token) return;
        if (!movieId) {
          showToast('Không xác định được mã phim để xóa.');
          return;
        }

        try {
          await adminService.deleteAdminMovie(token, movieId);
          setMoviesList((prev) => prev.map((item) => (
            String(resolveMovieId(item)) === String(movieId)
              ? { ...item, status: 'INACTIVE', isInactive: true, isUpcoming: false, isNowShowing: false }
              : item
          )));
          if (editingMovie && String(resolveMovieId(editingMovie)) === String(movieId)) {
            resetMovieForm();
            setShowMovieForm(false);
          }
          addAuditLog('Xóa phim khỏi luồng', title);
          showToast(`Đã đình chỉ phát hành bản ghi phim: ${title}`);
        } catch (error) {
          showToast(error.message || 'Không thể xóa phim.');
        }
      }
    });
  };

  const handleUpdateMovieStatus = async (movie, status) => {
    const movieId = resolveMovieId(movie);
    const token = getAdminToken();
    if (!token || !movieId || !status || status === movie.status) return;
    if (isInvalidMovieStatusTransition(movie, status)) {
      showToast('Phim đã qua ngày phát hành nên không thể chuyển ngược trạng thái.');
      return;
    }

    try {
      const updatedMovie = await adminService.updateAdminMovieStatus(token, movieId, status);
      setMoviesList((prev) => prev.map((item) => (
        String(resolveMovieId(item)) === String(movieId) ? updatedMovie : item
      )));
      addAuditLog('Cập nhật trạng thái phim', `${updatedMovie.title} -> ${status}`);
      showToast(`Đã đổi trạng thái phim "${updatedMovie.title}" thành ${status}.`);
    } catch (error) {
      showToast(error.message || 'Không thể đổi trạng thái phim.');
    }
  };

  const handleAddShowtimeSubmit = (e) => {
    e.preventDefault();
    playPulseSound(659.25, 'sine', 0.15); // E5 note

    const targetMovie = moviesList.find(m => m.id === newShowtime.movieId);
    if (!targetMovie) {
      showToast("Suất chiếu cần tham chiếu một mã phim cụ thể.");
      return;
    }

    setShowtimeSuccessMessage(`Kích hoạt thành công suất chiếu mới của tác phẩm: ${targetMovie.title}`);
    addAuditLog('Phát phối suất chiếu mới', `${targetMovie.title} tại ${publicCinema?.name || 'rạp chiếu'}`);

    setTimeout(() => {
      setShowtimeSuccessMessage('');
      setIsAddingShowtime(false);
    }, 2800);
  };

  const handleRefundTicket = (ticketId, customerName) => {
    showToast(`Xác nhận bồi hoàn vé [${ticketId}] của khách hàng [${customerName}]? Ghế đã chọn sẽ được hoàn trả lại rạp chiếu.`, 9000, {
      label: 'Hoàn tiền',
      onClick: () => {
        playPulseSound(293.66, 'sine', 0.3);
        setBookedTickets(prev => prev.filter(t => t.ticketId !== ticketId));
        addAuditLog('Hoàn tiền giao dịch', `Mã vé ${ticketId}`);
        showToast(`Đã hoàn thành thủ tục hủy vé và hoàn trả tiền cho khách hàng ${customerName}.`);
      }
    });
  };

  // Filter movies
  const filteredMovies = moviesList.filter(mv => {
    const status = String(mv.status || '').toUpperCase();
    const matchesSearch =
      mv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mv.englishTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mv.director.toLowerCase().includes(searchQuery.toLowerCase());

    if (filmFilter === 'ALL') return matchesSearch;
    if (filmFilter === 'ACTIVE') return matchesSearch && status === 'NOW_SHOWING';
    if (filmFilter === 'UPCOMING') return matchesSearch && status === 'UPCOMING';
    return matchesSearch;
  });

  const filteredGenres = genres.filter((genre) => {
    const query = genreSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      genre.name?.toLowerCase().includes(query) ||
      genre.description?.toLowerCase().includes(query)
    );
  });

  const filteredActors = actors.filter((actor) => {
    const query = actorSearch.trim().toLowerCase();
    return !query || actor.name?.toLowerCase().includes(query) || actor.biography?.toLowerCase().includes(query);
  });

  const adminCtx = {
    activeTab,
    setActiveTab,
    activeChartPoint,
    setActiveChartPoint,
    searchQuery,
    setSearchQuery,
    filmFilter,
    setFilmFilter,
    adminGenreFilter,
    setAdminGenreFilter,
    adminMoviePagination,
    setAdminMoviePagination,
    editingMovie,
    setEditingMovie,
    showMovieForm,
    setShowMovieForm,
    isMovieSaving,
    formData,
    setFormData,
    newShowtime,
    setNewShowtime,
    isAddingShowtime,
    setIsAddingShowtime,
    showtimeSuccessMessage,
    setShowtimeSuccessMessage,
    genres,
    setGenres,
    genrePagination,
    setGenrePagination,
    genreSearch,
    setGenreSearch,
    genreForm,
    setGenreForm,
    genreErrors,
    setGenreErrors,
    editingGenreId,
    setEditingGenreId,
    isGenreLoading,
    setIsGenreLoading,
    isGenreSaving,
    setIsGenreSaving,
    actors,
    setActors,
    actorSearch,
    setActorSearch,
    actorForm,
    setActorForm,
    actorErrors,
    setActorErrors,
    editingActorId,
    setEditingActorId,
    isActorLoading,
    isActorSaving,
    foodItems,
    setFoodItems,
    foodCombos,
    setFoodCombos,
    foodSearch,
    setFoodSearch,
    foodKind,
    setFoodKind,
    editingFood,
    setEditingFood,
    foodForm,
    setFoodForm,
    foodErrors,
    setFoodErrors,
    isFoodLoading,
    setIsFoodLoading,
    isFoodSaving,
    setIsFoodSaving,
    isFoodImageUploading,
    handleFoodImageUpload,
    adminUsers,
    setAdminUsers,
    selectedAdminUser,
    setSelectedAdminUser,
    userSearch,
    setUserSearch,
    isUsersLoading,
    setIsUsersLoading,
    isUserDetailLoading,
    setIsUserDetailLoading,
    isUserStatusSaving,
    setIsUserStatusSaving,
    isStaffCreating,
    visibleFoods,
    HALL_OPTIONS,
    TIME_OPTIONS,
    playPulseSound,
    auditLogs,
    setAuditLogs,
    addAuditLog,
    resetFoodForm,
    validateFoodForm,
    fetchFoods,
    handleFoodSubmit,
    handleEditFood,
    handleToggleFoodStatus,
    getAdminToken,
    changeAdminSection,
    validateGenreForm,
    fetchGenres,
    resetGenreForm,
    handleGenreSubmit,
    handleEditGenre,
    performDeleteGenre,
    handleDeleteGenre,
    fetchActors,
    resetActorForm,
    handleActorSubmit,
    handleEditActor,
    handleDeleteActor,
    fetchAdminUsers,
    handleSelectAdminUser,
    handleCreateStaff,
    handleUpdateAdminUserStatus,
    totalBookingsCount,
    calculatedRevenue,
    averageFillRate,
    resetMovieForm,
    handleEditMovie,
    handleCreateMovieSubmit,
    handleUpdateMovieStatus,
    handleDeleteMovie,
    handleAddShowtimeSubmit,
    handleRefundTicket,
    filteredMovies,
    filteredGenres,
    filteredActors,
    moviesList,
    setMoviesList,
    bookedTickets,
    setBookedTickets,
    publicCinema,
    onCinemaChanged,
    onSelectMovie,
    showToast,
    initialSection,
    onSectionChange,
    onFoodCatalogChanged,
    isAdmin,
    currentUser
  };

  const adminPanels = {
    overview: AdminOverviewPanel,
    movies: AdminMoviesPanel,
    genres: AdminGenresPanel,
    actors: AdminActorsPanel,
    foods: AdminFoodsPanel,
    showtimes: AdminShowtimesPanel,
    transactions: AdminTransactionsPanel,
    users: AdminUsersPanel,
    cinema: AdminCinemaPanel,
    rooms: AdminRoomsPanel
  };

  const ActiveAdminPanel = adminPanels[activeTab] || AdminOverviewPanel;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 xl:px-8 2xl:px-10 py-8 text-white select-none">

      {/* CORE GRID: RESPONSIVE SIDEBAR + ACTIVE VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start">

        {/* LEFT COMPONENT: THE DASHBOARD SELECTOR BAR (Cols 3) */}
        <div className="space-y-4 lg:sticky lg:top-20" id="admin-sidebar-bar">

          {/* Active Admin Profile */}
          <div className="bg-gradient-to-b from-[#0a0a0a] to-[#040404] border border-neutral-850 p-3 space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 overflow-hidden rounded-sm border border-amber-500 bg-neutral-900 flex items-center justify-center text-amber-400 font-serif italic text-base font-black">
                A
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-[11px] font-black uppercase text-white tracking-wide">QUẢN TRỊ VIÊN</h4>
                <p className="text-[9px] text-[#88959C] font-mono">ID: CP-99210-ADMIN</p>
              </div>
            </div>
            <div className="h-[1px] bg-neutral-850"></div>
            <div className="flex items-center justify-between text-[10px] font-sans">
              <span className="text-neutral-500">Môi trường</span>
              <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> PRODUCTION
              </span>
            </div>
          </div>

          {/* Navigation Sidebar List (like image layout) */}
          <div className="bg-[#070707] border border-neutral-850 p-3 space-y-1.5 [&_button]:px-2.5 [&_button]:py-2.5 [&_button]:text-[9.5px] [&_svg]:h-3.5 [&_svg]:w-3.5" id="nav-sidebar-items">
            <span className="text-[7.5px] font-mono uppercase tracking-[0.18em] text-neutral-500 block px-2 pb-1.5 font-black">
              TỔNG QUAN
            </span>

            <button
              onClick={() => { playPulseSound(440, 'sine', 0.05); changeAdminSection('overview'); }}
              className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'overview'
                ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                }`}
            >
              <span className="flex items-center space-x-2.5">
                <Activity className="h-4 w-4 shrink-0 text-amber-500" />
                <span>TỔNG QUAN HỆ THỐNG</span>
              </span>
              {activeTab === 'overview' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
            </button>

            <button
              type="button"
              onClick={() => setOpenNavGroup(openNavGroup === 'movies' ? null : 'movies')}
              className={`mt-3 flex w-full items-center justify-between border-2 px-4 py-4 transition ${openNavGroup === 'movies' ? 'border-amber-500/60 bg-amber-500/[0.14] text-amber-300 shadow-[inset_3px_0_0_rgba(245,158,11,0.9)]' : 'border-white/10 bg-black/70 text-neutral-300 hover:border-amber-500/40 hover:text-white'}`}
            >
              <span className="text-xs font-sans font-black uppercase tracking-[0.16em] drop-shadow-sm">Quản lý phim</span>
              <ChevronDown className={`!h-4 !w-4 transition-transform duration-300 ${openNavGroup === 'movies' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {openNavGroup === 'movies' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => { playPulseSound(470, 'sine', 0.05); changeAdminSection('genres'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'genres'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Tags className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>THỂ LOẠI PHIM</span>
                    </span>
                    {activeTab === 'genres' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>

                  <button
                    onClick={() => { playPulseSound(465, 'sine', 0.05); changeAdminSection('actors'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'actors'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Users className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>DIỄN VIÊN</span>
                    </span>
                    {activeTab === 'actors' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>

                  <button
                    onClick={() => { playPulseSound(460, 'sine', 0.05); changeAdminSection('movies'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'movies'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Film className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>THƯ VIỆN PHIM</span>
                    </span>
                    {activeTab === 'movies' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>

                  <button
                    onClick={() => { playPulseSound(478, 'sine', 0.05); changeAdminSection('foods'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'foods'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <ShoppingBag className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>QUẢN LÝ BẮP NƯỚC</span>
                    </span>
                    {activeTab === 'foods' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setOpenNavGroup(openNavGroup === 'cinema' ? null : 'cinema')}
              className={`mt-2 flex w-full items-center justify-between border-2 px-4 py-4 transition ${openNavGroup === 'cinema' ? 'border-amber-500/60 bg-amber-500/[0.14] text-amber-300 shadow-[inset_3px_0_0_rgba(245,158,11,0.9)]' : 'border-white/10 bg-black/70 text-neutral-300 hover:border-amber-500/40 hover:text-white'}`}
            >
              <span className="text-xs font-sans font-black uppercase tracking-[0.16em] drop-shadow-sm">Quản lý rạp</span>
              <ChevronDown className={`!h-4 !w-4 transition-transform duration-300 ${openNavGroup === 'cinema' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {openNavGroup === 'cinema' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => { playPulseSound(470, 'sine', 0.05); changeAdminSection('rooms'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'rooms'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Layers className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>PHÒNG CHIẾU & GHẾ</span>
                    </span>
                    {activeTab === 'rooms' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>

                  <button
                    onClick={() => { playPulseSound(480, 'sine', 0.05); changeAdminSection('showtimes'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'showtimes'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Calendar className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>ĐIỀU PHỐI LỊCH CHIẾU</span>
                    </span>
                    {activeTab === 'showtimes' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>
                  <button
                    onClick={() => { playPulseSound(500, 'sine', 0.05); changeAdminSection('transactions'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'transactions'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>SỔ CÁI KIỂM TOÁN VÉ</span>
                    </span>
                    {activeTab === 'transactions' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setOpenNavGroup(openNavGroup === 'system' ? null : 'system')}
              className={`mt-2 flex w-full items-center justify-between border-2 px-4 py-4 transition ${openNavGroup === 'system' ? 'border-purple-500/60 bg-purple-500/[0.14] text-purple-300 shadow-[inset_3px_0_0_rgba(168,85,247,0.9)]' : 'border-white/10 bg-black/70 text-neutral-300 hover:border-purple-500/40 hover:text-white'}`}
            >
              <span className="text-xs font-sans font-black uppercase tracking-[0.16em] drop-shadow-sm">Hệ thống</span>
              <ChevronDown className={`!h-4 !w-4 transition-transform duration-300 ${openNavGroup === 'system' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {openNavGroup === 'system' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => { playPulseSound(510, 'sine', 0.05); changeAdminSection('users'); }}
                    className={`w-full flex items-center justify-between px-3 py-3 text-[10.5px] font-sans uppercase font-black tracking-widest transition-all duration-300 border ${activeTab === 'users'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400 font-black'
                      : 'border-white/5 bg-black/40 text-neutral-400 hover:text-white hover:border-neutral-850'
                      }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <Users className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>QUẢN LÝ NGƯỜI DÙNG</span>
                    </span>
                    {activeTab === 'users' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  </button>

                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-[1px] bg-neutral-900 my-3"></div>

            {/* Quick action: Làm mới trang */}
            <button
              onClick={() => {
                playPulseSound(300, 'sine', 0.15);
                showToast("Hệ thống: Rời khỏi phiên làm việc Quản trị viên.");
                setTimeout(() => window.location.reload(), 900);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-[10.5px] font-sans uppercase font-bold tracking-widest text-[#E57373] hover:text-white hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5 text-rose-500 animate-spin-slow" />
              <span>LÀM MỚI TRANG</span>
            </button>
          </div>


        </div>

        {/* RIGHT COMPONENT: MAIN VIEW DETAILS (Cols 9) */}
        <div className="min-w-0 space-y-6">

          {/* 2. CORPORATE CORE BENTO METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="corporate-bento-metrics">

            {/* Metric Card 1 */}
            <div className="bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-neutral-850 p-5 space-y-2.5 relative overflow-hidden shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[9px] tracking-wider font-extrabold text-[#7E8B93] uppercase font-sans">Tổng doanh thu liên kết</span>
                <div className="p-1 bg-amber-500/10 text-amber-500"><DollarSign className="h-4 w-4" /></div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white">{calculatedRevenue.toLocaleString()}đ</h2>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-neutral-850 p-5 space-y-2.5 relative overflow-hidden shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[9px] tracking-wider font-extrabold text-[#7E8B93] uppercase font-sans">Sản lượng vé xuất xưởng</span>
                <div className="p-1 bg-emerald-500/10 text-emerald-400"><FileText className="h-4 w-4" /></div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white">{totalBookingsCount} vé</h2>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-neutral-850 p-5 space-y-2.5 relative overflow-hidden shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[9px] tracking-wider font-extrabold text-[#7E8B93] uppercase font-sans">Hệ số lấp đầy rạp</span>
                <div className="p-1 bg-blue-500/10 text-blue-400"><Activity className="h-4 w-4" /></div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white">{averageFillRate}%</h2>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-neutral-850 p-5 space-y-2.5 relative overflow-hidden shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[9px] tracking-wider font-extrabold text-[#7E8B93] uppercase font-sans">Thư viện phát hành</span>
                <div className="p-1 bg-purple-500/10 text-purple-400"><Film className="h-4 w-4" /></div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white">{moviesList.length} phim</h2>
              </div>
            </div>

          </div>



          {/* TAB SCREENS EXECUTOR */}
          <div>
            <AnimatePresence mode="wait">
              <ActiveAdminPanel key={activeTab} ctx={adminCtx} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

