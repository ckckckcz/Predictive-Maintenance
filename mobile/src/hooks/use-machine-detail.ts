import { useState, useEffect, useCallback } from 'react';
import { getMachine, getLatestSensor, getSensorHistory } from '../api/machines';
import type { Machine, SensorReading } from '../api/types';

export type MachineDetailState = {
  machine: Machine | null;
  latestSensor: SensorReading | null;
  sensorHistory: SensorReading[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useMachineDetail(machineId: string): MachineDetailState {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [latestSensor, setLatestSensor] = useState<SensorReading | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!machineId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [machineData, sensorData, historyData] = await Promise.all([
        getMachine(machineId),
        getLatestSensor(machineId).catch(() => null),
        getSensorHistory(machineId, 20).catch(() => []),
      ]);
      setMachine(machineData);
      setLatestSensor(sensorData);
      setSensorHistory(historyData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail mesin');
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { machine, latestSensor, sensorHistory, isLoading, error, refresh: fetchAll };
}
