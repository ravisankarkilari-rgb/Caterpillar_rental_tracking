import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  Activity,
  AlertTriangle,
  QrCode,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Zap,
  Power,
  Key,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Equipment, UsageLog } from '../../types';
import { StatusBadge, IgnitionBadge } from '../common/StatusBadge';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface EquipmentDetailDrawerProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckInClick?: (equipment: Equipment) => void;
  onCheckOutClick?: (equipment: Equipment) => void;
  onViewQrClick?: (equipment: Equipment) => void;
  onEquipmentUpdated?: (equipment: Equipment) => void;
}

export const EquipmentDetailDrawer: React.FC<EquipmentDetailDrawerProps> = ({
  equipment,
  isOpen,
  onClose,
  onCheckInClick,
  onCheckOutClick,
  onViewQrClick,
  onEquipmentUpdated,
}) => {
  const { canManageRentals } = useAuth();
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && equipment) {
      setLoadingLogs(true);
      api
        .getEquipmentLogs(equipment.equipment_id, 14)
        .then((data) => {
          setLogs(data.reverse()); // chronological order for chart
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingLogs(false));
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const chartData = logs.map((l) => ({
    date: l.date.slice(5), // MM-DD
    engine: l.engine_hours,
    idle: l.idle_hours,
  }));

  const isRented = equipment.status !== 'AVAILABLE';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-wide font-mono">
                  {equipment.equipment_id}
                </h2>
                <StatusBadge status={equipment.status} size="sm" />
                <IgnitionBadge ignitionStatus={equipment.ignition_status} size="sm" />
              </div>
              <p className="text-xs text-gray-400 font-medium">{equipment.equipment_type} Asset Details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewQrClick && onViewQrClick(equipment)}
              title="View QR Code"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Overdue / Due Soon Alert Banner */}
          {equipment.days_overdue > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-300">
                  Rental Overdue by {equipment.days_overdue} day{equipment.days_overdue > 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-rose-400/90 mt-0.5">
                  Expected return was scheduled on {equipment.expected_return_date}. Action required.
                </p>
              </div>
            </div>
          )}

          {equipment.status === 'UNDER_UTILIZED' && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-orange-300">Low Utilization Detected</h4>
                <p className="text-xs text-orange-400/90 mt-0.5">
                  Machine has high idle hours ({equipment.idle_hours_per_day}h/day) compared to productive runtime ({equipment.engine_hours_per_day}h/day).
                </p>
              </div>
            </div>
          )}

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gray-800/60 rounded-xl border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Utilization
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {equipment.utilization_percentage}%
              </span>
              <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    equipment.utilization_percentage < 30
                      ? 'bg-orange-500'
                      : equipment.utilization_percentage < 70
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(equipment.utilization_percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3.5 bg-gray-800/60 rounded-xl border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Engine Hrs/Day
              </span>
              <span className="text-xl font-extrabold text-amber-400 mt-1 block">
                {equipment.engine_hours_per_day}h
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">Avg daily runtime</span>
            </div>

            <div className="p-3.5 bg-gray-800/60 rounded-xl border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Idle Hrs/Day
              </span>
              <span className="text-xl font-extrabold text-gray-300 mt-1 block">
                {equipment.idle_hours_per_day}h
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">Non-productive</span>
            </div>

            <div className="p-3.5 bg-gray-800/60 rounded-xl border border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Active Days
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {equipment.operating_days}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">Logged telemetry</span>
            </div>
          </div>

          {/* Assignment Information (Privacy Compliant Anonymized IDs) */}
          <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-800 space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Assignment & Rental Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 block">Customer ID:</span>
                  <span className="font-mono font-semibold text-gray-200">
                    {equipment.customer_id || 'Not Assigned (Available)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 block">Assigned Site:</span>
                  <span className="font-mono font-semibold text-gray-200">
                    {equipment.site_id || 'Depot Fleet Yard'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 block">Rental Start:</span>
                  <span className="font-mono text-gray-200">
                    {equipment.rental_start_date || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 block">Expected Return:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {equipment.expected_return_date || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MACHINE ENGINE & IGNITION TELEMETRY MONITOR (READ-ONLY) */}
          <div className="p-4 bg-gray-850/80 rounded-xl border border-gray-800 space-y-3 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-850 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${equipment.ignition_status === 'ON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    Machine Engine Status
                    <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                      <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                      Cat Product Link™
                    </span>
                  </h3>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5">
                {equipment.ignition_status === 'ON' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Ignition On (Operating)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Ignition Off (Not Operating)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-800 text-xs">
              {equipment.ignition_status === 'ON' ? (
                <div className="flex items-start gap-2 text-gray-300">
                  <span className="text-emerald-400 font-bold shrink-0">● Active:</span>
                  <span>Machine engine is actively running and operating on site. Live sensor telemetry (engine hours, idle hours, fuel usage) is currently being transmitted.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-gray-400">
                  <span className="text-rose-400 font-bold shrink-0">● Inactive:</span>
                  <span>Machine engine is turned off and not operating. Equipment is parked, between shifts, or in maintenance.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
              <span>Source: On-board ECM & Product Link™ IoT Sensors</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Telemetry Live
              </span>
            </div>
          </div>

          {/* 14-Day Telemetry Chart */}
          <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  14-Day Telemetry Profile
                </h3>
                <p className="text-[11px] text-gray-400">Daily Engine vs. Idle Hours</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Total: {equipment.total_engine_hours}h Run / {equipment.total_idle_hours}h Idle
              </span>
            </div>

            {loadingLogs ? (
              <div className="h-44 flex items-center justify-center text-xs text-gray-500">
                Loading telemetry logs...
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="engineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="idleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B7280" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6B7280" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} />
                    <YAxis stroke="#4B5563" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Area
                      type="monotone"
                      dataKey="engine"
                      name="Engine Hours"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#engineGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="idle"
                      name="Idle Hours"
                      stroke="#9CA3AF"
                      fillOpacity={1}
                      fill="url(#idleGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-gray-500">
                No telemetry recorded for this equipment.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>

          {canManageRentals && (
            <div>
              {isRented ? (
                <button
                  onClick={() => onCheckInClick && onCheckInClick(equipment)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Check In Equipment
                </button>
              ) : (
                <button
                  onClick={() => onCheckOutClick && onCheckOutClick(equipment)}
                  className="px-5 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                  Check Out Equipment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
