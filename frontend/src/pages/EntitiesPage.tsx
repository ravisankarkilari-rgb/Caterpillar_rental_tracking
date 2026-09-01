import React, { useEffect, useState } from 'react';
import { Building2, MapPin, HardHat, Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { Customer, Site, Operator } from '../types';
import { api, getErrorMessage } from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

export type EntityTab = 'customers' | 'sites' | 'operators';

interface EntitiesPageProps {
  initialTab?: EntityTab;
}

export const EntitiesPage: React.FC<EntitiesPageProps> = ({ initialTab = 'customers' }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<EntityTab>(initialTab);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: EntityTab; id: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cList, sList, oList] = await Promise.all([
        api.getCustomers(),
        api.getSites(),
        api.getOperators(),
      ]);
      setCustomers(cList);
      setSites(sList);
      setOperators(oList);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      if (activeTab === 'customers') {
        await api.createCustomer({ customer_id: idInput, display_name: nameInput });
      } else if (activeTab === 'sites') {
        await api.createSite({ site_id: idInput, display_name: nameInput });
      } else {
        await api.createOperator({ operator_id: idInput });
      }
      setIsAddOpen(false);
      setIdInput('');
      setNameInput('');
      fetchAllData();
    } catch (err: any) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'customers') {
        await api.deleteCustomer(deleteTarget.id);
      } else if (deleteTarget.type === 'sites') {
        await api.deleteSite(deleteTarget.id);
      } else {
        await api.deleteOperator(deleteTarget.id);
      }
      setDeleteTarget(null);
      fetchAllData();
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sites'
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Sites ({sites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('operators')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'operators'
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Operators ({operators.length})</span>
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setIdInput('');
              setNameInput('');
              setAddError(null);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md self-end sm:self-auto uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyState
              title="Error loading directory"
              message={error}
              icon={AlertTriangle}
              actionLabel="Retry"
              onAction={fetchAllData}
            />
          </div>
        ) : activeTab === 'customers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/70 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Display / Account Name</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.customer_id}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-200">{c.display_name}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'customers', id: c.customer_id })}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'sites' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/70 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Site ID</th>
                  <th className="py-3.5 px-4">Project / Location Name</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {sites.map((s) => (
                  <tr key={s.site_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{s.site_id}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-200">{s.display_name}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'sites', id: s.site_id })}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/70 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Operator ID</th>
                  <th className="py-3.5 px-4">Classification</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {operators.map((o) => (
                  <tr key={o.operator_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{o.operator_id}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-300">Certified Caterpillar Operator</td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget({ type: 'operators', id: o.operator_id })}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Operator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Entity Modal (ADMIN) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-base font-bold capitalize">Add New {activeTab.slice(0, -1)}</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddEntity} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  {activeTab.slice(0, -1).toUpperCase()} ID
                </label>
                <input
                  type="text"
                  required
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder={
                    activeTab === 'customers'
                      ? 'e.g. CUST007'
                      : activeTab === 'sites'
                      ? 'e.g. SITE009'
                      : 'e.g. OP116'
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {activeTab !== 'operators' && (
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Display / Project Name</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Sobha Infrastructure Site 4"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white bg-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {addLoading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Add Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type.slice(0, -1)}`}
        message={`Are you sure you want to delete record ${deleteTarget?.id}?`}
        confirmLabel="Delete Record"
        isDangerous={true}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
