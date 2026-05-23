import { useState, useEffect, useCallback } from 'react';
import { listMachines } from '../api/machines';
import type { Machine } from '../api/types';

export type MachinesState = {
  machines: Machine[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useMachines(mechanicEmail?: string): MachinesState {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMachines(mechanicEmail);
      setMachines(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data mesin');
    } finally {
      setIsLoading(false);
    }
  }, [mechanicEmail]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  return { machines, isLoading, error, refresh: fetchMachines };
}
