import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, clearAuthSession, getStoredAuth, hasBackendAdminAccess, normalizeUser, saveAuthSession } from '../services/authApi';
import { useUI } from './UIContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('user');
  const { showToast, setShowOTP } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const { accessToken, refreshToken, user } = getStoredAuth();
      if (user) {
        const restoredRole = hasBackendAdminAccess(accessToken, user) ? 'admin' : user.role || 'user';
        setIsLoggedIn(true);
        setCurrentUser({ ...user, role: restoredRole });
        setCurrentRole(restoredRole);
      }
      if (!accessToken && !refreshToken) return;

      try {
        let token = accessToken;
        if (!token && refreshToken) {
          const refreshed = await authApi.refresh(refreshToken);
          const refreshedUser = saveAuthSession(refreshed);
          token = refreshed.accessToken;
          setCurrentUser(refreshedUser);
          setCurrentRole(refreshedUser.role || 'user');
          setIsLoggedIn(true);
        }
        let profile;
        try {
          profile = await authApi.getMyProfile(token);
        } catch {
          const refreshed = await authApi.refresh(refreshToken);
          const refreshedUser = saveAuthSession(refreshed);
          token = refreshed.accessToken;
          setCurrentUser(refreshedUser);
          setCurrentRole(refreshedUser.role || 'user');
          profile = await authApi.getMyProfile(token);
        }
        const nextUser = normalizeUser(profile, profile.roles || user?.roles || []);
        localStorage.setItem('cinepremier_auth_user', JSON.stringify(nextUser));
        setCurrentUser(nextUser);
        setCurrentRole(nextUser.role || 'user');
        setIsLoggedIn(true);
      } catch {
        clearAuthSession();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentRole('user');
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthSession();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentRole('user');
      setShowOTP(true);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [setShowOTP]);

  const performLogout = async () => {
    const { refreshToken } = getStoredAuth();
    if (!refreshToken) {
      showToast('Không tìm thấy refresh token. Vui lòng đăng nhập lại.');
      return;
    }
    try {
      await authApi.logout(refreshToken);
      clearAuthSession();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentRole('user');
      navigate('/');
      showToast('Đăng xuất tài khoản thành công.');
    } catch (error) {
      showToast(error.message || 'Không thể kết nối BE để đăng xuất.');
    }
  };

  const handleLogout = () => {
    showToast(
      'Bạn có chắc muốn đăng xuất không?\nCinePremier sẽ nhớ bạn lắm đó...',
      10000,
      { label: 'Đăng xuất', onClick: performLogout },
      'sad'
    );
  };

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    if (userData) {
      setCurrentUser(userData);
      setCurrentRole(userData.role || 'user');
      const redirectPath = sessionStorage.getItem('cinepremier_post_login_redirect');
      sessionStorage.removeItem('cinepremier_post_login_redirect');
      navigate(userData.role === 'admin' ? '/admin/overview' : redirectPath || '/');
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn, setIsLoggedIn,
      currentUser, setCurrentUser,
      currentRole, setCurrentRole,
      handleLogout, handleLoginSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
