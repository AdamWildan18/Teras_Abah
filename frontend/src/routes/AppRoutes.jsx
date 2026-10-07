import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRole } from '../hooks/useRole';
import AppLayout from '../components/layout/AppLayout';

// Auth
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';

// Inventory
import RawMaterialPage from '../features/inventory/pages/RawMaterialPage';
import ProductPage from '../features/inventory/pages/ProductPage';
import RecipePage from '../features/inventory/pages/RecipePage';

// Production
import ProductionPage from '../features/production/pages/ProductionPage';

// Cashier
import CashierPage from '../features/cashier/pages/CashierPage';

// Finance
import FinancePage from '../features/finance/pages/FinancePage';

// Shift
import ShiftPage from '../features/shift/pages/ShiftPage';

// Settings
import SettingsPage from '../features/settings/pages/SettingsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { hasAnyRole } = useRole();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">403 - Akses Ditolak</h1>
          <p className="text-gray-500 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }
  
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Inventory - Admin & Owner only */}
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <Navigate to="/inventory/raw-materials" replace />
          </ProtectedRoute>
        } />
        <Route path="/inventory/raw-materials" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <RawMaterialPage />
          </ProtectedRoute>
        } />
        <Route path="/inventory/products" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <ProductPage />
          </ProtectedRoute>
        } />
        <Route path="/inventory/recipes" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <RecipePage />
          </ProtectedRoute>
        } />
        
        {/* Production - Admin, Owner, Produksi */}
        <Route path="/production" element={
          <ProtectedRoute allowedRoles={['admin', 'owner', 'produksi']}>
            <ProductionPage />
          </ProtectedRoute>
        } />
        
        {/* Kasir - Admin, Owner, Kasir */}
        <Route path="/cashier" element={
          <ProtectedRoute allowedRoles={['admin', 'owner', 'kasir']}>
            <CashierPage />
          </ProtectedRoute>
        } />
        
        {/* Finance - Admin & Owner only */}
        <Route path="/finance" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <FinancePage />
          </ProtectedRoute>
        } />
        
        {/* Shift - Semua role */}
        <Route path="/shift" element={<ShiftPage />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}