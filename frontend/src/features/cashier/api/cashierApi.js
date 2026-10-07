import api from '../../../lib/axios';

export const cashierApi = {
  getTransactions: (params = {}) => api.get('/transactions', { params }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  createTransaction: (data) => api.post('/transactions', data),
};