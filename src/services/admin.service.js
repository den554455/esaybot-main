import api from './api';
import { errorHandler } from '../utils/errorHandler';

export const adminService = {
  getMasters: async () => {
    try {
      const response = await api.get('/admin/masters');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.getMasters');
      throw error;
    }
  },

  createMaster: async (payload) => {
    try {
      const response = await api.post('/admin/masters', payload);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.createMaster');
      throw error;
    }
  },

  deleteMaster: async (masterId) => {
    try {
      const response = await api.delete(`/admin/masters/${masterId}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.deleteMaster');
      throw error;
    }
  },

  getReviews: async (status) => {
    try {
      const response = await api.get(`/admin/reviews?status=${status}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.getReviews');
      throw error;
    }
  },

  updateReviewStatus: async (reviewId, status) => {
    try {
      const response = await api.post(`/admin/reviews/${reviewId}`, { status });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.updateReviewStatus');
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/admin/reviews/${reviewId}`);
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.deleteReview');
      throw error;
    }
  },

  getFeedback: async () => {
    try {
      const response = await api.get('/admin/feedback');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.getFeedback');
      throw error;
    }
  },

  markFeedbackResponded: async (feedbackId) => {
    try {
      const response = await api.post(`/admin/feedback/${feedbackId}`, { status: 'responded' });
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.markFeedbackResponded');
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data || {};
    } catch (error) {
      errorHandler.log(error, 'adminService.getStats');
      throw error;
    }
  },
};

export default adminService;
