import api from './api';
import { errorHandler } from '../utils/errorHandler';
import { getValidatedArray, getValidatedObject, getValidatedAppointment } from '../utils/apiValidation';

export const bookingService = {
  getSlots: async (masterId, date) => {
    try {
      const response = await api.get('/slots', { params: { master_id: masterId, date } });
      return getValidatedArray(response.data, 'slots');
    } catch (error) {
      errorHandler.log(error, 'bookingService.getSlots');
      throw error;
    }
  },

  bookAppointment: async ({ masterId, serviceId, date, time, price, comment = '' }) => {
    try {
      const response = await api.post('/book', {
        masterId,
        serviceId,
        date,
        time,
        price,
        comment,
      });
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'bookingService.bookAppointment');
      throw error;
    }
  },

  getAppointments: async () => {
    try {
      const response = await api.get('/appointments');
      return getValidatedArray(response.data, 'appointments');
    } catch (error) {
      errorHandler.log(error, 'bookingService.getAppointments');
      throw error;
    }
  },

  cancelAppointment: async (id) => {
    try {
      const response = await api.post('/cancel', { appointmentId: id });
      return getValidatedAppointment(response.data);
    } catch (error) {
      errorHandler.log(error, 'bookingService.cancelAppointment');
      throw error;
    }
  },
};

export default bookingService;
