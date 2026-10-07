import { create } from 'zustand';
import api from '../lib/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  role: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initializeAuth: () => {
    // Guard: hanya jalankan sekali
    if (get().isInitialized) return;
    
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        const parsedUser = JSON.parse(user);
        set({
          token,
          user: parsedUser,
          role: parsedUser.role || null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Auth restored:', parsedUser.email, '| Role:', parsedUser.role);
      } else {
        // ✅ TETAP set isInitialized = true meski tidak ada data
        set({ isInitialized: true });
        console.log('️ No auth data found, isInitialized set to true');
      }
    } catch (error) {
      console.error('Failed to restore auth:', error);
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({
        token,
        user,
        role: user.role || null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      
      console.log('✅ Login successful:', user.email, '| Role:', user.role);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login gagal';
      set({ isLoading: false, error: errorMessage });
      console.error('❌ Login failed:', errorMessage);
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      set({
        user: null,
        token: null,
        role: null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      
      console.log('✅ Logout successful');
    }
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser, role: updatedUser.role || null });
  },

  clearError: () => set({ error: null }),
}));