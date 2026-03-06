import { fetchMe, onAuthChanged, UserProfile } from '@/services/api';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setUser(await fetchMe());
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  return { user, setUser, authLoading };
}
