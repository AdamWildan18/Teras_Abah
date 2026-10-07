import { useAuthStore } from '../stores/authStore';

export const useRole = () => {
  const user = useAuthStore((s) => s.user);
  
  const role = user?.role || 'kasir';
  
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isKasir = role === 'kasir';
  const isProduksi = role === 'produksi';
  
  const hasRole = (r) => role === r;
  const hasAnyRole = (roles) => roles.includes(role);
  
  // Permission checks
  const canAccessInventory = isAdmin || isOwner;
  const canAccessProduction = isAdmin || isOwner || isProduksi;
  const canAccessKasir = isAdmin || isOwner || isKasir;
  const canAccessFinance = isAdmin || isOwner;
  const canAccessShift = true; // Semua bisa clock in/out
  const canManageShift = isAdmin || isOwner; // Hanya admin/owner bisa assign
  
  return {
    role,
    isAdmin,
    isOwner,
    isKasir,
    isProduksi,
    hasRole,
    hasAnyRole,
    canAccessInventory,
    canAccessProduction,
    canAccessKasir,
    canAccessFinance,
    canAccessShift,
    canManageShift,
  };
};