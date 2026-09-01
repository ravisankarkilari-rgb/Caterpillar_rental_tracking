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
  CheckInPayload,
  UserAccount,
  SystemSetting
} from '../types';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach auth token, role, and email headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cat_auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  const storedRole = localStorage.getItem('cat_user_role') || 'MANAGER';
  config.headers['x-user-role'] = storedRole;
  const storedEmail = localStorage.getItem('cat_auth_email');
  if (storedEmail) {
    config.headers['x-user-email'] = storedEmail;
  }
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
  // Auth
  login: async (payload: { email: string; password?: string }): Promise<{
    access_token: string;
    token_type: string;
    user_id: string;
    username: string;
    email: string;
    role: string;
    status: string;
  }> => {
    const res = await apiClient.post('/auth/login', {
      email: payload.email,
      password: payload.password || ''
    });
    return res.data;
  },

  changePassword: async (payload: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/change-password', payload);
    return res.data;
  },

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

  updateEquipment: async (id: string, payload: {
    equipment_type?: string;
    customer_id?: string;
    site_id?: string;
    operator_id?: string;
    rental_start_date?: string;
    expected_return_date?: string;
    status?: string;
  }): Promise<Equipment> => {
    const res = await apiClient.put<Equipment>(`/equipment/${id}`, payload);
    return res.data;
  },

  deactivateEquipment: async (id: string): Promise<Equipment> => {
    const res = await apiClient.patch<Equipment>(`/equipment/${id}/deactivate`);
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

  createCustomer: async (payload: { customer_id: string; display_name: string }): Promise<Customer> => {
    const res = await apiClient.post<Customer>('/entities/customers', payload);
    return res.data;
  },

  deleteCustomer: async (customer_id: string): Promise<void> => {
    await apiClient.delete(`/entities/customers/${customer_id}`);
  },

  getSites: async (): Promise<Site[]> => {
    const res = await apiClient.get<Site[]>('/entities/sites');
    return res.data;
  },

  createSite: async (payload: { site_id: string; display_name: string }): Promise<Site> => {
    const res = await apiClient.post<Site>('/entities/sites', payload);
    return res.data;
  },

  deleteSite: async (site_id: string): Promise<void> => {
    await apiClient.delete(`/entities/sites/${site_id}`);
  },

  getOperators: async (): Promise<Operator[]> => {
    const res = await apiClient.get<Operator[]>('/entities/operators');
    return res.data;
  },

  createOperator: async (payload: { operator_id: string }): Promise<Operator> => {
    const res = await apiClient.post<Operator>('/entities/operators', payload);
    return res.data;
  },

  deleteOperator: async (operator_id: string): Promise<void> => {
    await apiClient.delete(`/entities/operators/${operator_id}`);
  },

  // Users (ADMIN only)
  getUsers: async (): Promise<UserAccount[]> => {
    const res = await apiClient.get<UserAccount[]>('/users');
    return res.data;
  },

  createUser: async (payload: { user_id: string; username: string; email: string; role: string; password?: string }): Promise<UserAccount> => {
    const res = await apiClient.post<UserAccount>('/users', payload);
    return res.data;
  },

  updateUser: async (user_id: string, payload: { role?: string; status?: string }): Promise<UserAccount> => {
    const res = await apiClient.put<UserAccount>(`/users/${user_id}`, payload);
    return res.data;
  },

  toggleUserStatus: async (user_id: string, statusValue: 'ACTIVE' | 'DISABLED'): Promise<UserAccount> => {
    const res = await apiClient.patch<UserAccount>(`/users/${user_id}/status`, null, {
      params: { status_value: statusValue }
    });
    return res.data;
  },

  resetUserPassword: async (user_id: string, new_password: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/users/${user_id}/reset-password`, { new_password });
    return res.data;
  },

  // System Settings (ADMIN only)
  getSettings: async (): Promise<SystemSetting[]> => {
    const res = await apiClient.get<SystemSetting[]>('/settings');
    return res.data;
  },

  updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const res = await apiClient.put<SystemSetting>(`/settings/${key}`, { value });
    return res.data;
  },
};
