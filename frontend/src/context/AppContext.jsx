import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_URL = 'http://localhost:8000';
const LOCAL_STORAGE_KEY = 'app_settings_cache';

const DEFAULT_SETTINGS = {
  app_name: 'Warung Bakso',
  app_tagline: 'Sistem Manajemen Terintegrasi',
  app_logo: null,
  theme_mode: 'light',
  primary_color: '#f59e0b',
  business_name: 'WARUNG BAKSO',
  business_address: '',
  business_phone: '',
  business_footer: 'Terima kasih atas kunjungan Anda!',
  receipt_paper_size: '80mm',
  receipt_show_logo: true,
  receipt_show_timestamp: true,
  receipt_auto_print: false,
};

function getFullUrlStatic(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.includes('/storage/')) {
    return `${STORAGE_URL}/storage${normalizedPath}`;
  }
  return `${STORAGE_URL}${normalizedPath}`;
}

export function AppProvider({ children }) {
  // ✅ HANYA baca dari localStorage, TIDAK ada fetch API
  const [appName, setAppName] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved).app_name : DEFAULT_SETTINGS.app_name;
    } catch {
      return DEFAULT_SETTINGS.app_name;
    }
  });

  const [appLogo, setAppLogo] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const logo = saved ? JSON.parse(saved).app_logo : null;
      return logo ? getFullUrlStatic(logo) : null;
    } catch {
      return null;
    }
  });

  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved).theme_mode : DEFAULT_SETTINGS.theme_mode;
    } catch {
      return DEFAULT_SETTINGS.theme_mode;
    }
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved).primary_color : DEFAULT_SETTINGS.primary_color;
    } catch {
      return DEFAULT_SETTINGS.primary_color;
    }
  });

  const [receiptSettings, setReceiptSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const s = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      return {
        receipt_paper_size: s.receipt_paper_size || DEFAULT_SETTINGS.receipt_paper_size,
        receipt_show_logo: s.receipt_show_logo ?? DEFAULT_SETTINGS.receipt_show_logo,
        receipt_show_timestamp: s.receipt_show_timestamp ?? DEFAULT_SETTINGS.receipt_show_timestamp,
        receipt_auto_print: s.receipt_auto_print ?? DEFAULT_SETTINGS.receipt_auto_print,
        business_name: s.business_name || DEFAULT_SETTINGS.business_name,
        business_address: s.business_address || DEFAULT_SETTINGS.business_address,
        business_phone: s.business_phone || DEFAULT_SETTINGS.business_phone,
        business_footer: s.business_footer || DEFAULT_SETTINGS.business_footer,
      };
    } catch {
      return {
        receipt_paper_size: DEFAULT_SETTINGS.receipt_paper_size,
        receipt_show_logo: DEFAULT_SETTINGS.receipt_show_logo,
        receipt_show_timestamp: DEFAULT_SETTINGS.receipt_show_timestamp,
        receipt_auto_print: DEFAULT_SETTINGS.receipt_auto_print,
        business_name: DEFAULT_SETTINGS.business_name,
        business_address: DEFAULT_SETTINGS.business_address,
        business_phone: DEFAULT_SETTINGS.business_phone,
        business_footer: DEFAULT_SETTINGS.business_footer,
      };
    }
  });

  const [loading, setLoading] = useState(false);

  const getFullUrl = getFullUrlStatic;

  // ✅ Simpan ke localStorage SETIAP kali ada perubahan
  useEffect(() => {
    const settingsToCache = {
      app_name: appName,
      app_tagline: DEFAULT_SETTINGS.app_tagline,
      app_logo: appLogo ? appLogo.replace(`${STORAGE_URL}/storage/`, '') : null,
      theme_mode: themeMode,
      primary_color: primaryColor,
      business_name: receiptSettings.business_name,
      business_address: receiptSettings.business_address,
      business_phone: receiptSettings.business_phone,
      business_footer: receiptSettings.business_footer,
      receipt_paper_size: receiptSettings.receipt_paper_size,
      receipt_show_logo: receiptSettings.receipt_show_logo,
      receipt_show_timestamp: receiptSettings.receipt_show_timestamp,
      receipt_auto_print: receiptSettings.receipt_auto_print,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToCache));
  }, [appName, appLogo, themeMode, primaryColor, receiptSettings]);

  // Apply theme
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    appName,
    setAppName,
    appLogo,
    setAppLogo,
    themeMode,
    setThemeMode,
    primaryColor,
    setPrimaryColor,
    receiptSettings,
    setReceiptSettings,
    loading,
    toggleTheme,
    getFullUrl,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};