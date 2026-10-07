import api from '../../../lib/axios';

export const rawMaterialApi = {
  getAll: (params = {}) => {
    return api.get('/raw-materials', { params });
  },

  getAllForDropdown: () => {
    return api.get('/raw-materials/all');
  },

  getById: (id) => {
    return api.get(`/raw-materials/${id}`);
  },

  create: (data) => {
    return api.post('/raw-materials', data);
  },

  update: (id, data) => {
    return api.put(`/raw-materials/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/raw-materials/${id}`);
  },

  restock: (id, data) => api.post(`/raw-materials/${id}/restock`, data),
};