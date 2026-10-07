import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { UtensilsCrossed, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dynamicAppName, setDynamicAppName] = useState('Warung Bakso');
  const [dynamicAppLogo, setDynamicAppLogo] = useState(null);
  const [dynamicTagline, setDynamicTagline] = useState('Sistem Manajemen Terintegrasi');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // ✅ Baca dari localStorage HANYA SEKALI - TIDAK ada API call
  useEffect(() => {
    try {
      const cached = localStorage.getItem('app_settings_cache');
      if (cached) {
        const settings = JSON.parse(cached);
        if (settings.app_name) setDynamicAppName(settings.app_name);
        if (settings.app_tagline) setDynamicTagline(settings.app_tagline);
        
        if (settings.app_logo) {
          let logoUrl = settings.app_logo;
          if (!logoUrl.startsWith('http')) {
            const normalizedPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
            if (!normalizedPath.includes('/storage/')) {
              logoUrl = `http://localhost:8000/storage${normalizedPath}`;
            } else {
              logoUrl = `http://localhost:8000${normalizedPath}`;
            }
          }
          setDynamicAppLogo(logoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to read cached settings:', error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          {dynamicAppLogo ? (
            <img 
              src={dynamicAppLogo} 
              alt="Logo" 
              className="w-20 h-20 object-contain mx-auto mb-4"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dynamicAppName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{dynamicTagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="admin@warung.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Demo Accounts:</p>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Admin: admin@warung.com / password</p>
            <p>Kasir: kasir@warung.com / password</p>
            <p>Produksi: produksi@warung.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}