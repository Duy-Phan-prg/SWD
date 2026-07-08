import { request, unwrapListPayload } from './authService';

export const staffService = {
  lookupStaffCheckInBooking: (token, { bookingCode, qrCode }) => {
    const params = new URLSearchParams();
    if (bookingCode) params.set('bookingCode', bookingCode);
    if (qrCode) params.set('qrCode', qrCode);
    return request(`/api/v1/staff/check-in/lookup?${params.toString()}`, { token });
  },
  getRecentStaffCheckInBookings: (token, limit = 8) =>
    request(`/api/v1/staff/check-in/recent?limit=${encodeURIComponent(limit)}`, { token }),
  getStaffShowtimeBookings: (token, showtimeId) => request(`/api/v1/staff/check-in/showtimes/${encodeURIComponent(showtimeId)}/bookings`, { token }),
  checkInStaffBooking: (token, qrCode) => request('/api/v1/staff/check-in', {
    method: 'POST',
    token,
    body: { qrCode }
  }),
  getStaffFoodItems: (token) => request('/api/v1/staff/foods/items?size=100', { token }).then(unwrapListPayload),
  getStaffFoodCombos: (token) => request('/api/v1/staff/foods/combos?size=100', { token }).then(unwrapListPayload),
  updateStaffFoodItemStatus: (token, itemId, status) => request(`/api/v1/staff/foods/items/${encodeURIComponent(itemId)}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    token
  }),
  updateStaffFoodComboStatus: (token, comboId, status) => request(`/api/v1/staff/foods/combos/${encodeURIComponent(comboId)}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    token
  }),
  getFailedBulkRefunds: (token, params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/api/v1/staff/bulk-refunds/failed?${query.toString()}`, { token });
  },
  getBulkRefundDetail: (token, bookingId) =>
    request(`/api/v1/staff/bulk-refunds/${encodeURIComponent(bookingId)}/detail`, { token }),
  confirmManualBulkRefund: (token, bookingId, payload) => request(`/api/v1/staff/bulk-refunds/${encodeURIComponent(bookingId)}/confirm`, {
    method: 'POST',
    token,
    body: payload
  })
};
