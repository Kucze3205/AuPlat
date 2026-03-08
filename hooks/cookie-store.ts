import { Platform } from 'react-native';

const fallbackStore = new Map<string, string>();

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

function parseCookieValue(name: string): string | null {
  if (!isWeb) return fallbackStore.get(name) ?? null;

  const cookieName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie ? document.cookie.split('; ') : [];

  for (const part of parts) {
    if (part.startsWith(cookieName)) {
      const rawValue = part.slice(cookieName.length);
      return decodeURIComponent(rawValue);
    }
  }

  return null;
}

export function getCookie(name: string): string | null {
  return parseCookieValue(name);
}

export function setCookie(name: string, value: string, maxAgeDays = 365): void {
  if (!isWeb) {
    fallbackStore.set(name, value);
    return;
  }

  const maxAgeSeconds = Math.max(0, Math.floor(maxAgeDays * 24 * 60 * 60));
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (!isWeb) {
    fallbackStore.delete(name);
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}
