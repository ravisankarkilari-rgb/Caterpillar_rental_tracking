import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Clock,
  PieChart as PieIcon,
  BarChart2,
  AlertTriangle,
  Fuel,
  Cpu,
  Layers,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { FleetMetrics, DemandForecastResponse } from '../types';
import { api, getErrorMessage } from '../services/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',      // Emerald
  RENTED: '#3B82F6',         // Blue
  OVERDUE: '#F43F5E',        // Rose
  DUE_SOON: '#F59E0B',       // Amber
  UNDER_UTILIZED: '#F97316', // Orange
};

const CATEGORY_COLORS: Record<string, string> = {
  Excavator: '#F59E0B', // Amber
  Crane: '#3B82F6',     // Blue
  Bulldozer: '#10B981', // Emerald
  Grader: '#8B5CF6',    // Purple
  Loader: '#EC4899',    // Pink
};

export const AnalyticsPage: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [forecast, setForecast] = useState<DemandForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTelemetryType, setSelectedTelemetryType] = useState<string>('ALL');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, f] = await Promise.all([
        api.getFleetMetrics(),
        api.getDemandForecast(),
      ]);
      setMetrics(m);
      setForecast(f);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  if (loading && !metrics) {
    return <LoadingSkeleton rows={8} />;
  }

  if (error || !metrics || !forecast) {
    return (
      <EmptyState
        title="Failed to load fleet analytics"
        message={error || 'No analytics data available.'}
        icon={AlertTriangle}
        actionLabel="Retry"
        onAction={fetchAnalytics}
      />
    );
  }

  // Transform Type Summary for Bar Chart
  const typeChartData = Object.entries(metrics.by_type).map(([type, val]) => ({
    name: type,
    rented: val.rented,
    available: val.available,
    total: val.total,
    avg_utilization: val.avg_utilization,
  }));

  // Transform Status Data for Pie Chart
  const statusPieData = Object.entries(metrics.by_status).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    statusKey: status,
  }));

  // Transform Forecast for Comparison Chart
  const forecastChartData = forecast.forecast_items.map((item) => ({
    name: item.equipment_type,
    current: item.current_active_demand,
    historical: Math.round(item.historical_avg_demand),
    predicted: item.predicted_next_period_demand,
  }));

  // Per-type telemetry trend resolution
  const equipmentTypesList = ['Excavator', 'Crane', 'Bulldozer', 'Grader', 'Loader'];

  const getActiveTrendData = () => {
    if (selectedTelemetryType === 'COMPARE') {
      return metrics.multi_type_comparison || [];
    }
    if (selectedTelemetryType !== 'ALL' && metrics.by_type_trend?.[selectedTelemetryType]) {
      return metrics.by_type_trend[selectedTelemetryType];
    }
    return metrics.recent_usage_trend || [];
  };

  const activeTrendData = getActiveTrendData();

  return (
    <div className="space-y-6">
      {/* SECTION 1: EXPLAINABLE DEMAND FORECASTING */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Demand Forecasting & Allocation Planning
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  {forecast.forecast_period}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Explainable moving-average prediction based on past rental records and current site deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Table with Plain English Explainability */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase">
                <th className="py-3 px-3.5">Equipment Type</th>
                <th className="py-3 px-3.5 text-center">Current Active Demand</th>
                <th className="py-3 px-3.5 text-center">Historical Avg</th>
                <th className="py-3 px-3.5 text-center text-amber-400">Predicted Demand</th>
                <th className="py-3 px-3.5 text-center">Trend Growth</th>
                <th className="py-3 px-3.5">Forecasting Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {forecast.forecast_items.map((item) => (
                <tr key={item.equipment_type} className="hover:bg-gray-800/30">
                  <td className="py-3 px-3.5 font-bold text-white font-mono">
                    {item.equipment_type}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono text-gray-200">
                    <span className="px-2 py-0.5 bg-gray-800 rounded font-semibold">
                      {item.current_active_demand} units
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono text-gray-400">
                    {item.historical_avg_demand} units/mo
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono font-extrabold text-amber-400">
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      {item.predicted_next_period_demand} units
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`text-xs font-bold font-mono ${
                        item.trend_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.trend_percentage >= 0 ? `+${item.trend_percentage}%` : `${item.trend_percentage}%`}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-gray-300 text-[11px] max-w-md">
                    {item.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Equipment by Type & Deployment */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Equipment Deployment by Category</h3>
              <p className="text-xs text-gray-400">Rented vs Available units per type</p>
            </div>
            <BarChart2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="rented" name="Rented" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fleet Status Distribution */}
        <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Fleet Operational Status Breakdown</h3>
              <p className="text-xs text-gray-400">Current allocation health</p>
            </div>
            <PieIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.statusKey] || '#6B7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: FLEET TELEMETRY SEPARATED BY EQUIPMENT TYPE */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl space-y-6">
        {/* Header & Equipment Type Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Equipment-Type Telemetry Breakdown
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  14-Day Live Telemetry
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Detailed engine hours, idle hours, fuel usage, and utilization per equipment category.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setSelectedTelemetryType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTelemetryType === 'ALL'
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              All Fleet
            </button>
            {equipmentTypesList.map((eqType) => (
              <button
                key={eqType}
                onClick={() => setSelectedTelemetryType(eqType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTelemetryType === eqType
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: CATEGORY_COLORS[eqType] }}
                />
                {eqType}
              </button>
            ))}
            <button
              onClick={() => setSelectedTelemetryType('COMPARE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedTelemetryType === 'COMPARE'
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Compare All
            </button>
          </div>
        </div>

        {/* Per-Equipment-Type Summary Cards */}
        {metrics.type_telemetry && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {equipmentTypesList.map((eqType) => {
              const telem = metrics.type_telemetry?.[eqType];
              const summaryVal = metrics.by_type[eqType];
              const isSelected = selectedTelemetryType === eqType;
              const themeColor = CATEGORY_COLORS[eqType] || '#F59E0B';

              return (
                <div
                  key={eqType}
                  onClick={() => setSelectedTelemetryType(eqType)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gray-800/90 border-amber-400 shadow-lg shadow-amber-400/5 ring-1 ring-amber-400/30'
                      : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900/60'
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: themeColor }}
                  />

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-white font-mono">{eqType}</span>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                      {summaryVal ? `${summaryVal.rented}/${summaryVal.total} Rented` : 'Active'}
                    </span>
                  </div>

                  {telem ? (
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-amber-400" />
                            Engine
                          </span>
                          <span className="font-mono font-bold text-white">
                            {telem.total_engine_hours} hrs
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            Idle Ratio
                          </span>
                          <span
                            className={`font-mono font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                              telem.idle_ratio > 35
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {telem.idle_ratio}%
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-800/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-blue-400" />
                            Fuel Est.
                          </span>
                          <span className="font-mono text-gray-200">{telem.total_fuel_usage} L</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            Utilization
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {telem.telemetry_utilization}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-4">No telemetry logged</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Telemetry Line Chart */}
        <div className="bg-gray-950/70 rounded-xl border border-gray-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedTelemetryType === 'ALL' && 'Overall Fleet Telemetry Trend (Past 14 Days)'}
                {selectedTelemetryType === 'COMPARE' && 'Multi-Category Engine Hours Comparison (Past 14 Days)'}
                {selectedTelemetryType !== 'ALL' &&
                  selectedTelemetryType !== 'COMPARE' &&
                  `${selectedTelemetryType} Telemetry & Fuel Trajectory (Past 14 Days)`}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedTelemetryType === 'COMPARE'
                  ? 'Comparative daily engine run hours across all equipment categories'
                  : selectedTelemetryType === 'ALL'
                  ? 'Aggregated engine hours vs idle hours across entire rental fleet'
                  : `Isolated 14-day telemetry log specifically for ${selectedTelemetryType} units`}
              </p>
            </div>

            {selectedTelemetryType !== 'ALL' && (
              <button
                onClick={() => setSelectedTelemetryType('ALL')}
                className="text-xs text-amber-400 hover:underline font-semibold self-start sm:self-auto"
              >
                Reset to All Fleet
              </button>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {selectedTelemetryType === 'COMPARE' ? (
                /* Multi-Type Engine Hours Comparison Chart */
                <LineChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {equipmentTypesList.map((eqType) => (
                    <Line
                      key={eqType}
                      type="monotone"
                      dataKey={eqType}
                      name={`${eqType} Engine Hrs`}
                      stroke={CATEGORY_COLORS[eqType] || '#F59E0B'}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              ) : selectedTelemetryType !== 'ALL' ? (
                /* Specific Equipment Type Chart (Engine, Idle, Fuel, Utilization) */
                <LineChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="engine_hours"
                    name={`${selectedTelemetryType} Engine Hours`}
                    stroke={CATEGORY_COLORS[selectedTelemetryType] || '#F59E0B'}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="idle_hours"
                    name="Idle Hours"
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fuel_usage"
                    name="Fuel Usage (L)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    name="Utilization %"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              ) : (
                /* All Fleet Aggregated Chart */
                <LineChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="engine_hours"
                    name="Fleet Engine Hours"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="idle_hours"
                    name="Fleet Idle Hours"
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Per-Equipment-Type Telemetry Table */}
        {metrics.type_telemetry && (
          <div className="overflow-x-auto pt-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Fleet Telemetry Comparative Metrics Matrix
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-950/90 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase">
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5 text-center">Fleet Count</th>
                  <th className="py-3 px-3.5 text-center">Total Engine Hours</th>
                  <th className="py-3 px-3.5 text-center">Daily Engine Avg</th>
                  <th className="py-3 px-3.5 text-center">Total Idle Hours</th>
                  <th className="py-3 px-3.5 text-center">Idle Ratio</th>
                  <th className="py-3 px-3.5 text-center">Est. Fuel Usage</th>
                  <th className="py-3 px-3.5 text-center text-emerald-400">Telemetry Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {equipmentTypesList.map((eqType) => {
                  const telem = metrics.type_telemetry?.[eqType];
                  const summaryVal = metrics.by_type[eqType];
                  if (!telem) return null;

                  return (
                    <tr
                      key={eqType}
                      onClick={() => setSelectedTelemetryType(eqType)}
                      className="hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5 font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: CATEGORY_COLORS[eqType] }}
                        />
                        {eqType}
                      </td>
                      <td className="py-3 px-3.5 text-center text-gray-300">
                        {summaryVal?.total || 0} units
                      </td>
                      <td className="py-3 px-3.5 text-center text-amber-400 font-extrabold">
                        {telem.total_engine_hours} hrs
                      </td>
                      <td className="py-3 px-3.5 text-center text-gray-300">
                        {telem.avg_daily_engine_hours} hrs/day
                      </td>
                      <td className="py-3 px-3.5 text-center text-gray-400">
                        {telem.total_idle_hours} hrs
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            telem.idle_ratio > 35
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {telem.idle_ratio}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center text-blue-400">
                        {telem.total_fuel_usage} L
                      </td>
                      <td className="py-3 px-3.5 text-center text-emerald-400 font-extrabold">
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          {telem.telemetry_utilization}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: DEMAND COMPARISON CHART */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Historical vs. Predicted Demand Trajectory</h3>
            <p className="text-xs text-gray-400">Demand trajectory comparison across equipment types</p>
          </div>
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="historical" name="Historical Average" fill="#6B7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="Current Active" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted" name="Predicted Next Period" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

