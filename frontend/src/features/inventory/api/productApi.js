import api from '../../../lib/axios';

export const productApi = {
  getAll: (params = {}) => {
    return api.get('/products', { params });
  },

  getAllForDropdown: () => {
    return api.get('/products/all');
  },

  getById: (id) => {
    return api.get(`/products/${id}`);
  },

  create: (data) => {
    return api.post('/products', data);
  },

  update: (id, data) => {
    return api.put(`/products/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/products/${id}`);
  },
};