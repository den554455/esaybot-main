import api from './api';
import { errorHandler } from '../utils/errorHandler';
import { getValidatedObject } from '../utils/apiValidation';

export const notificationsService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'notificationsService.getNotifications');
      throw error;
    }
  },

  markAsRead: async (ids) => {
    try {
      const response = await api.post('/notifications/read', { ids });
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'notificationsService.markAsRead');
      throw error;
    }
  },
};

export default notificationsService;
