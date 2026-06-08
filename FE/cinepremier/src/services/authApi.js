const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const STORAGE_KEYS = {
  accessToken: 'cinepremier_access_token',
  refreshToken: 'cinepremier_refresh_token',
  user: 'cinepremier_auth_user',
  roles: 'cinepremier_auth_roles'
};

const ADMIN_ACCESS_OVERRIDE = false;

export const parseJwtPayload = (accessToken) => {
  try {
    if (!accessToken || !accessToken.includes('.')) return null;
    return JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch (error) {
    return null;
  }
};

export const hasBackendAdminAccess = (accessToken, user = null) => {
  const tokenPayload = parseJwtPayload(accessToken);
  const isTokenExpired = tokenPayload?.exp ? tokenPayload.exp * 1000 <= Date.now() : false;
  if (!accessToken || isTokenExpired) return false;

  const roleValues = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(tokenPayload?.roles) ? tokenPayload.roles : []),
    ...(Array.isArray(tokenPayload?.authorities) ? tokenPayload.authorities : []),
    ...(Array.isArray(tokenPayload?.scope) ? tokenPayload.scope : String(tokenPayload?.scope || '').split(' '))
  ].map((role) => String(role).toUpperCase()).filter(Boolean);

  return roleValues.includes('ADMIN') || roleValues.includes('ROLE_ADMIN');
};

const resolveRole = (roles = []) => {
  const normalized = roles.map((role) => String(role).toUpperCase());
  if (ADMIN_ACCESS_OVERRIDE || normalized.includes('ADMIN') || normalized.includes('ROLE_ADMIN')) return 'admin';
  if (normalized.includes('STAFF') || normalized.includes('ROLE_STAFF')) return 'staff';
  return 'user';
};

export const normalizeUser = (user, roles = user?.roles || []) => {
  if (!user) return null;
  const resolvedRoles = roles?.length ? roles : user.roles || [];

  return {
    ...user,
    roles: resolvedRoles,
    name: user.fullName || user.name || user.email,
    role: resolveRole(resolvedRoles),
    emailVerified: Boolean(user.emailVerified)
  };
};

const parseResponse = async (response) => {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok || payload?.success === false) {
    const fieldErrors = payload?.fieldErrors
      ? Object.values(payload.fieldErrors).flat().join(', ')
      : Array.isArray(payload?.errors)
        ? payload.errors.map((error) => error.message || `${error.field}: invalid`).join(', ')
        : '';
    const error = new Error(fieldErrors || payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
};

const tryRefreshToken = async () => {
  const { refreshToken } = getStoredAuth();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = payload?.data ?? payload;
    if (data?.accessToken) {
      localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
      return data.accessToken;
    }
  } catch { /* ignore */ }
  return null;
};

