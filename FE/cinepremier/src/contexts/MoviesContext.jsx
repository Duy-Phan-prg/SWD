import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi, getStoredAuth } from '../services/authApi';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

const MoviesContext = createContext(null);

const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;
const moviesContextCache = {
  publicCinema: null,
  genres: null,
  moviePages: new Map(),
  foodCatalog: null,
};

const getFreshCache = (entry) => {
  if (!entry) return null;
  return Date.now() - entry.updatedAt < PUBLIC_CACHE_TTL_MS ? entry.data : null;
};

const toCacheEntry = (data) => ({ data, updatedAt: Date.now() });

export function MoviesProvider({ children }) {
  const [moviesList, setMoviesList] = useState([]);
  const [moviePagination, setMoviePagination] = useState({
    page: 0, size: 8,
    totalPages: 1,
    totalElements: 0,
  });
  const [isMoviesLoading, setIsMoviesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movieDateFilter, setMovieDateFilter] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [publicCinema, setPublicCinema] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [foodCatalog, setFoodCatalog] = useState([]);

  const { showToast } = useUI();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const isExplorePage = location.pathname === '/movies';
  const moviesListRef = useRef(moviesList);

  useEffect(() => {
    moviesListRef.current = moviesList;
  }, [moviesList]);

  const fetchPublicCinema = async ({ force = false } = {}) => {
    const cachedCinema = force ? null : getFreshCache(moviesContextCache.publicCinema);
    if (cachedCinema) {
      setPublicCinema(cachedCinema);
      return cachedCinema;
    }

    try {
      const cinema = await authApi.getPublicCinema();
      moviesContextCache.publicCinema = toCacheEntry(cinema);
      setPublicCinema(cinema);
      return cinema;
    } catch {
      setPublicCinema(null);
      return null;
    }
  };

  useEffect(() => {
    fetchPublicCinema();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchGenres = async () => {
      const cachedGenres = getFreshCache(moviesContextCache.genres);
      if (cachedGenres) {
        if (!cancelled) setGenres(cachedGenres);
        return;
      }

      try {
        const data = await authApi.getGenres();
        const nextGenres = Array.isArray(data) ? data : [];
        moviesContextCache.genres = toCacheEntry(nextGenres);
        if (!cancelled) setGenres(nextGenres);
      } catch {
        if (!cancelled) setGenres([]);
      }
    };

    fetchGenres();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      const moviePageParams = {
        keyword: isExplorePage ? searchQuery.trim() : '',
        genreId: isExplorePage ? selectedGenreId : '',
        fromDate: isExplorePage ? movieDateFilter : '',
        toDate: isExplorePage ? movieDateFilter : '',
        page: moviePagination.page,
        size: moviePagination.size,
      };
      const moviePageKey = JSON.stringify(moviePageParams);
      const applyMoviePage = (pageData) => {
        const visibleMovies = pageData.items.filter(m => m.status !== 'INACTIVE' && !m.isInactive);
        setMoviesList((previousMovies) => visibleMovies.map((movie) => {
          const existing = previousMovies.find((item) => (
            String(item.backendId || item.id) === String(movie.backendId || movie.id)
          ));
          if (!existing) return movie;

          const hasActors = Array.isArray(movie.actors) && movie.actors.length > 0;
          const hasActorIds = Array.isArray(movie.actorIds) && movie.actorIds.length > 0;
          const hasMainActorIds = Array.isArray(movie.mainActorIds) && movie.mainActorIds.length > 0;
          const hasDetailText = movie.raw?.description || movie.raw?.synopsis || movie.raw?.overview || movie.raw?.content;
          const hasDirector = movie.raw?.director || movie.raw?.directorName;
          const hasTrailer = movie.raw?.trailerUrl
            || movie.raw?.trailerURL
            || movie.raw?.trailer_url
            || movie.raw?.trailer
            || movie.raw?.videoUrl
            || movie.raw?.videoURL
            || movie.raw?.video_url;

          return {
            ...existing,
            ...movie,
            synopsis: hasDetailText ? movie.synopsis : existing.synopsis,
            director: hasDirector ? movie.director : existing.director,
            trailerUrl: hasTrailer ? movie.trailerUrl : existing.trailerUrl,
            actors: hasActors ? movie.actors : existing.actors,
            actorIds: hasActorIds ? movie.actorIds : existing.actorIds,
            mainActorIds: hasMainActorIds ? movie.mainActorIds : existing.mainActorIds,
            mainActors: movie.mainActors || existing.mainActors,
            castList: movie.castList || existing.castList,
          };
        }));
        setMoviePagination(prev => ({
          ...prev,
          page: pageData.page,
          size: pageData.size,
          totalPages: pageData.totalPages,
          totalElements: pageData.totalElements,
        }));
      };
      const cachedMoviePage = getFreshCache(moviesContextCache.moviePages.get(moviePageKey));
      if (cachedMoviePage) {
        if (!cancelled) applyMoviePage(cachedMoviePage);
        return;
      }

      setIsMoviesLoading(true);
      try {
        const pageData = await authApi.searchMoviesPage(moviePageParams);
        if (!cancelled) {
          moviesContextCache.moviePages.set(moviePageKey, toCacheEntry(pageData));
          applyMoviePage(pageData);
        }
      } catch (error) {
        if (!cancelled) showToast(error.message || 'Không thể tải danh sách phim.', 5000, null, 'sad');
      } finally {
        if (!cancelled) setIsMoviesLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [isExplorePage, searchQuery, selectedGenreId, movieDateFilter, moviePagination.page, moviePagination.size]);

  const normalizeWishlistMovies = (items = []) => items.map((item) => {
    const match = moviesListRef.current.find((movie) => String(movie.backendId || movie.id) === String(item.backendId || item.id));
    return match ? { ...match, ...item, backendId: match.backendId || item.backendId || item.id } : item;
  });

  const fetchWishlist = async () => {
    const { accessToken } = getStoredAuth();
    if (!isLoggedIn || !accessToken) {
      setWatchlist([]);
      return;
    }
    try {
      const items = await authApi.getWishlist(accessToken);
      setWatchlist(normalizeWishlistMovies(items));
    } catch {
      setWatchlist([]);
    }
  };

  const normalizeFoodCatalog = (items = [], combos = []) => [
    ...combos.map(item => ({ ...item, id: `combo-${item.id}`, backendId: item.id, foodComboId: item.id, category: 'combo' })),
    ...items.map(item => ({ ...item, id: `item-${item.id}`, backendId: item.id, foodItemId: item.id, category: 'item' })),
  ];

  const fetchPublicFoodCatalog = async ({ force = false } = {}) => {
    const cachedFoodCatalog = force ? null : getFreshCache(moviesContextCache.foodCatalog);
    if (cachedFoodCatalog) {
      setFoodCatalog(cachedFoodCatalog);
      return cachedFoodCatalog;
    }

    try {
      const [items, combos] = await Promise.all([authApi.getFoodItems(), authApi.getFoodCombos()]);
      const catalog = normalizeFoodCatalog(items || [], combos || []);
      moviesContextCache.foodCatalog = toCacheEntry(catalog);
      setFoodCatalog(catalog);
      return catalog;
    } catch {
      setFoodCatalog([]);
      return [];
    }
  };

  useEffect(() => {
    if (!isLoggedIn) setFoodCatalog([]);
  }, [isLoggedIn]);

  useEffect(() => {
    fetchWishlist();
  }, [isLoggedIn]);

  const handleToggleWatchlist = async (movie) => {
    const backendMovieId = movie.backendId || movie.movieId || movie.id;
    const { accessToken } = getStoredAuth();
    if (!isLoggedIn || !accessToken) {
      showToast('Vui lòng đăng nhập để đồng bộ watchlist với hệ thống.', 4500, null, 'sad');
      return;
    }
    if (isNaN(Number(backendMovieId))) {
      showToast('Phim mẫu chưa có mã backend nên chưa thể lưu watchlist.', 4500, null, 'sad');
      return;
    }

    const exists = watchlist.some(m => String(m.backendId || m.id) === String(backendMovieId));
    const previous = watchlist;
    setWatchlist(prev => exists
      ? prev.filter(m => String(m.backendId || m.id) !== String(backendMovieId))
      : [...prev, { ...movie, backendId: Number(backendMovieId) }]
    );

    try {
      if (exists) {
        await authApi.removeWishlist(accessToken, backendMovieId);
        showToast('Đã xóa phim khỏi watchlist.');
      } else {
        await authApi.addWishlist(accessToken, backendMovieId);
        showToast('Đã thêm phim vào watchlist.');
      }
    } catch (error) {
      setWatchlist(previous);
      showToast(error.message || 'Không thể đồng bộ watchlist với backend.', 4500, null, 'sad');
    }
  };

  return (
    <MoviesContext.Provider value={{
      moviesList, setMoviesList,
      moviePagination, setMoviePagination,
      isMoviesLoading,
      searchQuery, setSearchQuery,
      movieDateFilter, setMovieDateFilter,
      genres, selectedGenreId, setSelectedGenreId,
      publicCinema,
      fetchPublicCinema,
      watchlist, handleToggleWatchlist, fetchWishlist,
      bookedTickets, setBookedTickets,
      foodCatalog, fetchPublicFoodCatalog,
    }}>
      {children}
    </MoviesContext.Provider>
  );
}

export const useMovies = () => useContext(MoviesContext);
