import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AuthUserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface AuthUser {
  id: string;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: AuthUserRole;
}

interface StoredAuth {
  token: string;
  user: AuthUser;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

export const AUTH_STORAGE_KEY = 'yisu-hotel:auth';

export function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<AuthUser>;
  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    (user.role === 'CUSTOMER' || user.role === 'MERCHANT' || user.role === 'ADMIN')
  );
}

function isStoredAuth(value: unknown): value is StoredAuth {
  if (!value || typeof value !== 'object') return false;
  const auth = value as Partial<StoredAuth>;
  return (
    typeof auth.token === 'string' &&
    auth.token.length > 0 &&
    isAuthUser(auth.user)
  );
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setAuth: async (token, user) => {
    set({ token, user, isHydrated: true });
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
  },

  clearAuth: async () => {
    set({ token: null, user: null, isHydrated: true });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  },

  hydrateFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        set({ token: null, user: null, isHydrated: true });
        return;
      }

      const stored: unknown = JSON.parse(raw);
      if (!isStoredAuth(stored)) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ token: null, user: null, isHydrated: true });
        return;
      }

      set({ token: stored.token, user: stored.user, isHydrated: true });
    } catch {
      set({ token: null, user: null, isHydrated: true });
    }
  },
}));
