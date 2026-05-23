import { BASE_URL } from './types';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) return null;

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const json = await response.json();
  const newAccess: string = json.data?.access_token ?? json.access_token;
  const newRefresh: string = json.data?.refresh_token ?? json.refresh_token;

  if (newAccess) {
    await setTokens(newAccess, newRefresh);
    return newAccess;
  }

  return null;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    let token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      token = await refreshAccessToken();
      if (!token) throw new Error('Session expired');
      headers['Authorization'] = `Bearer ${token}`;

      const retried = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      return parseResponse<T>(retried);
    }

    return parseResponse<T>(response);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function uploadFile(
  path: string,
  formData: FormData
): Promise<{ url: string }> {
  let token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) throw new Error('Session expired');
    headers['Authorization'] = `Bearer ${token}`;

    const retried = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return parseResponse<{ url: string }>(retried);
  }

  return parseResponse<{ url: string }>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok) {
    const message = json.error ?? json.message ?? 'Request failed';
    throw new Error(message);
  }

  return (json.data ?? json) as T;
}
