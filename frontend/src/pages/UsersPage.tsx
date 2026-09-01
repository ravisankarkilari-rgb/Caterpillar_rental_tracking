import React, { useEffect, useState } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, UserX, AlertTriangle, X, KeyRound } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { api, getErrorMessage } from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { ResetPasswordModal } from '../components/modals/ResetPasswordModal';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add User Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('MANAGER');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Status Toggle Confirmation Modal
  const [selectedUserForToggle, setSelectedUserForToggle] = useState<UserAccount | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Password Reset Modal
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<UserAccount | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      await api.createUser({
        user_id: newUserId,
        username: newUsername,
        email: newEmail,
        password: newPassword.trim() || undefined,
        role: newRole,
      });
      setIsAddOpen(false);
      setNewUserId('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('MANAGER');
      fetchUsers();
    } catch (err: any) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUserForToggle) return;
    setToggleLoading(true);
    try {
      const nextStatus = selectedUserForToggle.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api.toggleUserStatus(selectedUserForToggle.user_id, nextStatus);
      setSelectedUserForToggle(null);
      fetchUsers();
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleChangeRole = async (user: UserAccount, targetRole: UserRole) => {
    try {
      await api.updateUser(user.user_id, { role: targetRole });
      fetchUsers();
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          message="User Management is restricted to Caterpillar System Administrators (ADMIN)."
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gray-900/70 p-5 rounded-2xl border border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">System User Directory</h2>
            <p className="text-xs text-gray-400">
              Manage internal Caterpillar administrator and operational manager user accounts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyState
              title="Error loading user directory"
              message={error}
              icon={AlertTriangle}
              actionLabel="Retry"
              onAction={fetchUsers}
            />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/70 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User ID</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{u.user_id}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-200">{u.username}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                        className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <UserCheck className="w-3 h-3" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <UserX className="w-3 h-3" />
                          DISABLED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserForPasswordReset(u)}
                          title="Reset user password"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-colors"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>
                        <button
                          onClick={() => setSelectedUserForToggle(u)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors border ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="No user accounts found" message="Click Create User Account to add the first user." />
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Create System User</h3>
                  <p className="text-xs text-gray-400">Add a new authenticated user account</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">User ID</label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. USR_MGR03"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. jsmith"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. jsmith@caterpillar.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default: password123"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="MANAGER">MANAGER (Rental Operations)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                  <option value="VIEWER">VIEWER (Auditor / Read-Only)</option>
                </select>
              </div>

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
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable / Enable Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!selectedUserForToggle}
        title={`${selectedUserForToggle?.status === 'ACTIVE' ? 'Disable' : 'Enable'} User Account`}
        message={`Are you sure you want to ${selectedUserForToggle?.status === 'ACTIVE' ? 'disable' : 'enable'} account for ${selectedUserForToggle?.username} (${selectedUserForToggle?.email})?`}
        confirmLabel={`${selectedUserForToggle?.status === 'ACTIVE' ? 'Disable' : 'Enable'} User`}
        isDangerous={selectedUserForToggle?.status === 'ACTIVE'}
        isLoading={toggleLoading}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setSelectedUserForToggle(null)}
      />

      {/* Admin Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!selectedUserForPasswordReset}
        user={selectedUserForPasswordReset}
        onClose={() => setSelectedUserForPasswordReset(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};
