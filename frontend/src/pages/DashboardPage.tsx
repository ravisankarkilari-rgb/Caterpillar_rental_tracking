import React, { useEffect, useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  Search,
  ArrowRight,
  Filter,
  Layers,
  AlertOctagon,
  Eye,
  Map,
  List,
} from 'lucide-react';
import { Equipment, DashboardSummary, Alert } from '../types';
import { api, getErrorMessage } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge, IgnitionBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { FleetMapView } from '../components/common/FleetMapView';

interface DashboardPageProps {
  onSelectEquipment: (equipment: Equipment) => void;
  onNavigateToAlerts: () => void;
  onNavigateToCheckOut: () => void;
  refreshTrigger?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectEquipment,
  onNavigateToAlerts,
  onNavigateToCheckOut,
  refreshTrigger,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, equipData, alertsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getEquipmentList(),
        api.getAlerts({ resolved: false }),
      ]);
      setSummary(sumData);
      setEquipmentList(equipData);
      setCriticalAlerts(alertsData.filter((a) => a.severity === 'CRITICAL' || a.alert_type === 'Overdue Rental'));
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.equipment_id.toLowerCase().includes(q) ||
          item.equipment_type.toLowerCase().includes(q) ||
          (item.customer_id && item.customer_id.toLowerCase().includes(q)) ||
          (item.site_id && item.site_id.toLowerCase().includes(q)) ||
          item.status.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (item.status.toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // Type Filter
      if (typeFilter !== 'ALL') {
        if (item.equipment_type.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [equipmentList, searchQuery, statusFilter, typeFilter]);

  if (loading && !summary) {
    return <LoadingSkeleton type="dashboard" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to load dashboard"
          message={error}
          icon={AlertTriangle}
          actionLabel="Retry"
          onAction={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LEVEL 1: OVERVIEW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total Equipment"
          value={summary?.total_equipment || 0}
          subtitle="Registered Fleet Units"
          icon={Layers}
          color="amber"
          onClick={() => {
            setStatusFilter('ALL');
            setTypeFilter('ALL');
          }}
        />
        <MetricCard
          title="Rented"
          value={summary?.rented || 0}
          subtitle="Currently on Site"
          icon={Truck}
          color="blue"
          onClick={() => setStatusFilter('RENTED')}
        />
        <MetricCard
          title="Available"
          value={summary?.available || 0}
          subtitle="Ready for Deployment"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setStatusFilter('AVAILABLE')}
        />
        <MetricCard
          title="Overdue"
          value={summary?.overdue || 0}
          subtitle="Requires Check-in"
          icon={Clock}
          color="rose"
          badge={summary?.overdue ? 'Action Needed' : undefined}
          onClick={() => setStatusFilter('OVERDUE')}
        />
        <MetricCard
          title="Under-utilized"
          value={summary?.under_utilized || 0}
          subtitle="High Idle / Low Engine"
          icon={Activity}
          color="orange"
          onClick={() => setStatusFilter('UNDER_UTILIZED')}
        />
      </div>

      {/* LEVEL 2: URGENT ALERTS STRIP (OVERVIEW -> ALERT) */}
      {criticalAlerts.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Critical Exceptions Detected ({criticalAlerts.length})
                </span>
              </div>
              <p className="text-xs text-rose-400/90 font-medium mt-0.5">
                {criticalAlerts[0]?.equipment_id}: {criticalAlerts[0]?.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                const target = equipmentList.find(
                  (e) => e.equipment_id === criticalAlerts[0]?.equipment_id
                );
                if (target) onSelectEquipment(target);
              }}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              Inspect {criticalAlerts[0]?.equipment_id}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToAlerts}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}

      {/* LEVEL 3: EQUIPMENT STATUS TABLE / MAP (DETAILS -> ACTION) */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {/* Table Filter & Search Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Equipment Status Directory
            </h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-mono">
              {filteredEquipment.length} units
            </span>

            {/* View Mode Toggle: Table / Map */}
            <div className="flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700 ml-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === 'map'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Map
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Type, Customer, Site..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-800/90 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2" />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="UNDER_UTILIZED">Under-utilized</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Types</option>
              <option value="Excavator">Excavator</option>
              <option value="Crane">Crane</option>
              <option value="Bulldozer">Bulldozer</option>
              <option value="Grader">Grader</option>
              <option value="Loader">Loader</option>
            </select>
          </div>
        </div>

        {/* Conditional: Table View or Map View */}
        {viewMode === 'map' ? (
          <div className="p-2">
            <FleetMapView
              equipmentList={filteredEquipment}
              onSelectEquipment={onSelectEquipment}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredEquipment.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Equipment ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Site</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs">
                  {filteredEquipment.map((item) => (
                    <tr
                      key={item.equipment_id}
                      onClick={() => onSelectEquipment(item)}
                      className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 group-hover:text-amber-300">
                        {item.equipment_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-200">{item.equipment_type}</td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {item.customer_id ? (
                          <span className="text-gray-300">{item.customer_id}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {item.site_id ? (
                          <span className="text-gray-300">{item.site_id}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={item.status} size="sm" />
                          <IgnitionBadge ignitionStatus={item.ignition_status} size="sm" />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-300">
                        {item.expected_return_date ? (
                          <span
                            className={
                              item.days_overdue > 0
                                ? 'text-rose-400 font-bold'
                                : item.days_remaining !== null && item.days_remaining <= 2
                                ? 'text-amber-400 font-semibold'
                                : 'text-gray-300'
                            }
                          >
                            {item.expected_return_date}
                            {item.days_overdue > 0 && ` (+${item.days_overdue}d)`}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEquipment(item);
                          }}
                          className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-800 transition-colors"
                          title="View Asset Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="No matching equipment"
                  message="Try adjusting your search terms or filter selections."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
