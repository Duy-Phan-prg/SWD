import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi, getStoredAuth } from '../services/authApi';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

const MoviesContext = createContext(null);

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
  const [selectedCity, setSelectedCity] = useState('');
  const [publicCinema, setPublicCinema] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [foodCatalog, setFoodCatalog] = useState([]);
  const [homepageVideoUrl, setHomepageVideoUrl] = useState(
    () => localStorage.getItem('cinepremier_homepage_video_url') || 'https://www.youtube.com/watch?v=k8m0SaGQ_1c'
  );

  const { showToast } = useUI();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const isExplorePage = location.pathname === '/movies';
  const liveCinemaLocations = publicCinema
    ? [`${publicCinema.name} (${[publicCinema.address, publicCinema.city].filter(Boolean).join(', ')})`]
    : [];

  const fetchPublicCinema = async () => {
    try {
      const cinema = await authApi.getPublicCinema();
      const locationLabel = `${cinema.name} (${[cinema.address, cinema.city].filter(Boolean).join(', ')})`;
      setPublicCinema(cinema);
      setSelectedCity(locationLabel);
      return cinema;
    } catch {
      setPublicCinema(null);
      setSelectedCity('');
      return null;
    }
  };

  useEffect(() => {
    fetchPublicCinema();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsMoviesLoading(true);
      try {
        const pageData = await authApi.searchMoviesPage({
          keyword: isExplorePage ? searchQuery.trim() : '',
          fromDate: isExplorePage ? movieDateFilter : '',
          toDate: isExplorePage ? movieDateFilter : '',
          page: moviePagination.page,
          size: moviePagination.size,
        });
        if (!cancelled) {
          const visibleMovies = pageData.items.filter(m => m.status !== 'INACTIVE' && !m.isInactive);
          setMoviesList(visibleMovies);
          setMoviePagination(prev => ({
            ...prev,
            page: pageData.page,
            size: pageData.size,
            totalPages: pageData.totalPages,
            totalElements: pageData.totalElements,
          }));
        }
      } catch (error) {
        if (!cancelled) showToast(error.message || 'Không thể tải danh sách phim.', 5000, null, 'sad');
      } finally {
        if (!cancelled) setIsMoviesLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [isExplorePage, searchQuery, movieDateFilter, moviePagination.page, moviePagination.size]);

  const normalizeWishlistMovies = (items = []) => items.map((item) => {
    const match = moviesList.find((movie) => String(movie.backendId || movie.id) === String(item.backendId || item.id));
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

  const fetchPublicFoodCatalog = async () => {
    try {
      const [items, combos] = await Promise.all([authApi.getFoodItems(), authApi.getFoodCombos()]);
      setFoodCatalog(normalizeFoodCatalog(items || [], combos || []));
    } catch {
      setFoodCatalog([]);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) { setFoodCatalog([]); return; }
    fetchPublicFoodCatalog();
  }, [isLoggedIn]);

  useEffect(() => {
    fetchWishlist();
  }, [isLoggedIn, moviesList.length]);

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

  const handleHomepageVideoUrlChange = (url) => {
    setHomepageVideoUrl(url);
    localStorage.setItem('cinepremier_homepage_video_url', url);
    showToast('Đã cập nhật video nền trang chủ.');
  };

  return (
    <MoviesContext.Provider value={{
      moviesList, setMoviesList,
      moviePagination, setMoviePagination,
      isMoviesLoading,
      searchQuery, setSearchQuery,
      movieDateFilter, setMovieDateFilter,
      selectedCity, setSelectedCity,
      publicCinema,
      cinemaLocations: liveCinemaLocations,
      fetchPublicCinema,
      watchlist, handleToggleWatchlist, fetchWishlist,
      bookedTickets, setBookedTickets,
      foodCatalog, fetchPublicFoodCatalog,
      homepageVideoUrl, handleHomepageVideoUrlChange,
    }}>
      {children}
    </MoviesContext.Provider>
  );
}

export const useMovies = () => useContext(MoviesContext);
