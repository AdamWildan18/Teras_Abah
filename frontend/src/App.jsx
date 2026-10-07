import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/pages/LoginPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import CashierPage from './features/cashier/pages/CashierPage';
import SettingsPage from './features/settings/pages/SettingsPage';
import { Loader2 } from 'lucide-react';

// Import halaman lain
import InventoryPage from './features/inventory/pages/InventoryPage';
import ProductionPage from './features/production/pages/ProductionPage';
import FinancePage from './features/finance/pages/FinancePage';

// Import Add-On Pages
import AddOnsPage from './features/settings/pages/AddOnsPage';
import AddonProductionPage from './features/settings/pages/AddonProductionPage';

// ✅ Import halaman Attendance & Employee
import AttendancePage from './features/attendance/pages/AttendancePage';
import EmployeeQrPage from './features/attendance/pages/EmployeeQrPage';
import EmployeePage from './features/attendance/pages/EmployeePage';
import AttendanceReportPage from './features/attendance/pages/AttendanceReportPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isInitialized } = useAuthStore();
  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-amber-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-amber-500" /></div>;
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        
        {/* INVENTORY */}
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/raw-materials" element={<InventoryPage type="raw" />} />
        <Route path="/inventory/products" element={<InventoryPage type="product" />} />
        <Route path="/inventory/recipes" element={<InventoryPage type="recipe" />} />
        
        {/* PRODUCTION */}
        <Route path="/production" element={<ProductionPage />} />
        
        {/* FINANCE */}
        <Route path="/finance" element={<FinancePage />} />
        
        {/* SETTINGS */}
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><SettingsPage /></ProtectedRoute>} />

        {/* ADD-ON */}
        <Route path="/add-ons" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AddOnsPage /></ProtectedRoute>} />
        <Route path="/add-ons/production" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AddonProductionPage /></ProtectedRoute>} />

        {/* ✅ ATTENDANCE & EMPLOYEE ROUTES */}
        <Route path="/attendance/employees" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <EmployeePage />
          </ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/attendance/qr-codes" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <EmployeeQrPage />
          </ProtectedRoute>
        } />

        <Route path="/attendance/report" element={
          <ProtectedRoute allowedRoles={['admin', 'owner']}>
            <AttendanceReportPage />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}