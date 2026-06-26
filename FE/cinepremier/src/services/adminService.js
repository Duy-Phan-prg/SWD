import { buildQueryString, request } from './authService';
import { normalizeMovie, normalizeMovieListResponse, normalizeMoviePageResponse } from './movieService';

const uploadAdminFile = (token, file, folder, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  return request(endpoint, {
    method: 'POST',
    token,
    body: formData
  });
};

export const adminService = {
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

  getAdminActors: (token, params = {}) => request(`/api/v1/admin/actors${buildQueryString(params)}`, { token }),
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
  uploadAdminImage: (token, file, folder = 'images') => uploadAdminFile(token, file, folder, '/api/v1/admin/uploads/images'),
  uploadAdminVideo: (token, file, folder = 'videos') => uploadAdminFile(token, file, folder, '/api/v1/admin/uploads/videos'),

  getAdminUsers: (token) => request('/api/v1/admin/users', { token }),
  getAdminUserDetail: (token, userId) => request(`/api/v1/admin/users/${encodeURIComponent(userId)}`, { token }),
  createAdminStaff: (token, payload) => request('/api/v1/admin/users/staff', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminUserStatus: (token, userId, status) => request(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    token,
    body: { status }
  }),
  getAdminStaffProfiles: (token, params = {}) => request(`/api/v1/admin/staff-profiles${buildQueryString(params)}`, { token }),
  createAdminStaffProfile: (token, payload) => request('/api/v1/admin/staff-profiles', {
    method: 'POST',
    token,
    body: payload
  }),
  updateAdminStaffProfile: (token, profileId, payload) => request(`/api/v1/admin/staff-profiles/${encodeURIComponent(profileId)}`, {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminStaffProfileStatus: (token, profileId, status) => request(`/api/v1/admin/staff-profiles/${encodeURIComponent(profileId)}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    token
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

  getAdminCinema: (token) => request('/api/v1/admin/cinema', { token }),
  updateAdminCinema: (token, payload) => request('/api/v1/admin/cinema', {
    method: 'PUT',
    token,
    body: payload
  }),
  updateAdminCinemaStatus: (token, status) => request(`/api/v1/admin/cinema/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
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

  getAdminShowtimes: (token, params = {}) => request(`/api/v1/admin/showtimes${buildQueryString(params)}`, { token }),
  getAdminShowtime: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}`, { token }),
  getAdminShowtimeSeatMap: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}/seat-map`, { token }),
  createAdminShowtime: (token, payload) => request('/api/v1/admin/showtimes', { method: 'POST', token, body: payload }),
  createAdminShowtimesBulk: (token, payload) => request('/api/v1/admin/showtimes/bulk', { method: 'POST', token, body: payload }),
  updateAdminShowtime: (token, showtimeId, payload) => request(`/api/v1/admin/showtimes/${showtimeId}`, { method: 'PUT', token, body: payload }),
  updateAdminShowtimeStatus: (token, showtimeId, status) => request(`/api/v1/admin/showtimes/${showtimeId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH', token }),
  deleteAdminShowtime: (token, showtimeId) => request(`/api/v1/admin/showtimes/${showtimeId}`, { method: 'DELETE', token }),

  getAdminTicketPricingRules: (token, params = {}) => request(`/api/v1/admin/ticket-pricing/rules${buildQueryString(params)}`, { token }),
  createAdminTicketPricingRule: (token, payload) => request('/api/v1/admin/ticket-pricing/rules', { method: 'POST', token, body: payload }),
  updateAdminTicketPricingRule: (token, ruleId, payload) => request(`/api/v1/admin/ticket-pricing/rules/${encodeURIComponent(ruleId)}`, { method: 'PUT', token, body: payload }),
  deleteAdminTicketPricingRule: (token, ruleId) => request(`/api/v1/admin/ticket-pricing/rules/${encodeURIComponent(ruleId)}`, { method: 'DELETE', token }),
  getAdminTicketCombos: (token, params = {}) => request(`/api/v1/admin/ticket-pricing/combos${buildQueryString(params)}`, { token }),
  createAdminTicketCombo: (token, payload) => request('/api/v1/admin/ticket-pricing/combos', { method: 'POST', token, body: payload }),
  updateAdminTicketCombo: (token, comboId, payload) => request(`/api/v1/admin/ticket-pricing/combos/${encodeURIComponent(comboId)}`, { method: 'PUT', token, body: payload }),
  deleteAdminTicketCombo: (token, comboId) => request(`/api/v1/admin/ticket-pricing/combos/${encodeURIComponent(comboId)}`, { method: 'DELETE', token }),

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
  }),

  // Reports
  getRevenueReport: (token, params = {}) => request(`/api/v1/admin/reports/revenue${buildQueryString(params)}`, { token }),
  getTopMovies: (token, params = {}) => request(`/api/v1/admin/reports/top-movies${buildQueryString(params)}`, { token }),
  getRoomOccupancy: (token, params = {}) => request(`/api/v1/admin/reports/occupancy${buildQueryString(params)}`, { token }),

  // Bookings / giao dịch
  getAdminBookings: (token, params = {}) => request(`/api/v1/admin/bookings${buildQueryString(params)}`, { token }),
  getAdminBooking: (token, bookingId) => request(`/api/v1/admin/bookings/${encodeURIComponent(bookingId)}`, { token }),
  markBookingRefunded: (token, bookingId) => request(`/api/v1/admin/bookings/${encodeURIComponent(bookingId)}/mark-refunded`, {
    method: 'POST',
    token
  }),
  requestBookingRefund: (token, bookingId, reason) => request(`/api/v1/admin/bookings/${encodeURIComponent(bookingId)}/refund-request`, {
    method: 'POST',
    token,
    body: { reason }
  })
};