const request = async (path, { method = 'GET', body, token } = {}) => {
  const isFormData = body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  });

  // Token hết hạn → tự refresh và thử lại 1 lần
  if ((response.status === 401 || response.status === 403) && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryHeaders = isFormData
        ? { Authorization: `Bearer ${newToken}` }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` };
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
      });
      return parseResponse(retryResponse);
    }
    // Refresh cũng fail → session hết hạn hoàn toàn, báo app logout
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    error.status = 401;
    throw error;
  }

  return parseResponse(response);
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') searchParams.append(key, item);
      });
      return;
    }
    searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const unwrapListPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.movies)) return payload.movies;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeGenres = (movie = {}) => {
  const source = movie.genreNames || movie.genreNameList || movie.genres || movie.genre || movie.categories || [];
  const values = Array.isArray(source) ? source : String(source || '').split(',');
  const genres = values
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item.trim();
      return item.name || item.genreName || item.title || '';
    })
    .filter(Boolean);

  return genres.length ? genres : ['Đang cập nhật'];
};

const normalizeMovieStatus = (movie = {}) => String(movie.status || movie.movieStatus || '').toUpperCase();

export const normalizeMovie = (movie = {}, fallback = {}) => {
  const status = normalizeMovieStatus(movie) || normalizeMovieStatus(fallback);
  const id = movie.id ?? movie.movieId ?? movie.slug ?? movie.code ?? fallback.id;
  const ratings = movie.ratings || {};
  const aiOverall = Number(movie.aiOverall ?? movie.rating ?? movie.averageRating ?? ratings.aiOverall ?? fallback.ratings?.aiOverall ?? 8.8);
  const statusFromFlags = (movie.isUpcoming ?? fallback.isUpcoming) ? 'UPCOMING' : 'NOW_SHOWING';
  const effectiveStatus = status || statusFromFlags;
  const isUpcoming = ['UPCOMING', 'COMING_SOON', 'SCHEDULED', 'DRAFT'].includes(effectiveStatus);
  const isInactive = effectiveStatus === 'INACTIVE';

  return {
    ...fallback,
    ...movie,
    id: String(id || ''),
    backendId: movie.id ?? movie.movieId ?? fallback.backendId,
    title: movie.title || movie.name || movie.movieTitle || fallback.title || 'Phim chưa đặt tên',
    englishTitle: movie.englishTitle || movie.originalTitle || movie.subTitle || movie.titleEn || fallback.englishTitle || movie.title || movie.name || 'CinePremier Feature',
    genre: normalizeGenres(movie),
    synopsis: movie.synopsis || movie.description || movie.overview || movie.content || fallback.synopsis || 'Thông tin nội dung phim đang được cập nhật.',
    duration: Number(movie.duration ?? movie.durationMinutes ?? movie.runningTime ?? fallback.duration ?? 100),
    ageRating: movie.ageRating || movie.ratingLabel || movie.ageLimit || fallback.ageRating || 'P',
    posterUrl: movie.posterUrl || movie.poster || movie.posterImageUrl || movie.imageUrl || movie.thumbnailUrl || fallback.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    bannerUrl: movie.bannerUrl || movie.avatarUrl || movie.backdropUrl || movie.coverUrl || movie.bannerImageUrl || fallback.bannerUrl || movie.posterUrl || fallback.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
    releaseDate: movie.releaseDate || movie.premiereDate || movie.startDate || fallback.releaseDate || 'Đang cập nhật',
    trailerUrl: movie.trailerUrl || movie.trailer || fallback.trailerUrl || '',
    director: movie.director || movie.directorName || fallback.director || 'Đang cập nhật',
    mainActors: movie.mainActors || fallback.mainActors || movie.castList || fallback.castList || '',
    castList: movie.castList || fallback.castList || movie.mainActors || fallback.mainActors || '',
    actorIds: Array.isArray(movie.actors)
      ? movie.actors.map((actor) => actor.id ?? actor.actorId).filter((id) => id !== undefined && id !== null)
      : (movie.actorIds || fallback.actorIds || []),
    mainActorIds: movie.mainActorIds || fallback.mainActorIds || [],
    actors: movie.actors || fallback.actors || [],
    language: movie.language || fallback.language || 'Đang cập nhật',
    status: effectiveStatus,
    isUpcoming: Boolean(isUpcoming),
    isInactive,
    isNowShowing: effectiveStatus === 'NOW_SHOWING',
    isEnded: effectiveStatus === 'ENDED',
    isHot: Boolean(movie.isHot ?? movie.hot ?? movie.featured ?? fallback.isHot),
    upcomingDate: movie.upcomingDate || fallback.upcomingDate,
    ratings: {
      ...fallback.ratings,
      ...ratings,
      aiOverall,
      aiStory: Number(movie.aiStory ?? ratings.aiStory ?? fallback.ratings?.aiStory ?? Math.max(0, aiOverall - 0.2)),
      aiActing: Number(movie.aiActing ?? ratings.aiActing ?? fallback.ratings?.aiActing ?? Math.max(0, aiOverall - 0.3)),
      aiVisual: Number(movie.aiVisual ?? ratings.aiVisual ?? fallback.ratings?.aiVisual ?? aiOverall),
      aiAudio: Number(movie.aiAudio ?? ratings.aiAudio ?? fallback.ratings?.aiAudio ?? Math.max(0, aiOverall - 0.1))
    },
    aiAnalysisTags: movie.aiAnalysisTags || movie.tags || fallback.aiAnalysisTags || [],
    emotionalWaveform: movie.emotionalWaveform || fallback.emotionalWaveform || [20, 40, 60, 50, 80, 65, 75, 85, 90, 95, 60, 30],
    raw: movie
  };
};

const normalizeMovieListResponse = (payload) => unwrapListPayload(payload).map((movie) => normalizeMovie(movie));

const normalizeWishlistResponse = (payload) => unwrapListPayload(payload).map((item) => normalizeMovie({
  id: item.movieId,
  movieId: item.movieId,
  title: item.movieTitle,
  posterUrl: item.posterUrl,
  createdAt: item.createdAt
}, {
  id: item.movieId,
  backendId: item.movieId,
  englishTitle: item.movieTitle || 'CinePremier Feature',
  posterUrl: item.posterUrl
}));

const firstNumber = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeMoviePageResponse = (payload) => {
  const items = normalizeMovieListResponse(payload);
  const size = firstNumber(payload?.size, payload?.pageSize, payload?.pageable?.pageSize, items.length) || items.length || 8;
  const page = firstNumber(payload?.number, payload?.pageNumber, payload?.page, payload?.currentPage, payload?.pageable?.pageNumber, 0) || 0;
  const totalElements = firstNumber(payload?.totalElements, payload?.totalItems, payload?.total, payload?.totalRecords, items.length) || items.length;
  const totalPages = firstNumber(payload?.totalPages, payload?.pageCount, Math.ceil(totalElements / Math.max(size, 1))) || 1;

  return {
    items,
    page,
    size,
    totalElements,
    totalPages: Math.max(1, totalPages),
    raw: payload
  };
};

export const saveAuthSession = (authData) => {
  if (!authData) return null;

  const user = normalizeUser(authData.user, authData.roles);
  localStorage.setItem(STORAGE_KEYS.accessToken, authData.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, authData.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(authData.roles || user?.roles || []));

  return user;
};

export const clearAuthSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

export const getStoredAuth = () => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const roles = JSON.parse(localStorage.getItem(STORAGE_KEYS.roles) || '[]');
  const storedUser = localStorage.getItem(STORAGE_KEYS.user);
  const user = storedUser ? normalizeUser(JSON.parse(storedUser), roles) : null;

  return { accessToken, refreshToken, roles, user };
};

export const authApi = {
  register: (payload) => request('/api/v1/auth/register', { method: 'POST', body: payload }),
  verifyEmail: (email, otp) => request('/api/v1/auth/verify-email', { method: 'POST', body: { email, otp } }),
  requestEmailVerification: (email) => request('/api/v1/auth/verify-email/request', {
    method: 'POST',
    body: { email }
  }),
  login: (payload) => request('/api/v1/auth/login', { method: 'POST', body: payload }),
  loginWithGoogle: (credential) => request('/api/v1/auth/google', {
    method: 'POST',
    body: { credential }
  }),
  verifyGoogleLoginOtp: (email, otp) => request('/api/v1/auth/google/verify', {
    method: 'POST',
    body: { email, otp }
  }),
  refresh: (refreshToken) => request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken) => request('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } }),
  requestPasswordReset: (email) => request('/api/v1/auth/password-reset/request', {
    method: 'POST',
    body: { email }
  }),
  confirmPasswordReset: ({ email, otp, newPassword, confirmPassword }) => request('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    body: { email, otp, newPassword, confirmPassword }
  }),
  getMyProfile: (token) => request('/api/v1/users/me', { token }),
  updateMyProfile: (token, payload) => request('/api/v1/users/me', {
    method: 'PUT',
    token,
    body: payload
  }),
  changeMyPassword: (token, payload) => request('/api/v1/users/me/password', {
    method: 'POST',
    token,
    body: payload
  }),
  searchMovies: (params = {}) => request(`/api/v1/movies${buildQueryString(params)}`)
    .then(normalizeMovieListResponse),
  searchMoviesPage: (params = {}) => request(`/api/v1/movies${buildQueryString(params)}`)
    .then(normalizeMoviePageResponse),
  getMovieDetail: (movieId) => request(`/api/v1/movies/${encodeURIComponent(movieId)}`)
    .then((movie) => normalizeMovie(movie)),
  searchAdminMovies: (token, params = {}) => request(`/api/v1/admin/movies${buildQueryString(params)}`, { token })
    .then(normalizeMovieListResponse),
  searchAdminMoviesPage: (token, params = {}) => request(`/api/v1/admin/movies${buildQueryString(params)}`, { token })
    .then(normalizeMoviePageResponse),
  getAdminMovieDetail: (token, movieId) => request(`/api/v1/admin/movies/${encodeURIComponent(movieId)}`, { token })
    .then((movie) => normalizeMovie(movie)),
  createAdminMovie: (token, payload) => request('/api/v1/admin/movies', {
    method: 'POST',
    token,
    body: payload
  }).then((movie) => normalizeMovie(movie)),
  updateAdminMovie: (token, movieId, payload) => request(`/api/v1/admin/movies/${encodeURIComponent(movieId)}`, {
    method: 'PUT',
    token,
    body: payload
  }).then((movie) => normalizeMovie(movie)),
  updateAdminMovieStatus: (token, movieId, status) => request(`/api/v1/admin/movies/${encodeURIComponent(movieId)}/status`, {
    method: 'PATCH',
    token,
    body: { status }
  }).then((movie) => normalizeMovie(movie)),
  deleteAdminMovie: (token, movieId) => request(`/api/v1/admin/movies/${encodeURIComponent(movieId)}`, {
    method: 'DELETE',
    token
  }),
  getActors: () => request('/api/v1/actors'),
  getActorDetail: (actorId) => request(`/api/v1/actors/${encodeURIComponent(actorId)}`),
  getMoviesByActor: (actorId) => request(`/api/v1/actors/${encodeURIComponent(actorId)}/movies`)
    .then(normalizeMovieListResponse),
  getAdminActors: (token, params = {}) => request(`/api/v1/admin/actors${buildQueryString(params)}`, { token }),
  uploadAdminImage: (token, file, folder = 'images') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return request('/api/v1/admin/uploads/images', {
      method: 'POST',
      token,
      body: formData
    });
  },
  createAdminActor: (token, payload) => request('/api/v1/admin/actors', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminActor: (token, actorId, payload) => request(`/api/v1/admin/actors/${encodeURIComponent(actorId)}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  deleteAdminActor: (token, actorId) => request(`/api/v1/admin/actors/${encodeURIComponent(actorId)}`, {
    method: 'DELETE',
    token
  }),
  getAdminUsers: (token) => request('/api/v1/admin/users', { token }),
  getAdminUserDetail: (token, userId) => request(`/api/v1/admin/users/${encodeURIComponent(userId)}`, { token }),
  updateAdminUserStatus: (token, userId, status) => request(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    token,
    body: { status }
  }),
  getAdminGenres: () => request('/api/v1/genres'),
  createAdminGenre: (token, payload) => request('/api/v1/admin/genres', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminGenre: (token, genreId, payload) => request(`/api/v1/admin/genres/${genreId}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  deleteAdminGenre: (token, genreId) => request(`/api/v1/admin/genres/${genreId}`, {
    method: 'DELETE',
    token
  }),
  getFoodItems: () => request('/api/v1/foods/items'),
  getFoodCombos: () => request('/api/v1/foods/combos'),
  getPublicCinema: () => request('/api/v1/admin/cinema'),
  getAdminCinema: (token) => request('/api/v1/admin/cinema', { token }),
  createAdminCinema: (token, payload) => request('/api/v1/admin/cinema', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminCinema: (token, payload) => request('/api/v1/admin/cinema', {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminCinemaStatus: (token, status) => request(`/api/v1/admin/cinema/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    token
  }),
  deactivateAdminCinema: (token) => request('/api/v1/admin/cinema', {
    method: 'DELETE',
    token
  }),
  getAdminRooms: (token) => request('/api/v1/admin/rooms', { token }),
  getAdminRoom: (token, roomId) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}`, { token }),
  createAdminRoom: (token, payload) => request('/api/v1/admin/rooms', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminRoom: (token, roomId, payload) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminRoomStatus: (token, roomId, status) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    token
  }),
  getAdminRoomSeats: (token, roomId) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}/seats`, { token }),
  createAdminRoomSeats: (token, roomId, payload) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}/seats/generate`, {
    method: 'POST',
    token,
    body: payload
  }),
  replaceAdminRoomSeats: (token, roomId, payload) => request(`/api/v1/admin/rooms/${encodeURIComponent(roomId)}/seats`, {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminSeat: (token, seatId, payload) => request(`/api/v1/admin/rooms/seats/${encodeURIComponent(seatId)}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  deactivateAdminSeat: (token, seatId) => request(`/api/v1/admin/rooms/seats/${encodeURIComponent(seatId)}`, {
    method: 'DELETE',
    token
  }),
  // Showtimes (public)
  getShowtimes: (params = {}) => request(`/api/v1/showtimes${buildQueryString(params)}`),
  getSeatMap: (showtimeId) => request(`/api/v1/showtimes/${showtimeId}/seat-map`),
  getShowtimeDetail: (showtimeId) => request(`/api/v1/showtimes/${showtimeId}`),

  // Showtimes (admin)
  getAdminShowtimes: (token, params = {}) => request(`/api/v1/admin/showtimes${buildQueryString(params)}`, { token }),
  getAdminShowtime: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}`, { token }),
  getAdminShowtimeSeatMap: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}/seat-map`, { token }),
  createAdminShowtime: (token, payload) => request('/api/v1/admin/showtimes', { method: 'POST', token, body: payload }),
  createAdminShowtimesBulk: (token, payload) => request('/api/v1/admin/showtimes/bulk', { method: 'POST', token, body: payload }),
  updateAdminShowtime: (token, showtimeId, payload) => request(`/api/v1/admin/showtimes/${showtimeId}`, { method: 'PUT', token, body: payload }),
  updateAdminShowtimeStatus: (token, showtimeId, status) => request(`/api/v1/admin/showtimes/${showtimeId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH', token }),
  deleteAdminShowtime: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}`, { method: 'DELETE', token }),

  // Bookings
  holdSeats: (token, body) => request('/api/v1/bookings/hold', { method: 'POST', token, body }),
  createBooking: (token, body) => request('/api/v1/bookings', { method: 'POST', token, body }),
  getMyBookings: (token) => request('/api/v1/bookings', { token }),
  getMyBooking: (token, bookingId) => request(`/api/v1/bookings/${bookingId}`, { token }),
  cancelBooking: (token, bookingId) => request(`/api/v1/bookings/${bookingId}`, { method: 'DELETE', token }),

  // Wishlist
  getWishlist: (token) => request('/api/v1/wishlist', { token }).then(normalizeWishlistResponse),
  addWishlist: (token, movieId) => request('/api/v1/wishlist', {
    method: 'POST',
    token,
    body: { movieId: Number(movieId) }
  }),
  removeWishlist: (token, movieId) => request(`/api/v1/wishlist/${encodeURIComponent(movieId)}`, {
    method: 'DELETE',
    token
  }),

  // Promotions
  validatePromotion: (body) => request('/api/v1/promotions/validate', { method: 'POST', body }),
  applyPromotion: (token, bookingId, code) => request(`/api/v1/promotions/apply?bookingId=${bookingId}&code=${encodeURIComponent(code)}`, { method: 'POST', token }),
  removePromotion: (token, bookingId) => request(`/api/v1/promotions/remove?bookingId=${bookingId}`, { method: 'DELETE', token }),

  // Payment
  createVnpayPayment: (token, bookingId) => request(`/api/v1/payments/vnpay/create?bookingId=${bookingId}`, { method: 'POST', token }),
  mockPayment: (token, bookingId) => request(`/api/v1/payments/mock?bookingId=${bookingId}`, { method: 'POST', token }),
  getPaymentByBooking: (token, bookingId) => request(`/api/v1/payments/booking/${bookingId}`, { token }),

  getAdminFoodItems: (token) => request('/api/v1/admin/foods/items', { token }),
  getAdminFoodCombos: (token) => request('/api/v1/admin/foods/combos', { token }),
  createAdminFoodItem: (token, payload) => request('/api/v1/admin/foods/items', {
    method: 'POST',
    token,
    body: payload
  }),
  createAdminFoodCombo: (token, payload) => request('/api/v1/admin/foods/combos', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminFoodItem: (token, itemId, payload) => request(`/api/v1/admin/foods/items/${itemId}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminFoodCombo: (token, comboId, payload) => request(`/api/v1/admin/foods/combos/${comboId}`, {
    method: 'PUT',
    token,
    body: payload
  })
};
