import api from '../../../lib/axios';

export const transactionApi = {
  /**
   * Get all transactions
   */
  getAll: (params = {}) => api.get('/transactions', { params }),

  /**
   * Get single transaction by ID
   */
  getById: (id) => api.get(`/transactions/${id}`),

  /**
   * Create new transaction (checkout)
   */
  create: (data) => api.post('/transactions', data),

  /**
   * Update transaction
   */
  update: (id, data) => api.put(`/transactions/${id}`, data),

  /**
   * Delete transaction
   */
  delete: (id) => api.delete(`/transactions/${id}`),
};