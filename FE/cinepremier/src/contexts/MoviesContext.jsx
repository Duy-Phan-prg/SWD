import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { movies, cinemaLocations } from '../services/cinemaData';
import { authApi } from '../services/authApi';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';

const MoviesContext = createContext(null);

export function MoviesProvider({ children }) {
  const [moviesList, setMoviesList] = useState(movies);
  const [moviePagination, setMoviePagination] = useState({
    page: 0, size: 8,
    totalPages: Math.max(1, Math.ceil(movies.length / 8)),
    totalElements: movies.length,
  });
  const [isMoviesLoading, setIsMoviesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movieDateFilter, setMovieDateFilter] = useState('');
  const [selectedCity, setSelectedCity] = useState(cinemaLocations[0]);
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

  useEffect(() => {
    if (moviesList.length >= 3) {
      setWatchlist([moviesList[0], moviesList[2]]);
    }
  }, [moviesList.length]);

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

  const handleToggleWatchlist = (movie) => {
    setWatchlist(prev =>
      prev.find(m => m.id === movie.id) ? prev.filter(m => m.id !== movie.id) : [...prev, movie]
    );
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
      watchlist, handleToggleWatchlist,
      bookedTickets, setBookedTickets,
      foodCatalog, fetchPublicFoodCatalog,
      homepageVideoUrl, handleHomepageVideoUrlChange,
    }}>
      {children}
    </MoviesContext.Provider>
  );
}

export const useMovies = () => useContext(MoviesContext);
