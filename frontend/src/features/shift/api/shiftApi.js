import api from '../../../lib/axios';

export const shiftApi = {
  // Shift Master
  getShifts: () => api.get('/shifts'),
  createShift: (data) => api.post('/shifts', data),
  updateShift: (id, data) => api.put(`/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/shifts/${id}`),

  // Shift Users (Harian)
  getShiftUsers: (params = {}) => api.get('/shift-users', { params }),
  createShiftUser: (data) => api.post('/shift-users', data),
  clockIn: (id) => api.post(`/shift-users/${id}/clock-in`),
  clockOut: (id, data) => api.post(`/shift-users/${id}/clock-out`, data),
  getStats: (params = {}) => api.get('/shift-users/stats', { params }),
};

export const userApi = {
  getAll: () => api.get('/users'),
};