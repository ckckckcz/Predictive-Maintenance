import { apiRequest } from './client';
import type { IncidentWithDetails, IncidentStats, CreateIncidentPayload, IncidentFilter } from './types';

export async function getIncidentStats(): Promise<IncidentStats> {
  return apiRequest<IncidentStats>('/incidents/stats');
}

export async function listIncidents(filter: IncidentFilter = {}): Promise<IncidentWithDetails[]> {
  const params = new URLSearchParams();
  if (filter.machine_id) params.set('machine_id', filter.machine_id);
  if (filter.severity) params.set('severity', filter.severity);
  if (filter.status) params.set('status', filter.status);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.limit) params.set('limit', String(filter.limit ?? 20));

  const query = params.toString();
  return apiRequest<IncidentWithDetails[]>(`/incidents${query ? `?${query}` : ''}`);
}

export async function createIncident(payload: CreateIncidentPayload): Promise<IncidentWithDetails> {
  return apiRequest<IncidentWithDetails>('/incidents', {
    method: 'POST',
    body: payload,
  });
}

export async function acknowledgeIncident(id: string): Promise<void> {
  await apiRequest<void>(`/incidents/${id}/acknowledge`, { method: 'POST' });
}
