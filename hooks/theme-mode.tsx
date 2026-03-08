import { getCookie, setCookie } from '@/hooks/cookie-store';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
const THEME_COOKIE_KEY = 'auction_theme_mode_v1';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  // Light is the default primary mode for this app.
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = getCookie(THEME_COOKIE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setCookie(THEME_COOKIE_KEY, themeMode);
  }, [hydrated, themeMode]);

  const value = useMemo(
    () => ({ themeMode, setThemeMode }),
    [themeMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider.');
  }
  return context;
}
