import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const settingsService = {
  getSettings: async () => {
    try {
      const response = await api.get('/user/settings');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'settingsService.getSettings');
      throw error;
    }
  },

  saveSettings: async (settings) => {
    try {
      const response = await api.post('/user/settings', settings);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'settingsService.saveSettings');
      throw error;
    }
  },

  changePassword: async ({ current, new: newPassword }) => {
    try {
      const response = await api.post('/user/change-password', {
        current,
        new: newPassword,
      });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'settingsService.changePassword');
      throw error;
    }
  },

  unlinkVk: async () => {
    try {
      const response = await api.post('/auth/vk/unlink');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'settingsService.unlinkVk');
      throw error;
    }
  },
};

export default settingsService;
