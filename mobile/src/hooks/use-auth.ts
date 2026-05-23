import { useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, setTokens } from '../api/client';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '../store/auth-store';
import type { UserPublic } from '../api/types';

export type AuthState = {
  user: UserPublic | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadStoredSession: () => Promise<UserPublic | null>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      await setStoredAuth({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await clearTokens();
    await clearStoredAuth();
    setUser(null);
    setError(null);
  }, []);

  const loadStoredSession = useCallback(async (): Promise<UserPublic | null> => {
    const stored = await getStoredAuth();
    if (!stored) return null;
    await setTokens(stored.accessToken, stored.refreshToken);
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      await setStoredAuth({ ...stored, user: freshUser });
      return freshUser;
    } catch {
      await clearStoredAuth();
      return null;
    }
  }, []);

  return { user, isLoading, error, login, logout, loadStoredSession };
}
