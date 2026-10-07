import api from '../../../lib/axios';

export const recipeApi = {
  getAll: (params = {}) => {
    return api.get('/recipes', { params });
  },

  getById: (id) => {
    return api.get(`/recipes/${id}`);
  },

  getByProductId: (productId) => {
    return api.get(`/products/${productId}/recipe`);
  },

  create: (data) => {
    return api.post('/recipes', data);
  },

  update: (id, data) => {
    return api.put(`/recipes/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/recipes/${id}`);
  },
};