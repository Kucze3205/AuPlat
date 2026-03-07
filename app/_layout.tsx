import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { ThemeModeProvider } from '@/hooks/theme-mode';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <AppShell />
    </ThemeModeProvider>
  );
}

function AppShell() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';

  const navTheme =
    scheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: Colors.dark.tint,
            background: Colors.dark.background,
            card: Colors.dark.surface,
            text: Colors.dark.text,
            border: Colors.dark.icon,
            notification: Colors.dark.tint,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: Colors.light.tint,
            background: Colors.light.background,
            card: Colors.light.surface,
            text: Colors.light.text,
            border: Colors.light.icon,
            notification: Colors.light.tint,
          },
        };

  return (
    <ErrorBoundary>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auction/[id]" options={{ title: 'Auction Details' }} />
        </Stack>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
