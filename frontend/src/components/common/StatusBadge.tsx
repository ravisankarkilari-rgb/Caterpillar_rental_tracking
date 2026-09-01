import React from 'react';
import { EquipmentStatus } from '../../types';

interface StatusBadgeProps {
  status: EquipmentStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const normStatus = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  }[size];

  switch (normStatus) {
    case 'AVAILABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Available
        </span>
      );

    case 'RENTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Rented
        </span>
      );

    case 'OVERDUE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold animate-pulse ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Overdue
        </span>
      );

    case 'DUE_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Due Soon
        </span>
      );

    case 'UNDER_UTILIZED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          Under-utilized
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 ${sizeClasses} ${className}`}
        >
          {status}
        </span>
      );
  }
};

export const IgnitionBadge: React.FC<{
  ignitionStatus?: 'ON' | 'OFF' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ ignitionStatus = 'OFF', size = 'sm', className = '' }) => {
  const isOn = (ignitionStatus || '').toUpperCase() === 'ON';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-all ${sizeClasses} ${className} ${
        isOn
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'bg-rose-500/10 text-rose-300/90 border-rose-500/30'
      }`}
      title={isOn ? 'Engine Ignition: ON (Machine is running)' : 'Engine Ignition: OFF (Machine is immobilized)'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
      {isOn ? 'Ignition On' : 'Ignition Off'}
    </span>
  );
};

