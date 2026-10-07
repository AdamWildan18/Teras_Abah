import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor: Pastikan token SELALU dikirim
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: Handle 401 dengan rapi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Token tidak valid. Silakan login ulang.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Opsional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;