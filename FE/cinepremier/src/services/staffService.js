import { request } from './authService';

// Staff check-in, tra cứu booking và danh sách theo suất đã có ở BE.
// Riêng staff foods (BE be/new chưa có) vẫn vô hiệu hoá an toàn.
export const staffService = {
  lookupStaffCheckInBooking: (token, { bookingCode, qrCode }) => {
    const params = new URLSearchParams();
    if (bookingCode) params.set('bookingCode', bookingCode);
    if (qrCode) params.set('qrCode', qrCode);
    return request(`/api/v1/staff/check-in/lookup?${params.toString()}`, { token });
  },
  getStaffShowtimeBookings: (token, showtimeId) => request(`/api/v1/staff/check-in/showtimes/${encodeURIComponent(showtimeId)}/bookings`, { token }),
  checkInStaffBooking: (token, qrCode) => request('/api/v1/staff/check-in', {
    method: 'POST',
    token,
    body: { qrCode }
  }),
  getStaffFoodItems: () => Promise.resolve([]),
  getStaffFoodCombos: () => Promise.resolve([]),
  updateStaffFoodItemStatus: () => Promise.reject(new Error('Quản lý đồ ăn cho staff chưa được hỗ trợ ở backend')),
  updateStaffFoodComboStatus: () => Promise.reject(new Error('Quản lý đồ ăn cho staff chưa được hỗ trợ ở backend'))
};
