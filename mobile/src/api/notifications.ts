import { apiRequest } from './client';

export async function subscribeExpo(expoToken: string): Promise<void> {
  await apiRequest<void>('/notifications/subscribe/expo', {
    method: 'POST',
    body: { expo_token: expoToken },
  });
}

export async function getSubscriptions(): Promise<unknown[]> {
  return apiRequest<unknown[]>('/notifications/subscriptions');
}
