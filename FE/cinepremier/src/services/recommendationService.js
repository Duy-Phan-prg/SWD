import { request, unwrapListPayload } from './authService';
import { normalizeMovie } from './movieService';

const normalizeRecommendation = (item = {}) => ({
  ...normalizeMovie({
    id: item.movieId,
    movieId: item.movieId,
    title: item.title,
    posterUrl: item.posterUrl
  }, {
    id: item.movieId,
    backendId: item.movieId,
    posterUrl: item.posterUrl
  }),
  similarity: typeof item.similarity === 'number' ? item.similarity : null
});

export const normalizeRecommendationResponse = (payload) =>
  unwrapListPayload(payload).map(normalizeRecommendation);

export const recommendationService = {
  // Content-based: "similar movies" — public endpoint
  getContentRecommendations: (movieId) =>
    request(`/api/recommendation/content/${encodeURIComponent(movieId)}`)
      .then(normalizeRecommendationResponse),
  // Collaborative: "recommended for you" — requires auth token
  getCollaborativeRecommendations: (userId, token) =>
    request(`/api/recommendation/collaborative/${encodeURIComponent(userId)}`, { token })
      .then(normalizeRecommendationResponse)
};
