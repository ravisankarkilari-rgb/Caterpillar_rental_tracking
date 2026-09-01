import React, { useState } from 'react';
import { KeyRound, X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../../types';
import { api, getErrorMessage } from '../../services/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetUserPassword(user.user_id, newPassword);
      setSuccessMessage(res.message || `Password for ${user.username} reset successfully.`);
      setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Admin Reset Password</h3>
              <p className="text-xs text-gray-400">
                Reset password for <span className="text-amber-400 font-mono">{user.username}</span> ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-semibold block mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full pl-3 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-1">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl font-mono text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-800 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
