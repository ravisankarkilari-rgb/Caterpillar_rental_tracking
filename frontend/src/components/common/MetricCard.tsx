import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'amber' | 'blue' | 'emerald' | 'rose' | 'orange' | 'purple';
  onClick?: () => void;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'amber',
  onClick,
  badge,
}) => {
  const colorStyles = {
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/20',
      iconText: 'text-amber-400',
      valText: 'text-amber-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/50',
      iconBg: 'bg-blue-500/20',
      iconText: 'text-blue-400',
      valText: 'text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/20',
      iconText: 'text-emerald-400',
      valText: 'text-emerald-400',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30 hover:border-rose-500/60',
      iconBg: 'bg-rose-500/20',
      iconText: 'text-rose-400',
      valText: 'text-rose-400',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20 hover:border-orange-500/50',
      iconBg: 'bg-orange-500/20',
      iconText: 'text-orange-400',
      valText: 'text-orange-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/20',
      iconText: 'text-purple-400',
      valText: 'text-purple-400',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 border transition-all duration-200 ${colorStyles.bg} ${colorStyles.border} ${
        onClick ? 'cursor-pointer transform hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${colorStyles.iconBg}`}>
          <Icon className={`w-5 h-5 ${colorStyles.iconText}`} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
};
