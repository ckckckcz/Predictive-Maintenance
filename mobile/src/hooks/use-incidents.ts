import { useState, useEffect, useCallback } from 'react';
import { listIncidents, getIncidentStats, createIncident, acknowledgeIncident } from '../api/incidents';
import type { IncidentWithDetails, IncidentStats, CreateIncidentPayload, IncidentFilter } from '../api/types';

export type IncidentsState = {
  incidents: IncidentWithDetails[];
  stats: IncidentStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  createIncident: (payload: CreateIncidentPayload) => Promise<boolean>;
  acknowledgeIncident: (id: string) => Promise<void>;
  refresh: () => void;
};

export function useIncidents(filter: IncidentFilter = {}): IncidentsState {
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [incidentList, incidentStats] = await Promise.all([
        listIncidents({ ...filter, limit: 50 }),
        getIncidentStats(),
      ]);
      setIncidents(incidentList);
      setStats(incidentStats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat insiden');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filter)]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleCreate = useCallback(async (payload: CreateIncidentPayload): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await createIncident(payload);
      await fetchIncidents();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchIncidents]);

  const handleAcknowledge = useCallback(async (id: string): Promise<void> => {
    await acknowledgeIncident(id);
    await fetchIncidents();
  }, [fetchIncidents]);

  return {
    incidents,
    stats,
    isLoading,
    isSubmitting,
    error,
    createIncident: handleCreate,
    acknowledgeIncident: handleAcknowledge,
    refresh: fetchIncidents,
  };
}
