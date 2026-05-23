import { apiRequest } from './client';
import type { Machine, SensorReading } from './types';

export async function listMachines(): Promise<Machine[]> {
  return apiRequest<Machine[]>('/machines');
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
