import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  // Light is the default primary mode for this app.
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

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
