import api from './api';
import { errorHandler } from '../utils/errorHandler';
import { getValidatedObject } from '../utils/apiValidation';

export const reviewsService = {
  getReviews: async ({ masterId, limit, offset }) => {
    try {
      const response = await api.get(`/reviews?master_id=${masterId}&limit=${limit}&offset=${offset}`);
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'reviewsService.getReviews');
      throw error;
    }
  },

  // Отзывы, оставленные ТЕКУЩИМ авторизованным клиентом (backend фильтрует по JWT,
  // master_id здесь не нужен и не принимается — это отдельный от getReviews эндпоинт).
  getMyReviews: async () => {
    try {
      const response = await api.get('/reviews/my');
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'reviewsService.getMyReviews');
      throw error;
    }
  },

  createReview: async ({ appointmentId, rating, text }) => {
    try {
      const response = await api.post('/reviews', {
        appointment_id: appointmentId,
        rating,
        text: text.trim(),
      });
      return getValidatedObject(response.data);
    } catch (error) {
      errorHandler.log(error, 'reviewsService.createReview');
      throw error;
    }
  },
};

export default reviewsService;
