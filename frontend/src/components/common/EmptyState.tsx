import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  message = "You're all caught up. No active items in this view.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-900/40 rounded-xl border border-gray-800/80 my-4">
      <div className="p-3.5 rounded-2xl bg-gray-800/80 text-amber-400 mb-3.5 border border-gray-700/50">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-200">{title}</h3>
      <p className="mt-1 text-sm text-gray-400 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
