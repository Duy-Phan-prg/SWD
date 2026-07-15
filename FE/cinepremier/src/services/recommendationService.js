import { request, unwrapListPayload } from './authService';
import { normalizeMovie } from './movieService';

const getRecommendationMovie = (item = {}) => item.movie || item.movieInfo || item.film || item;

const normalizeRecommendation = (item = {}) => {
  const source = getRecommendationMovie(item);
  const movieId = item.movieId ?? item.movie_id ?? source.id ?? source.movieId;
  const posterUrl = item.posterUrl
    || item.poster_url
    || item.moviePosterUrl
    || item.imageUrl
    || source.posterUrl
    || source.poster_url
    || source.moviePosterUrl
    || source.imageUrl
    || source.thumbnailUrl;

  return {
    ...normalizeMovie({
      ...source,
      id: movieId,
      movieId,
      title: item.title || source.title || source.name,
      posterUrl
    }, {
      id: movieId,
      backendId: movieId,
      posterUrl
    }),
    similarity: typeof item.similarity === 'number' ? item.similarity : null
  };
};

export const normalizeRecommendationResponse = (payload) =>
  unwrapListPayload(payload).map(normalizeRecommendation);

export const recommendationService = {
  // Content-based: "similar movies" — public endpoint
  getContentRecommendations: (movieId) =>
    request(`/api/v1/recommendation/content/${encodeURIComponent(movieId)}`)
      .then(normalizeRecommendationResponse),
  // Collaborative: "recommended for you" — requires auth token
  getCollaborativeRecommendations: (userId, token) =>
    request(`/api/v1/recommendation/collaborative/${encodeURIComponent(userId)}`, { token })
      .then(normalizeRecommendationResponse)
};
