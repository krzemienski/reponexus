import { create } from 'zustand';
import { StorageService } from '@/services/storage/mmkv';

interface Settings {
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  analyticsEnabled: boolean;
}

interface SettingsStore extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
  reset: () => void;
}

const defaultSettings: Settings = {
  biometricEnabled: false,
  notificationsEnabled: true,
  analyticsEnabled: true,
};

// Load settings from storage
const loadSettings = (): Settings => {
  const saved = StorageService.getObject<Settings>('settings');
  return saved || defaultSettings;
};

// Save settings to storage
const saveSettings = (settings: Settings) => {
  StorageService.setObject('settings', settings);
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),

  updateSettings: (newSettings) => {
    const updated = { ...get(), ...newSettings };
    saveSettings(updated);
    set(newSettings);
  },

  reset: () => {
    saveSettings(defaultSettings);
    set(defaultSettings);
  },
}));
