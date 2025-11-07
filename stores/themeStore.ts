import { create } from 'zustand';
import { StorageService } from '@/services/storage/mmkv';
import { STORAGE_KEYS } from '@/utils/constants';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeStore {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Load theme from storage
const loadTheme = (): Theme => {
  const savedTheme = StorageService.getString(STORAGE_KEYS.THEME);
  return (savedTheme as Theme) || 'auto';
};

// Save theme to storage
const saveTheme = (theme: Theme) => {
  StorageService.setString(STORAGE_KEYS.THEME, theme);
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: loadTheme(),
  isDark: true, // Default to dark

  setTheme: (theme) => {
    saveTheme(theme);
    set({ theme, isDark: theme === 'dark' || (theme === 'auto' && true) });
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
}));
