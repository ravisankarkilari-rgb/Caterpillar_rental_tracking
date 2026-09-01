import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  Activity,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  Fuel,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Alert, Equipment } from '../types';
import { api, getErrorMessage } from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

interface AlertsPageProps {
  onSelectEquipmentById: (equipmentId: string) => void;
  refreshTrigger?: number;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onSelectEquipmentById,
  refreshTrigger,
}) => {
  const { canResolveAlerts } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showResolved, setShowResolved] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts({ resolved: showResolved });
      setAlerts(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [showResolved, refreshTrigger]);

  const handleResolve = async (id: number) => {
    try {
      await api.resolveAlert(id, true);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && a.alert_type !== typeFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, typeFilter]);

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'CRITICAL' || type.includes('Overdue')) {
      return <AlertOctagon className="w-5 h-5 text-rose-400" />;
    }
    if (type.includes('Due Soon')) {
      return <Clock className="w-5 h-5 text-amber-400" />;
    }
    if (type.includes('Under-utilized') || type.includes('Idle')) {
      return <Activity className="w-5 h-5 text-orange-400" />;
    }
    if (type.includes('Fuel')) {
      return <Fuel className="w-5 h-5 text-rose-400" />;
    }
    if (type.includes('Unusual')) {
      return <TrendingDown className="w-5 h-5 text-sky-400" />;
    }
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Warning
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (Red)</option>
            <option value="WARNING">Warning (Orange/Yellow)</option>
            <option value="INFO">Info (Blue)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Alert Types</option>
            <option value="Overdue Rental">Overdue Rental</option>
            <option value="Return Due Soon">Return Due Soon</option>
            <option value="Under-utilized Equipment">Under-utilized</option>
            <option value="High Idle Time">High Idle Time</option>
            <option value="Unusual Usage">Unusual Usage Pattern</option>
            <option value="Abnormal Fuel Usage">Abnormal Fuel Usage</option>
          </select>
        </div>

        {/* Active vs Resolved toggle */}
        <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs">
          <button
            onClick={() => setShowResolved(false)}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              !showResolved
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Alerts
          </button>
          <button
            onClick={() => setShowResolved(true)}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              showResolved
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Resolved History
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <EmptyState
          title="Failed to load alerts"
          message={error}
          icon={AlertTriangle}
          actionLabel="Retry"
          onAction={fetchAlerts}
        />
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
              } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500/20'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-500/20'
                      : 'bg-blue-500/20'
                  }`}
                >
                  {getAlertIcon(alert.alert_type, alert.severity)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {alert.equipment_id}
                    </span>
                    {alert.equipment_type && (
                      <span className="text-xs text-gray-400">({alert.equipment_type})</span>
                    )}
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs text-gray-400 font-medium">
                      • {alert.alert_type}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-200">{alert.message}</p>

                  {alert.explanation && (
                    <p className="text-xs text-gray-400 bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/80 font-sans leading-relaxed">
                      <strong className="text-gray-300">Analysis:</strong> {alert.explanation}
                    </p>
                  )}

                  <span className="text-[10px] text-gray-500 font-mono block pt-1">
                    Logged at {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onSelectEquipmentById(alert.equipment_id)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 border border-gray-700"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Inspect
                </button>

                {!alert.resolved && canResolveAlerts && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You're all caught up"
          message={
            showResolved
              ? 'No resolved alert records matching criteria.'
              : 'No active alerts requiring attention right now.'
          }
          icon={CheckCircle2}
        />
      )}
    </div>
  );
};
