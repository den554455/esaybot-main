import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const clientProfileService = {
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'clientProfileService.updateProfile');
      throw error;
    }
  },
};

export default clientProfileService;
