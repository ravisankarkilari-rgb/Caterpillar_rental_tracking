import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '../../services/api';
import { Equipment } from '../../types';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEquipment: Equipment) => void;
}

const EQUIPMENT_TYPES = ['Excavator', 'Crane', 'Bulldozer', 'Grader', 'Loader'];

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentType, setEquipmentType] = useState('Excavator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId.trim()) {
      setError('Please enter a valid Equipment ID (e.g. EXQ1026)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.createEquipment({
        equipment_id: equipmentId.trim().toUpperCase(),
        equipment_type: equipmentType,
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Add New Equipment</h3>
              <p className="text-xs text-gray-400">Register new machine into fleet registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Equipment Asset ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              placeholder="e.g. EXQ1026"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400 uppercase"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">Unique asset tag number.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Equipment Category / Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
            >
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Adding...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
