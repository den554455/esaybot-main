import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const portfolioService = {
  getPortfolio: async (masterId) => {
    try {
      const response = await api.get(`/master/portfolio?master_id=${masterId}`);
      return response.data?.portfolio || [];
    } catch (error) {
      errorHandler.log(error, 'portfolioService.getPortfolio');
      throw error;
    }
  },

  uploadPhoto: async ({ formData }) => {
    try {
      const response = await api.post('/master/portfolio', formData);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'portfolioService.uploadPhoto');
      throw error;
    }
  },

  deletePhoto: async (photoId) => {
    try {
      const response = await api.delete(`/master/portfolio/${photoId}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'portfolioService.deletePhoto');
      throw error;
    }
  },

  setPrimaryPhoto: async (photoId) => {
    try {
      const response = await api.post(`/master/portfolio/primary/${photoId}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'portfolioService.setPrimaryPhoto');
      throw error;
    }
  },
};

export default portfolioService;
