import api from '../../../lib/axios';

export const settingsApi = {
  /**
   * Get all settings grouped
   */
  getAll: async () => {
    const response = await api.get('/settings');
    console.log('📦 Raw API Response (getAll):', response.data);
    return response.data;
  },

  /**
   * Update settings
   */
  update: (data) => {
    console.log('💾 Sending settings to API:', data);
    return api.post('/settings', data);
  },

  /**
   * Upload file (logo/favicon)
   */
  upload: (formData) => api.post('/settings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  /**
   * Get public settings (untuk frontend - tanpa auth)
   */
  getPublic: async () => {
    const response = await api.get('/settings/public');
    console.log(' Raw API Response (getPublic):', response.data);
    return response.data;
  },
};