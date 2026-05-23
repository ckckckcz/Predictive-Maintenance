export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type UserPublic = {
  id: string;
  name: string;
  email: string;
  role: 'SUPERVISOR' | 'OPERATOR';
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: UserPublic;
};

export type Machine = {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
};

export type SensorReading = {
  id: string;
  machine_id: string;
  temperature: number | null;
  vibration: number | null;
  pressure: number | null;
  rpm: number | null;
  efficiency: number | null;
  is_anomaly: boolean;
  read_at: string;
};

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type IncidentWithDetails = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_code: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  risk_score: number;
  image_url: string | null;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentStats = {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type CreateIncidentPayload = {
  machine_id: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  risk_score?: number;
  image_url?: string;
};

export type IncidentFilter = {
  machine_id?: string;
  severity?: string;
  status?: string;
  page?: number;
  limit?: number;
};
