import { request } from './authService';

export const recommendationService = {
  getRecommendedMovies: (token) => request('/api/v1/recommendations/movies', { token }),
  getFavoriteActors: (token) => request('/api/v1/recommendations/favorite-actors', { token }),
  refreshPreferences: (token) => request('/api/v1/recommendations/preferences/refresh', { method: 'POST', token }),
  getMyPreferences: (token) => request('/api/v1/recommendations/preferences/me', { token }),
  trackTrailerInteraction: (token, payload) => request('/api/v1/recommendations/trailer-interactions', {
    method: 'POST',
    token,
    body: payload
  })
};
