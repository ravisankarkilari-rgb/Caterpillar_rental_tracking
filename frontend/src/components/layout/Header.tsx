import React from 'react';
import { Menu, Scan, Shield, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { NavPage } from './Sidebar';

interface HeaderProps {
  currentPage: NavPage;
  onOpenScanner: () => void;
  onToggleMobileMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const PAGE_TITLES: Record<NavPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'High-level equipment overview, active rental status, and operational health',
  },
  equipment: {
    title: 'Equipment Fleet Directory',
    subtitle: 'Real-time telemetry, location assignment, and machine asset registry',
  },
  'check-in-out': {
    title: 'Equipment Check-in & Check-out',
    subtitle: 'Streamlined checkout assignment and return logging with condition checks',
  },
  alerts: {
    title: 'Alerts & Anomalies',
    subtitle: 'Prioritized operational exceptions, overdue notices, and usage irregularities',
  },
  analytics: {
    title: 'Fleet Analytics & Demand Forecasting',
    subtitle: 'Historical rental trends, utilization metrics, and predictive demand estimation',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenScanner,
  onToggleMobileMenu,
  onRefresh,
  isRefreshing = false,
}) => {
  const { role, setRole, logout, userEmail } = useAuth();
  const info = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-gray-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{info.title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">{info.subtitle}</p>
        </div>
      </div>

      {/* Right: Quick Actions & Role Switcher & Logout */}
      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh data"
            className="p-2 rounded-lg bg-gray-800/70 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        )}

        {/* Global QR/RFID Scanner Quick Trigger */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm group"
        >
          <Scan className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Scan Tag / ID</span>
        </button>

        {/* Role Selector */}
        <div className="flex items-center bg-gray-800/80 rounded-lg p-0.5 border border-gray-700 text-xs">
          <div className="px-2 py-1 flex items-center gap-1 text-gray-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-medium">Persona:</span>
          </div>
          {(['ADMIN', 'MANAGER', 'VIEWER'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                role === r
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          title="Sign out of system"
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-gray-800/70 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-gray-700/60 hover:border-rose-500/30 text-xs font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
