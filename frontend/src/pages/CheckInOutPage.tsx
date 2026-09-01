import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Scan,
  AlertCircle,
  Clock,
  History,
  Check,
  Building,
  MapPin,
  User,
  Calendar,
} from 'lucide-react';
import {
  Equipment,
  Customer,
  Site,
  Operator,
  RentalRecord,
  CheckOutPayload,
  CheckInPayload,
} from '../types';
import { api, getErrorMessage } from '../services/api';
import { SimulatedScannerModal } from '../components/common/SimulatedScannerModal';
import { useAuth } from '../context/AuthContext';

interface CheckInOutPageProps {
  initialEquipmentId?: string;
  initialMode?: 'checkout' | 'checkin';
  onOperationSuccess?: (equipment: Equipment) => void;
  refreshTrigger?: number;
}

export const CheckInOutPage: React.FC<CheckInOutPageProps> = ({
  initialEquipmentId = '',
  initialMode = 'checkout',
  onOperationSuccess,
  refreshTrigger,
}) => {
  const { canManageRentals } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin'>(initialMode);

  // Entities for dropdowns
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [rentedEquipment, setRentedEquipment] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [recentHistory, setRecentHistory] = useState<RentalRecord[]>([]);

  // Check-out Form State
  const [coEquipmentId, setCoEquipmentId] = useState(initialEquipmentId);
  const [coCustomerId, setCoCustomerId] = useState('');
  const [coSiteId, setCoSiteId] = useState('');
  const [coOperatorId, setCoOperatorId] = useState('');
  const [coStartDate, setCoStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [coReturnDate, setCoReturnDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  // Check-in Form State
  const [ciEquipmentId, setCiEquipmentId] = useState(initialEquipmentId);
  const [ciReturnDate, setCiReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [ciCondition, setCiCondition] = useState('Good');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (initialEquipmentId) {
      setCoEquipmentId(initialEquipmentId);
      setCiEquipmentId(initialEquipmentId);
    }
  }, [initialEquipmentId]);

  const loadData = async () => {
    try {
      const [allEquip, custList, siteList, opList, hist] = await Promise.all([
        api.getEquipmentList(),
        api.getCustomers(),
        api.getSites(),
        api.getOperators(),
        api.getRentalHistory(),
      ]);

      const avail = allEquip.filter((e) => e.status === 'AVAILABLE');
      const rented = allEquip.filter((e) => e.status !== 'AVAILABLE');

      setAvailableEquipment(avail);
      setRentedEquipment(rented);
      setCustomers(custList);
      setSites(siteList);
      setOperators(opList);
      setRecentHistory(hist.slice(0, 8));

      // Set default customer / site if empty
      if (custList.length > 0 && !coCustomerId) setCoCustomerId(custList[0].customer_id);
      if (siteList.length > 0 && !coSiteId) setCoSiteId(siteList[0].site_id);
      if (opList.length > 0 && !coOperatorId) setCoOperatorId(opList[0].operator_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleScanResult = (scannedId: string) => {
    if (activeTab === 'checkout') {
      setCoEquipmentId(scannedId);
    } else {
      setCiEquipmentId(scannedId);
    }
  };

  // CHECK OUT SUBMIT
  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRentals) {
      setError('Viewer role is read-only. Switch to Manager or Admin persona to perform check-out.');
      return;
    }

    if (!coEquipmentId.trim() || !coCustomerId || !coSiteId || !coReturnDate) {
      setError('Please complete all required fields for check-out.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: CheckOutPayload = {
        equipment_id: coEquipmentId.trim().toUpperCase(),
        customer_id: coCustomerId,
        site_id: coSiteId,
        operator_id: coOperatorId || undefined,
        rental_start_date: coStartDate,
        expected_return_date: coReturnDate,
      };

      const result = await api.checkout(payload);
      setSuccessMsg(
        `Equipment ${result.equipment_id} successfully checked out to ${result.customer_id} at ${result.site_id}. Status updated to RENTED.`
      );
      setCoEquipmentId('');
      loadData();
      if (onOperationSuccess) onOperationSuccess(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // CHECK IN SUBMIT
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRentals) {
      setError('Viewer role is read-only. Switch to Manager or Admin persona to perform check-in.');
      return;
    }

    if (!ciEquipmentId.trim()) {
      setError('Please enter or scan an Equipment ID to check in.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: CheckInPayload = {
        equipment_id: ciEquipmentId.trim().toUpperCase(),
        return_date: ciReturnDate,
        condition: ciCondition,
      };

      const result = await api.checkin(payload);
      setSuccessMsg(
        `Equipment ${result.equipment_id} successfully returned in "${ciCondition}" condition. Status updated to AVAILABLE.`
      );
      setCiEquipmentId('');
      loadData();
      if (onOperationSuccess) onOperationSuccess(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 w-full max-w-md mx-auto shadow-lg">
        <button
          onClick={() => {
            setActiveTab('checkout');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'checkout'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Check-Out Equipment
        </button>

        <button
          onClick={() => {
            setActiveTab('checkin');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'checkin'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Check-In Equipment
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="font-bold">Transaction Failed:</span> {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-300 animate-fade-in">
          <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <span className="font-bold">Success:</span> {successMsg}
          </div>
        </div>
      )}

      {/* Main Operations Card */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        {activeTab === 'checkout' ? (
          /* ================= CHECK OUT FORM ================= */
          <form onSubmit={handleCheckOutSubmit} className="space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Check Out Equipment to Customer Site
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Assign an available equipment asset to an anonymized customer account and job site.
              </p>
            </div>

            {/* Quick Available Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Quick Select Available Fleet Asset:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableEquipment.length > 0 ? (
                  availableEquipment.map((eq) => (
                    <button
                      key={eq.equipment_id}
                      type="button"
                      onClick={() => setCoEquipmentId(eq.equipment_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        coEquipmentId === eq.equipment_id
                          ? 'bg-amber-400 text-black font-bold border-amber-400'
                          : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {eq.equipment_id} ({eq.equipment_type})
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No equipment currently available.</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Equipment ID with Scanner button */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Equipment ID <span className="text-amber-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coEquipmentId}
                    onChange={(e) => setCoEquipmentId(e.target.value)}
                    placeholder="e.g. EXQ1004"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Simulate QR / RFID Scan"
                  >
                    <Scan className="w-4 h-4" />
                    Scan
                  </button>
                </div>
              </div>

              {/* Customer ID */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Customer ID <span className="text-amber-400">*</span>
                </label>
                <select
                  value={coCustomerId}
                  onChange={(e) => setCoCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site ID */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Job Site ID <span className="text-amber-400">*</span>
                </label>
                <select
                  value={coSiteId}
                  onChange={(e) => setCoSiteId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator ID */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Assigned Operator ID (Optional)
                </label>
                <select
                  value={coOperatorId}
                  onChange={(e) => setCoOperatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="">-- None / Self-Operated --</option>
                  {operators.map((o) => (
                    <option key={o.operator_id} value={o.operator_id}>
                      {o.operator_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rental Start Date */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Rental Start Date <span className="text-amber-400">*</span>
                </label>
                <input
                  type="date"
                  value={coStartDate}
                  onChange={(e) => setCoStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              {/* Expected Return Date */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Expected Return Date <span className="text-amber-400">*</span>
                </label>
                <input
                  type="date"
                  value={coReturnDate}
                  onChange={(e) => setCoReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing Checkout...' : '[ CHECK OUT EQUIPMENT ]'}
              </button>
            </div>
          </form>
        ) : (
          /* ================= CHECK IN FORM ================= */
          <form onSubmit={handleCheckInSubmit} className="space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Check In Equipment Return
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Process returning equipment, log physical condition, and return status to AVAILABLE.
              </p>
            </div>

            {/* Quick Rented Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Select Rented / Overdue Asset to Return:
              </span>
              <div className="flex flex-wrap gap-2">
                {rentedEquipment.length > 0 ? (
                  rentedEquipment.map((eq) => (
                    <button
                      key={eq.equipment_id}
                      type="button"
                      onClick={() => setCiEquipmentId(eq.equipment_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        ciEquipmentId === eq.equipment_id
                          ? 'bg-emerald-500 text-white font-bold border-emerald-400'
                          : eq.status === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {eq.equipment_id} ({eq.equipment_type}) {eq.status === 'OVERDUE' && '⚠️ OVERDUE'}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No rented equipment pending return.</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Equipment ID */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Equipment ID <span className="text-emerald-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ciEquipmentId}
                    onChange={(e) => setCiEquipmentId(e.target.value)}
                    placeholder="e.g. EXQ1003"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Simulate QR / RFID Scan"
                  >
                    <Scan className="w-4 h-4" />
                    Scan
                  </button>
                </div>
              </div>

              {/* Return Date */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Actual Return Date <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="date"
                  value={ciReturnDate}
                  onChange={(e) => setCiReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  required
                />
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Equipment Condition <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={ciCondition}
                  onChange={(e) => setCiCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="Excellent">Excellent - Factory Clean</option>
                  <option value="Good">Good - Standard Wear</option>
                  <option value="Requires Wash / Cleaning">Requires Wash / Cleaning</option>
                  <option value="Requires Maintenance Inspection">Requires Maintenance Inspection</option>
                  <option value="Damaged - Repair Needed">Damaged - Repair Needed</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing Return...' : '[ CHECK IN EQUIPMENT ]'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent Rental Transactions Table */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl overflow-hidden p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Recent Transaction Log
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">Real-time audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase">
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Site</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">Expected Return</th>
                <th className="py-2.5 px-3">Check-in Date</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {recentHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-800/30">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                    {rec.equipment_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-300">{rec.customer_id}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-300">{rec.site_id}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{rec.check_out_date}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{rec.expected_return_date}</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{rec.check_in_date || '—'}</td>
                  <td className="py-2.5 px-3 text-gray-300">{rec.condition || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        rec.status === 'ACTIVE'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Scanner Modal */}
      <SimulatedScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
      />
    </div>
  );
};
