import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SystemSetting } from '../types';
import { api, getErrorMessage } from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { isAdmin, userEmail, role } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const handleUpdateValue = (key: string, newValue: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
    );
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await api.updateSetting(key, value);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setSavingKey(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation password do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPassSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(getErrorMessage(err));
    } finally {
      setPassLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          message="System Settings modification is restricted to Caterpillar System Administrators (ADMIN)."
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gray-900/70 p-5 rounded-2xl border border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">System Settings & Configuration</h2>
            <p className="text-xs text-gray-400">
              Configure global system thresholds, telematics sync frequency, and account security credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Cards List (2 cols) */}
        <div className="lg:col-span-2 bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl p-6 space-y-4">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry & Thresholds</h3>
          </div>

          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : error ? (
            <EmptyState
              title="Error loading system settings"
              message={error}
              icon={AlertTriangle}
              actionLabel="Retry"
              onAction={fetchSettings}
            />
          ) : (
            <div className="space-y-3">
              {settings.map((item) => (
                <div
                  key={item.key}
                  className="p-4 bg-gray-950/70 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">{item.key}</span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium">{item.description || item.key}</p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Last updated: {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleUpdateValue(item.key, e.target.value)}
                      className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white font-mono w-44 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleSaveSetting(item.key, item.value)}
                      disabled={savingKey === item.key}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                    >
                      {savingKey === item.key ? (
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      ) : savedKey === item.key ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Password Management Card (1 col) */}
        <div className="bg-gray-900/70 rounded-2xl border border-gray-800 shadow-xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Password Facility</h3>
              <p className="text-xs text-gray-400">Update security password for active Admin account</p>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-gray-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{role} Account</span>
            </div>
            <p className="text-xs text-gray-300 font-mono">{userEmail || 'admin@caterpillar.com'}</p>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-gray-300 font-semibold block">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3.5 pr-10 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 font-semibold block">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3.5 pr-10 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 font-semibold block">Confirm New Password</label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {passLoading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Update Admin Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

