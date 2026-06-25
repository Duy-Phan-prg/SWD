import { request } from './authService';

export const paymentService = {
  validatePromotion: (body) => request('/api/v1/promotions/validate', { method: 'POST', body }),
  applyPromotion: (token, bookingId, code) => request(`/api/v1/promotions/apply?bookingId=${bookingId}&code=${encodeURIComponent(code)}`, { method: 'POST', token }),
  removePromotion: (token, bookingId) => request(`/api/v1/promotions/remove?bookingId=${bookingId}`, { method: 'DELETE', token }),
  createVnpayPayment: (token, bookingId) => request(`/api/v1/payments/vnpay/create?bookingId=${bookingId}`, { method: 'POST', token }),
  mockPayment: (token, bookingId) => request(`/api/v1/payments/mock?bookingId=${bookingId}`, { method: 'POST', token }),
  getPaymentByBooking: (token, bookingId) => request(`/api/v1/payments/booking/${bookingId}`, { token })
};
