import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const masterProfileService = {
  getProfile: async () => {
    try {
      const response = await api.get('/master/profile');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterProfileService.getProfile');
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.post('/master/profile', profileData);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterProfileService.updateProfile');
      throw error;
    }
  },

  uploadAvatar: async (formData) => {
    try {
      const response = await api.post('/master/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterProfileService.uploadAvatar');
      throw error;
    }
  },
};

export default masterProfileService;
