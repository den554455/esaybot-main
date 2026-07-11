import api from './api';
import { errorHandler } from '../utils/errorHandler';
import { validateAuthPayload, validateCurrentUserPayload } from '../utils/apiValidation';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const persistTokens = ({ access_token, refresh_token }) => {
  if (access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
};

export const authService = {
  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return validateCurrentUserPayload(response.data);
    } catch (error) {
      errorHandler.log(error, 'authService.getCurrentUser');
      return { success: false, error: 'Invalid user payload from server' };
    }
  },

  login: async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const validated = validateAuthPayload(response.data || {});

      if (validated.success) {
        persistTokens(validated);
        return { success: true, user: validated.user };
      }

      return { success: false, error: validated.error || 'Login failed' };
    } catch (error) {
      const message = errorHandler.getMessage(error) || 'Ошибка соединения с сервером';
      errorHandler.log(error, 'authService.login');
      return { success: false, error: message };
    }
  },

  register: async ({ email, password, first_name, last_name }) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        first_name,
        last_name,
      });
      const validated = validateAuthPayload(response.data || {});

      if (validated.success) {
        persistTokens(validated);
        return { success: true, user: validated.user };
      }

      return { success: false, error: validated.error || 'Registration failed' };
    } catch (error) {
      const message = errorHandler.getMessage(error) || 'Ошибка регистрации';
      errorHandler.log(error, 'authService.register');
      return { success: false, error: message };
    }
  },

  registerMaster: async ({ first_name, last_name, email, phone, district, password }) => {
    try {
      const response = await api.post('/auth/register-master', {
        first_name,
        last_name,
        email,
        phone,
        district,
        password,
      });
      const validated = validateAuthPayload(response.data || {});

      if (validated.success) {
        persistTokens(validated);
        return { success: true, user: validated.user };
      }

      return { success: false, error: validated.error || 'Registration failed' };
    } catch (error) {
      const message = errorHandler.getMessage(error) || 'Ошибка регистрации';
      errorHandler.log(error, 'authService.registerMaster');
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await api.post('/auth/logout', {
        refresh_token: refreshToken || undefined,
      });
    } catch (error) {
      errorHandler.log(error, 'authService.logout');
    } finally {
      authService.clearSession();
    }
  },

  loginWithToken: (access_token, refresh_token, userData) => {
    persistTokens({ access_token, refresh_token });
    return userData;
  },
};

export default authService;
