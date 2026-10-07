import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRole } from '../../hooks/useRole';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, Package, ChefHat, ShoppingCart, 
  Wallet, LogOut, UtensilsCrossed, Shield,
  ChevronDown, ChevronRight, Sun, Moon, Settings,
  Layers, UserCheck, Users // ✅ Tambahkan Users
} from 'lucide-react';
import { useState } from 'react';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    role, 
    canAccessInventory, 
    canAccessProduction, 
    canAccessKasir, 
    canAccessFinance,
    isAdmin,
    isOwner
  } = useRole();

  const { appName, appLogo, themeMode, toggleTheme } = useApp();

  // ✅ State untuk menu yang punya children
  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));
  const [addOnsOpen, setAddOnsOpen] = useState(location.pathname.startsWith('/add-ons'));
  const [attendanceOpen, setAttendanceOpen] = useState(location.pathname.startsWith('/attendance'));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'kasir': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'produksi': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'owner': return 'Owner';
      case 'kasir': return 'Kasir';
      case 'produksi': return 'Produksi';
      default: return 'User';
    }
  };

  // ✅ UPDATE MENU: Hapus Shift, Tambahkan Data Karyawan di Absensi
  const filteredMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, always: true },
    { path: '/production', label: 'Produksi', icon: ChefHat, show: canAccessProduction },
    { path: '/cashier', label: 'Kasir', icon: ShoppingCart, show: canAccessKasir },
    { 
      path: '/inventory', label: 'Inventory', icon: Package, show: canAccessInventory,
      children: [
        { path: '/inventory/raw-materials', label: 'Bahan Mentah' },
        { path: '/inventory/products', label: 'Produk Jadi' },
        { path: '/inventory/recipes', label: 'Resep' },
      ]
    },
    { 
      path: '/attendance', label: 'Absensi & Karyawan', icon: UserCheck, show: isAdmin || isOwner,
      children: [
        { path: '/attendance/employees', label: 'Data Karyawan' },
        { path: '/attendance', label: 'Absensi Harian' },
        { path: '/attendance/report', label: 'Laporan Absensi' },  // ✅ BARU
        { path: '/attendance/qr-codes', label: 'QR Code Karyawan' },
      ]
    },
    { 
      path: '/add-ons', label: 'Add-On', icon: Layers, show: isAdmin || isOwner,
      children: [
        { path: '/add-ons', label: 'Kelola Add-On' },
        { path: '/add-ons/production', label: 'Produksi Add-On' },
      ]
    },
    { path: '/finance', label: 'Keuangan', icon: Wallet, show: canAccessFinance },
    { path: '/settings', label: 'Pengaturan', icon: Settings, show: isAdmin || isOwner },
  ].filter(item => item.always || item.show);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        {/* Logo & Brand */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {appLogo ? (
            <img src={appLogo.startsWith('http') ? appLogo : `http://localhost:8000${appLogo}`} alt="Logo" className="w-6 h-6 object-contain" />
          ) : (
            <UtensilsCrossed className="w-6 h-6 text-amber-500" />
          )}
          <span className="font-bold text-lg text-gray-900 dark:text-white truncate">{appName}</span>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor()}`}>
            <Shield className="w-3 h-3" />
            {getRoleLabel()}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            if (item.children) {
              const isChildActive = item.children.some(child => location.pathname === child.path);
              
              let isOpen;
              if (item.path === '/inventory') isOpen = inventoryOpen;
              else if (item.path === '/add-ons') isOpen = addOnsOpen;
              else if (item.path === '/attendance') isOpen = attendanceOpen;
              else isOpen = false;

              return (
                <div key={item.path}>
                  <button
                    onClick={() => {
                      if (item.path === '/inventory') setInventoryOpen(!inventoryOpen);
                      else if (item.path === '/add-ons') setAddOnsOpen(!addOnsOpen);
                      else if (item.path === '/attendance') setAttendanceOpen(!attendanceOpen);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                      isActive || isChildActive 
                        ? 'bg-amber-50 text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`block px-3 py-1.5 text-sm rounded-lg transition ${
                            location.pathname === child.path
                              ? 'bg-amber-100 text-amber-700 font-medium dark:bg-amber-900/40 dark:text-amber-400'
                              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 font-medium dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
            {themeMode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-sm font-medium">{themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
}