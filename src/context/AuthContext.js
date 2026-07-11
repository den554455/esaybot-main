import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import useSafeAsync from '../hooks/useSafeAsync';

// AuthContext использует единственный axios instance из api.js.
// Это устраняет гонку двух refresh-interceptors, которая вызывала
// периодические 401 и разлогинивание пользователей.

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { runIfMounted } = useSafeAsync();

  // ── Вспомогательная: очистка сессии без запроса на сервер ─────────
  const _clearSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
  };

  // ── Загрузка пользователя при старте ─────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      await new Promise(r => setTimeout(r, 100));
      const token = localStorage.getItem('access_token');
      if (!token) {
        runIfMounted(() => setLoading(false));
        return;
      }
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          runIfMounted(() => setUser(response.user));
        } else {
          runIfMounted(() => _clearSession());
        }
      } catch {
        runIfMounted(() => _clearSession());
      } finally {
        runIfMounted(() => setLoading(false));
      }
    };
    loadUser();
    // cleanup handled by useSafeAsync
  }, []);

  // ── login ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await authService.login({ email, password });
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      setError(result.error);
      return { success: false, error: result.error };
    } catch (err) {
      const msg = err?.message || 'Ошибка соединения с сервером';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── loginWithToken (для VK, Telegram и т.д.) ──────────────────────
  const loginWithToken = (access_token, refresh_token, userData) => {
    authService.loginWithToken(access_token, refresh_token, userData);
    setUser(userData);
  };

  // ── register ──────────────────────────────────────────────────────
  const register = async (email, password, first_name, last_name) => {
    try {
      setError(null);
      const result = await authService.register({ email, password, first_name, last_name });
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      setError(result.error);
      return { success: false, error: result.error };
    } catch (err) {
      const msg = err?.message || 'Ошибка регистрации';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── register master ───────────────────────────────────────────────
  const registerMaster = async (first_name, last_name, email, phone, district, password) => {
    try {
      setError(null);
      const result = await authService.registerMaster({
        first_name,
        last_name,
        email,
        phone,
        district,
        password,
      });
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      setError(result.error);
      return { success: false, error: result.error };
    } catch (err) {
      const msg = err?.message || 'Ошибка регистрации';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── logout ────────────────────────────────────────────────────────
  const logout = async () => {
    setError(null);
    try {
      await authService.logout();
    } catch {
      // Игнорируем ошибки сервера — всё равно чистим локально
    } finally {
      _clearSession();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWithToken,
    register,
    registerMaster,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
