import { apiRequest, setTokens } from './client';
import type { LoginResponse, UserPublic } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    requiresAuth: false,
  });
  await setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function getMe(): Promise<UserPublic> {
  return apiRequest<UserPublic>('/auth/me');
}

export async function updateMe(name: string, phone?: string): Promise<UserPublic> {
  return apiRequest<UserPublic>('/auth/me', {
    method: 'PUT',
    body: { name, phone: phone ?? null },
  });
}
