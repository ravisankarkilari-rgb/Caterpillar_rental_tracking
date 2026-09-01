import axios from 'axios';
import {
  Equipment,
  UsageLog,
  RentalRecord,
  Alert,
  Customer,
  Site,
  Operator,
  DashboardSummary,
  FleetMetrics,
  DemandForecastResponse,
  CheckOutPayload,
  CheckInPayload
} from '../types';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach simulated role header
apiClient.interceptors.request.use((config) => {
  const storedRole = localStorage.getItem('cat_user_role') || 'MANAGER';
  config.headers['x-user-role'] = storedRole;
  return config;
});

// Intercept responses for friendly error extraction
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((d: any) => d.msg || d.message).join(', ');
    }
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

export const api = {
  // Equipment
  getEquipmentList: async (params?: {
    search?: string;
    type?: string;
    status?: string;
    customer_id?: string;
    site_id?: string;
  }): Promise<Equipment[]> => {
    const res = await apiClient.get<Equipment[]>('/equipment', { params });
    return res.data;
  },

  getEquipmentById: async (id: string): Promise<Equipment> => {
    const res = await apiClient.get<Equipment>(`/equipment/${id}`);
    return res.data;
  },

  createEquipment: async (payload: { equipment_id: string; equipment_type: string }): Promise<Equipment> => {
    const res = await apiClient.post<Equipment>('/equipment', payload);
    return res.data;
  },

  getEquipmentLogs: async (id: string, limit: number = 30): Promise<UsageLog[]> => {
    const res = await apiClient.get<UsageLog[]>(`/equipment/${id}/logs`, { params: { limit } });
    return res.data;
  },

  addEquipmentLog: async (id: string, payload: {
    date: string;
    engine_hours: number;
    idle_hours: number;
    fuel_usage?: number;
    operating_days?: number;
    site_id?: string;
  }): Promise<UsageLog> => {
    const res = await apiClient.post<UsageLog>(`/equipment/${id}/logs`, payload);
    return res.data;
  },

  controlIgnition: async (id: string, state: 'ON' | 'OFF', reason?: string): Promise<Equipment> => {
    const res = await apiClient.post<Equipment>(`/equipment/${id}/ignition`, { state, reason });
    return res.data;
  },

  // Rentals
  checkout: async (payload: CheckOutPayload): Promise<Equipment> => {
    const res = await apiClient.post<Equipment>('/rentals/check-out', payload);
    return res.data;
  },

  checkin: async (payload: CheckInPayload): Promise<Equipment> => {
    const res = await apiClient.post<Equipment>('/rentals/check-in', payload);
    return res.data;
  },

  getRentalHistory: async (equipment_id?: string): Promise<RentalRecord[]> => {
    const res = await apiClient.get<RentalRecord[]>('/rentals/history', {
      params: equipment_id ? { equipment_id } : undefined,
    });
    return res.data;
  },

  // Alerts
  getAlerts: async (params?: {
    severity?: string;
    alert_type?: string;
    resolved?: boolean;
    equipment_id?: string;
  }): Promise<Alert[]> => {
    const res = await apiClient.get<Alert[]>('/alerts', { params });
    return res.data;
  },

  resolveAlert: async (id: number, resolved: boolean = true): Promise<Alert> => {
    const res = await apiClient.post<Alert>(`/alerts/${id}/resolve`, { resolved });
    return res.data;
  },

  // Analytics
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/analytics/dashboard-summary');
    return res.data;
  },

  getFleetMetrics: async (): Promise<FleetMetrics> => {
    const res = await apiClient.get<FleetMetrics>('/analytics/fleet-metrics');
    return res.data;
  },

  getDemandForecast: async (): Promise<DemandForecastResponse> => {
    const res = await apiClient.get<DemandForecastResponse>('/analytics/demand-forecast');
    return res.data;
  },

  // Entities
  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/entities/customers');
    return res.data;
  },

  getSites: async (): Promise<Site[]> => {
    const res = await apiClient.get<Site[]>('/entities/sites');
    return res.data;
  },

  getOperators: async (): Promise<Operator[]> => {
    const res = await apiClient.get<Operator[]>('/entities/operators');
    return res.data;
  },
};
