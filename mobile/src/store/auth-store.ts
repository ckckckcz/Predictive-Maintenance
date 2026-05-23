import * as SecureStore from 'expo-secure-store';
import type { UserPublic } from '../api/types';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
};

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const [accessToken, refreshToken, userJson] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.getItemAsync(KEYS.USER),
  ]);

  if (!accessToken || !refreshToken || !userJson) return null;

  try {
    const user: UserPublic = JSON.parse(userJson);
    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, auth.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, auth.refreshToken),
    SecureStore.setItemAsync(KEYS.USER, JSON.stringify(auth.user)),
  ]);
}

export async function clearStoredAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER),
  ]);
}
