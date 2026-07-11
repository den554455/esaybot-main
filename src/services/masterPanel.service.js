import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const masterPanelService = {
  getAppointments: async () => {
    try {
      const response = await api.get('/master/appointments');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterPanelService.getAppointments');
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/master/stats');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterPanelService.getStats');
      throw error;
    }
  },

  confirmAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/master/confirm/${appointmentId}`, {});
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterPanelService.confirmAppointment');
      throw error;
    }
  },

  completeAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/master/complete/${appointmentId}`, {});
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterPanelService.completeAppointment');
      throw error;
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/master/cancel/${appointmentId}`, {});
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'masterPanelService.cancelAppointment');
      throw error;
    }
  },
};

export default masterPanelService;
