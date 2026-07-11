import api from './api';
import { errorHandler } from '../utils/errorHandler';
import { getValidatedArray } from '../utils/apiValidation';

export const mastersService = {
  getServices: async () => {
    try {
      const response = await api.get('/services');
      return getValidatedArray(response.data, 'services');
    } catch (error) {
      errorHandler.log(error, 'mastersService.getServices');
      throw error;
    }
  },

  getMasters: async () => {
    try {
      const response = await api.get('/masters');
      return getValidatedArray(response.data, 'masters');
    } catch (error) {
      errorHandler.log(error, 'mastersService.getMasters');
      throw error;
    }
  },

  getSlots: async (masterId, date) => {
    try {
      const response = await api.get('/slots', { params: { master_id: masterId, date } });
      return getValidatedArray(response.data, 'slots');
    } catch (error) {
      errorHandler.log(error, 'mastersService.getSlots');
      throw error;
    }
  },

  getFavorites: async () => {
    try {
      const response = await api.get('/favorites');
      return getValidatedArray(response.data, 'favorites');
    } catch (error) {
      errorHandler.log(error, 'mastersService.getFavorites');
      throw error;
    }
  },

  toggleFavorite: async (masterId) => {
    try {
      await api.post(`/favorites/${masterId}`);
      return true;
    } catch (error) {
      errorHandler.log(error, 'mastersService.toggleFavorite');
      throw error;
    }
  },

  removeFavorite: async (masterId) => {
    try {
      await api.delete(`/favorites/${masterId}`);
      return true;
    } catch (error) {
      errorHandler.log(error, 'mastersService.removeFavorite');
      throw error;
    }
  },
};

export default mastersService;
