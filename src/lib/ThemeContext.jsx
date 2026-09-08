import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const DEFAULTS = {
  theme: 'dark',
  accent_color: '62 250 118',
  font_scale: 1,
  reduce_motion: false,
  high_contrast: false,
};

const STORAGE_KEY = 'elimuhub-preferences';

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(prefs) {
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.theme);
  root.setAttribute('data-contrast', prefs.high_contrast ? 'high' : 'normal');
  root.setAttribute('data-motion', prefs.reduce_motion ? 'reduced' : 'normal');
  root.style.setProperty('--color-accent', prefs.accent_color);
  root.style.setProperty('--font-scale', String(prefs.font_scale));
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(loadLocal);
  const auth = useAuth();
  const session = auth?.session;

  useEffect(() => {
    applyToDocument(preferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!session) return;
    api
      .get('/settings/preferences')
      .then((res) => setPreferences({ ...DEFAULTS, ...res.preferences }))
      .catch(() => {});
  }, [session]);

  async function updatePreferences(patch) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    if (session) {
      try {
        await api.put('/settings/preferences', next);
      } catch {
        // Local state already updated; next change will retry the sync.
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
