import api from '../../../lib/axios';

export const productionApi = {
  getAll: (params = {}) => {
    return api.get('/production', { params });
  },

  getById: (id) => {
    return api.get(`/production/${id}`);
  },

  create: (data) => {
    return api.post('/production', data);
  },

  preview: (data) => {
    return api.post('/production/preview', data);
  },

  cancel: (id) => {
    return api.post(`/production/${id}/cancel`);
  },

  getStats: () => {
    return api.get('/production/stats');
  },
};