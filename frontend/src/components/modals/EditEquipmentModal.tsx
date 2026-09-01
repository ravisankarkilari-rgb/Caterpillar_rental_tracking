import React, { useState, useEffect } from 'react';
import { X, Edit, AlertCircle } from 'lucide-react';
import { Equipment } from '../../types';
import { api, getErrorMessage } from '../../services/api';

interface EditEquipmentModalProps {
  isOpen: boolean;
  equipment: Equipment | null;
  onClose: () => void;
  onSuccess: (updated: Equipment) => void;
}

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  isOpen,
  equipment,
  onClose,
  onSuccess,
}) => {
  const [equipmentType, setEquipmentType] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (equipment) {
      setEquipmentType(equipment.equipment_type);
      setCustomerId(equipment.customer_id || '');
      setSiteId(equipment.site_id || '');
      setOperatorId(equipment.operator_id || '');
      setRentalStartDate(equipment.rental_start_date || '');
      setExpectedReturnDate(equipment.expected_return_date || '');
      setStatus(equipment.status);
      setError(null);
    }
  }, [equipment, isOpen]);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await api.updateEquipment(equipment.equipment_id, {
        equipment_type: equipmentType,
        customer_id: customerId,
        site_id: siteId,
        operator_id: operatorId,
        rental_start_date: rentalStartDate || undefined,
        expected_return_date: expectedReturnDate || undefined,
        status: status,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Edit Master: {equipment.equipment_id}
              </h3>
              <p className="text-xs text-gray-400">ADMIN System Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Equipment Type</label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Excavator">Excavator</option>
                <option value="Crane">Crane</option>
                <option value="Bulldozer">Bulldozer</option>
                <option value="Grader">Grader</option>
                <option value="Loader">Loader</option>
              </select>
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">Equipment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RENTED">RENTED</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="DUE_SOON">DUE_SOON</option>
                <option value="UNDER_UTILIZED">UNDER_UTILIZED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Customer ID</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. CUST001"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">Site ID</label>
              <input
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="e.g. SITE003"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">Operator ID</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="e.g. OP101"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 font-semibold block mb-1">Rental Start Date</label>
              <input
                type="date"
                value={rentalStartDate}
                onChange={(e) => setRentalStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-gray-300 font-semibold block mb-1">Expected Return Date</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
