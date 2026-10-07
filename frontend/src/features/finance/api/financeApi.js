import api from '../../../lib/axios';

export const financeApi = {
  getRecords: (params = {}) => api.get('/finance/records', { params }),
  getSummary: (params = {}) => api.get('/finance/summary', { params }),
  getCategories: () => api.get('/finance/categories'),
};