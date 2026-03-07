import { useThemeMode } from '@/hooks/theme-mode';

export function useColorScheme() {
  const { themeMode } = useThemeMode();
  return themeMode;
}
