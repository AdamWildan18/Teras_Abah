import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { useAuthStore } from './stores/authStore';
import App from './App';
import './index.css';

// ✅ PENTING: Panggil initializeAuth SEBELUM render
useAuthStore.getState().initializeAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>
);