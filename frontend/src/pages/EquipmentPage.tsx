import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  QrCode,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Equipment } from '../types';
import { api, getErrorMessage } from '../services/api';
import { StatusBadge, IgnitionBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { AddEquipmentModal } from '../components/modals/AddEquipmentModal';
import { EditEquipmentModal } from '../components/modals/EditEquipmentModal';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { QRCodeDisplayModal } from '../components/common/QRCodeDisplayModal';
import { useAuth } from '../context/AuthContext';

interface EquipmentPageProps {
  onSelectEquipment: (equipment: Equipment) => void;
  onStartCheckIn?: (equipment: Equipment) => void;
  onStartCheckOut?: (equipment: Equipment) => void;
  refreshTrigger?: number;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({
  onSelectEquipment,
  onStartCheckIn,
  onStartCheckOut,
  refreshTrigger,
}) => {
  const { isAdmin, isManager, isViewer, canCreateEquipment } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deactivatingEquipment, setDeactivatingEquipment] = useState<Equipment | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [qrEquipment, setQrEquipment] = useState<Equipment | null>(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEquipmentList();
      setEquipmentList(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [refreshTrigger]);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingEquipment) return;
    setDeactivateLoading(true);
    try {
      await api.deactivateEquipment(deactivatingEquipment.equipment_id);
      setDeactivatingEquipment(null);
      fetchEquipment();
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setDeactivateLoading(false);
    }
  };

  const filteredList = useMemo(() => {
    return equipmentList.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          item.equipment_id.toLowerCase().includes(q) ||
          item.equipment_type.toLowerCase().includes(q) ||
          (item.customer_id && item.customer_id.toLowerCase().includes(q)) ||
          (item.site_id && item.site_id.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (typeFilter !== 'ALL' && item.equipment_type.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      if (statusFilter !== 'ALL' && item.status.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }

      return true;
    });
  }, [equipmentList, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Equipment ID, Type, Customer, Site..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800/90 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Categories</option>
            <option value="Excavator">Excavators</option>
            <option value="Crane">Cranes</option>
            <option value="Bulldozer">Bulldozers</option>
            <option value="Grader">Graders</option>
            <option value="Loader">Loaders</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="UNDER_UTILIZED">Under-utilized</option>
          </select>
        </div>

        {/* Right: Add Asset button (ADMIN only) */}
        {canCreateEquipment && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md self-end md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Asset
          </button>
        )}
      </div>

      {/* Equipment Table */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={8} />
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyState
              title="Error loading equipment"
              message={error}
              icon={AlertTriangle}
              actionLabel="Retry"
              onAction={fetchEquipment}
            />
          </div>
        ) : filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/70 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Equipment ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Site ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Rental Start</th>
                  <th className="py-3.5 px-4">Expected Return</th>
                  <th className="py-3.5 px-4">Utilization</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {filteredList.map((item) => {
                  const isRentedOrOverdue = item.status === 'RENTED' || item.status === 'OVERDUE' || item.status === 'DUE_SOON';

                  return (
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
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {item.rental_start_date || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono">
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
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.utilization_percentage < 30
                                  ? 'bg-orange-500'
                                  : item.utilization_percentage < 70
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(item.utilization_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-mono text-gray-300">
                            {item.utilization_percentage}%
                          </span>
                        </div>
                      </td>

                      {/* ROLE-SPECIFIC ROW ACTIONS */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Common View Button */}
                          <button
                            onClick={() => onSelectEquipment(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                            title="View Asset Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* ADMIN Action Buttons: [Edit] [Deactivate] */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingEquipment(item)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1"
                                title="Edit Equipment Master Info"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setDeactivatingEquipment(item)}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1"
                                title="Deactivate Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </button>
                            </>
                          )}

                          {/* MANAGER Action Buttons: [Check-In] or [Check-Out] */}
                          {isManager && (
                            <>
                              {isRentedOrOverdue ? (
                                <button
                                  onClick={() => onStartCheckIn && onStartCheckIn(item)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                  title="Check In Equipment"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Check-In</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onStartCheckOut && onStartCheckOut(item)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                  title="Check Out Equipment"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>Check-Out</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* QR Tag Button */}
                          <button
                            onClick={() => setQrEquipment(item)}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors ml-1"
                            title="Generate QR Tag"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No equipment matches your filters"
              message="Try changing the type, status, or search keywords."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
            />
          </div>
        )}
      </div>

      {/* Add Equipment Modal (Admin) */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newEquip) => {
          fetchEquipment();
          onSelectEquipment(newEquip);
        }}
      />

      {/* Edit Equipment Modal (Admin) */}
      <EditEquipmentModal
        isOpen={!!editingEquipment}
        equipment={editingEquipment}
        onClose={() => setEditingEquipment(null)}
        onSuccess={() => {
          fetchEquipment();
        }}
      />

      {/* Deactivate Confirmation Modal (Admin) */}
      <ConfirmationModal
        isOpen={!!deactivatingEquipment}
        title="Deactivate Equipment Asset"
        message={`Are you sure you want to deactivate asset ${deactivatingEquipment?.equipment_id}? Deactivating will flag the asset as inactive in the Caterpillar fleet registry.`}
        confirmLabel="Deactivate Asset"
        isDangerous={true}
        isLoading={deactivateLoading}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDeactivatingEquipment(null)}
      />

      {/* QR Code Tag Modal */}
      <QRCodeDisplayModal
        isOpen={!!qrEquipment}
        equipment={qrEquipment}
        onClose={() => setQrEquipment(null)}
      />
    </div>
  );
};
