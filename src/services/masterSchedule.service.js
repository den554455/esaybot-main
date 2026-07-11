import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const masterScheduleService = {
  getSchedule: async () => {
    try {
      const response = await api.get('/master/schedule');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterScheduleService.getSchedule');
      throw error;
    }
  },

  getExceptions: async () => {
    try {
      const response = await api.get('/master/exceptions');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterScheduleService.getExceptions');
      throw error;
    }
  },

  saveSchedule: async (schedule) => {
    try {
      const response = await api.post('/master/schedule', { schedule });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterScheduleService.saveSchedule');
      throw error;
    }
  },

  addException: async (exceptionData) => {
    try {
      const response = await api.post('/master/exceptions', exceptionData);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterScheduleService.addException');
      throw error;
    }
  },

  removeException: async (date) => {
    try {
      const response = await api.delete(`/master/exceptions/${date}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterScheduleService.removeException');
      throw error;
    }
  },
};

export default masterScheduleService;
