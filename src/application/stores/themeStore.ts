import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'poker-clock:theme';

/** Dark is the house style — light is opt-in from Settings, not from the OS. */
function readStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

interface ThemeStoreState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * The operator app's light/dark setting. It is published as `data-theme` on the
 * `Screen` wrapper — deliberately not on <html> — so it covers the operator
 * screens only. The projector renders outside `Screen` and is therefore never
 * touched by it; its appearance is its own concern.
 */
export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
