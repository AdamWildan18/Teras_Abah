import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settingsApi';
import { toast } from 'sonner';
import {
  Settings, Building2, Receipt, Palette, Save,
  Sun, Moon, Image as ImageIcon
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useApp } from '../../../context/AppContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const { 
    appName, setAppName, 
    appLogo, setAppLogo, 
    themeMode, setThemeMode,
    getFullUrl 
  } = useApp();
  const queryClient = useQueryClient();

  // ✅ Fetch settings HANYA saat halaman Settings dibuka
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
    staleTime: Infinity, // ✅ Tidak auto-refetch
    refetchOnWindowFocus: false, // ✅ Tidak refetch saat focus
    refetchOnReconnect: false, // ✅ Tidak refetch saat reconnect
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Pengaturan berhasil disimpan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: settingsApi.upload,
    onSuccess: (response) => {
      const { path, key } = response.data;
      const fullUrl = getFullUrl(path);
      
      if (key === 'app_logo') {
        setLogoPreview(fullUrl);
        setAppLogo(fullUrl);
        setSettings(prev => ({ ...prev, app_logo: path }));
      }
      
      toast.success('File berhasil diupload');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal upload file');
    },
  });

  // Parse data dari API
  useEffect(() => {
    if (!data) return;
    
    const allSettings = {};
    const responseData = data.data || data;
    
    if (typeof responseData === 'object' && responseData !== null) {
      Object.entries(responseData).forEach(([groupName, groupData]) => {
        if (Array.isArray(groupData)) {
          groupData.forEach(setting => {
            if (setting && setting.key) {
              allSettings[setting.key] = setting.value;
            }
          });
        }
      });
    }
    
    setSettings(allSettings);
    
    // Sync dengan AppContext
    if (allSettings.app_name) setAppName(allSettings.app_name);
    if (allSettings.theme_mode) setThemeMode(allSettings.theme_mode);
    if (allSettings.app_logo) {
      const logoUrl = getFullUrl(allSettings.app_logo);
      setLogoPreview(logoUrl);
      setAppLogo(logoUrl);
    }
  }, [data]);

  const handleSave = () => {
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value ?? '',
      type: typeof value === 'boolean' ? 'boolean' : 'string',
    }));
    updateMutation.mutate({ settings: settingsArray });
  };

  const handleFileUpload = (key, file) => {
    if (!file) return;
    
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    uploadMutation.mutate(formData);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'app_name') setAppName(value);
    if (key === 'theme_mode') setThemeMode(value);
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Building2 },
    { id: 'receipt', label: 'Cetak Struk', icon: Receipt },
    { id: 'appearance', label: 'Tampilan', icon: Palette },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-bold text-red-700 dark:text-red-400">Error Memuat Pengaturan</h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="w-6 h-6" />
            Pengaturan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Konfigurasi aplikasi sesuai kebutuhan</p>
        </div>
        <Button onClick={handleSave} loading={updateMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Simpan Perubahan
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Informasi Aplikasi</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nama Aplikasi</label>
                  <input
                    type="text"
                    value={settings.app_name || ''}
                    onChange={(e) => updateSetting('app_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Warung Bakso"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tagline</label>
                  <input
                    type="text"
                    value={settings.app_tagline || ''}
                    onChange={(e) => updateSetting('app_tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Sistem Manajemen Terintegrasi"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Logo Aplikasi</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('app_logo', e.target.files[0])}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/30 dark:file:text-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Informasi Usaha (untuk struk)</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nama Usaha</label>
                  <input
                    type="text"
                    value={settings.business_name || ''}
                    onChange={(e) => updateSetting('business_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Alamat</label>
                  <textarea
                    value={settings.business_address || ''}
                    onChange={(e) => updateSetting('business_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    rows="2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Telepon</label>
                  <input
                    type="text"
                    value={settings.business_phone || ''}
                    onChange={(e) => updateSetting('business_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pesan Footer Struk</label>
                  <textarea
                    value={settings.business_footer || ''}
                    onChange={(e) => updateSetting('business_footer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Pengaturan Cetak Struk</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ukuran Kertas</label>
                <div className="flex gap-3">
                  {['58mm', '80mm'].map(size => (
                    <button
                      key={size}
                      onClick={() => updateSetting('receipt_paper_size', size)}
                      className={`flex-1 p-4 rounded-lg border-2 transition ${
                        settings.receipt_paper_size === size
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-bold">{size}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {size === '58mm' ? 'Printer kecil/portable' : 'Printer standar'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Tampilkan Logo di Struk</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Logo usaha akan muncul di bagian atas struk</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receipt_show_logo === 'true' || settings.receipt_show_logo === true}
                    onChange={(e) => updateSetting('receipt_show_logo', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 text-amber-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-amber-500 focus:ring-2"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Tampilkan Tanggal/Waktu</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Informasi waktu transaksi di struk</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receipt_show_timestamp === 'true' || settings.receipt_show_timestamp === true}
                    onChange={(e) => updateSetting('receipt_show_timestamp', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 text-amber-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-amber-500 focus:ring-2"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Auto Print</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Otomatis cetak struk setelah transaksi berhasil</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receipt_auto_print === 'true' || settings.receipt_auto_print === true}
                    onChange={(e) => updateSetting('receipt_auto_print', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 text-amber-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-amber-500 focus:ring-2"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Pengaturan Tampilan</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Mode Tema</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      updateSetting('theme_mode', 'light');
                      setThemeMode('light');
                    }}
                    className={`p-6 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      settings.theme_mode === 'light'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                  >
                    <Sun className={`w-8 h-8 ${settings.theme_mode === 'light' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`font-medium ${settings.theme_mode === 'light' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>Light Mode</span>
                  </button>

                  <button
                    onClick={() => {
                      updateSetting('theme_mode', 'dark');
                      setThemeMode('dark');
                    }}
                    className={`p-6 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      settings.theme_mode === 'dark'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                  >
                    <Moon className={`w-8 h-8 ${settings.theme_mode === 'dark' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`font-medium ${settings.theme_mode === 'dark' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>Dark Mode</span>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Warna Utama</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primary_color || '#f59e0b'}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.primary_color || '#f59e0b'}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateSetting('primary_color', color)}
                      className="w-10 h-10 rounded-lg border-2 hover:scale-110 transition"
                      style={{ backgroundColor: color, borderColor: settings.primary_color === color ? '#000' : 'transparent' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}