import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const photoSearchService = {
  searchByPhoto: async (formData) => {
    try {
      const response = await api.post('/search/by-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'photoSearchService.searchByPhoto');
      throw error;
    }
  },
};

export default photoSearchService;
