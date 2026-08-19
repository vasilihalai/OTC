import { create } from 'zustand';

export type AppLanguage = 'ru' | 'en' | 'ky';
export type AppTheme = 'dark' | 'light';

interface SettingsStore {
  language: AppLanguage;
  theme: AppTheme;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
}

/**
 * Cosmetic in this release (§9.2 of screens.md) — the app is Russian-only
 * and dark-only, so picking a different option here only changes what the
 * profile row displays. Kept in a store so wiring a real switch later is a
 * data change, not a screen change.
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  language: 'ru',
  theme: 'dark',
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
