import { apiRequest } from './client';
import type { Machine, SensorReading } from './types';

export async function listMachines(mechanicEmail?: string): Promise<Machine[]> {
  const url = mechanicEmail ? `/machines?mechanic_email=${encodeURIComponent(mechanicEmail)}` : '/machines';
  return apiRequest<Machine[]>(url);
}

export async function getMachine(id: string): Promise<Machine> {
  return apiRequest<Machine>(`/machines/${id}`);
}

export async function getLatestSensor(machineId: string): Promise<SensorReading> {
  return apiRequest<SensorReading>(`/machines/${machineId}/sensors/latest`);
}

export async function getSensorHistory(machineId: string, limit = 20): Promise<SensorReading[]> {
  return apiRequest<SensorReading[]>(`/machines/${machineId}/sensors/history?limit=${limit}`);
}
