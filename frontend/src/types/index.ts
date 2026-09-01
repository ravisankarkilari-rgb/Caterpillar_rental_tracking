export type EquipmentStatus = 'AVAILABLE' | 'RENTED' | 'DUE_SOON' | 'OVERDUE' | 'UNDER_UTILIZED';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface Equipment {
  id: number;
  equipment_id: string;
  equipment_type: string;
  status: EquipmentStatus;
  customer_id: string | null;
  site_id: string | null;
  operator_id: string | null;
  rental_start_date: string | null;
  expected_return_date: string | null;
  ignition_status: 'ON' | 'OFF';
  created_at: string;
  updated_at: string;

  // Real-time telemetry metrics
  engine_hours_per_day: number;
  idle_hours_per_day: number;
  total_engine_hours: number;
  total_idle_hours: number;
  operating_days: number;
  utilization_percentage: number;
  days_overdue: number;
  days_remaining: number | null;
  active_alert_count: number;
}

export interface UsageLog {
  id: number;
  equipment_id: string;
  date: string;
  engine_hours: number;
  idle_hours: number;
  fuel_usage: number;
  operating_days: number;
  site_id: string | null;
  utilization_percentage: number;
  created_at: string;
}

export interface RentalRecord {
  id: number;
  equipment_id: string;
  customer_id: string;
  site_id: string;
  operator_id: string | null;
  check_out_date: string;
  expected_return_date: string;
  check_in_date: string | null;
  condition: string | null;
  status: string;
  created_at: string;
}

export interface Alert {
  id: number;
  equipment_id: string;
  equipment_type: string | null;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  explanation: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface Customer {
  id: number;
  customer_id: string;
  display_name: string;
}

export interface Site {
  id: number;
  site_id: string;
  display_name: string;
}

export interface Operator {
  id: number;
  operator_id: string;
}

export interface DashboardSummary {
  total_equipment: number;
  rented: number;
  available: number;
  overdue: number;
  under_utilized: number;
  due_soon: number;
  active_alerts: number;
  fleet_utilization_rate: number;
  avg_engine_hours: number;
  avg_idle_hours: number;
}

export interface DemandForecastItem {
  equipment_type: string;
  current_active_demand: number;
  historical_avg_demand: number;
  predicted_next_period_demand: number;
  trend_percentage: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  explanation: string;
}

export interface DemandForecastResponse {
  forecast_period: string;
  historical_months: string[];
  forecast_items: DemandForecastItem[];
}

export interface TypeTelemetry {
  total_engine_hours: number;
  total_idle_hours: number;
  total_fuel_usage: number;
  avg_daily_engine_hours: number;
  avg_daily_idle_hours: number;
  telemetry_utilization: number;
  idle_ratio: number;
  days_recorded: number;
}

export interface TypeTrendItem {
  date: string;
  engine_hours: number;
  idle_hours: number;
  fuel_usage: number;
  utilization: number;
}

export interface FleetMetrics {
  by_type: Record<string, {
    total: number;
    rented: number;
    available: number;
    avg_utilization: number;
  }>;
  by_status: Record<string, number>;
  utilization_distribution: {
    low: number;
    moderate: number;
    high: number;
  };
  recent_usage_trend: Array<{
    date: string;
    engine_hours: number;
    idle_hours: number;
    fuel_usage?: number;
  }>;
  by_type_trend?: Record<string, TypeTrendItem[]>;
  type_telemetry?: Record<string, TypeTelemetry>;
  multi_type_comparison?: Array<Record<string, any>>;
}

export interface CheckOutPayload {
  equipment_id: string;
  customer_id: string;
  site_id: string;
  operator_id?: string;
  rental_start_date?: string;
  expected_return_date: string;
}

export interface CheckInPayload {
  equipment_id: string;
  return_date?: string;
  condition?: string;
}

export interface UserAccount {
  id: number;
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

