const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const STORAGE_KEYS = {
  accessToken: 'cinepremier_access_token',
  refreshToken: 'cinepremier_refresh_token',
  user: 'cinepremier_auth_user',
  roles: 'cinepremier_auth_roles'
};

const ADMIN_ACCESS_OVERRIDE = true;

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

const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

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
    bannerUrl: movie.bannerUrl || movie.backdropUrl || movie.coverUrl || movie.bannerImageUrl || fallback.bannerUrl || movie.posterUrl || fallback.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
    releaseDate: movie.releaseDate || movie.premiereDate || movie.startDate || fallback.releaseDate || 'Đang cập nhật',
    trailerUrl: movie.trailerUrl || movie.trailer || fallback.trailerUrl || '',
    director: movie.director || movie.directorName || fallback.director || 'Đang cập nhật',
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
  deleteAdminMovie: (token, movieId) => request(`/api/v1/admin/movies/${encodeURIComponent(movieId)}`, {
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
  getAdminGenres: (token) => request('/api/v1/admin/genres', { token }),
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
