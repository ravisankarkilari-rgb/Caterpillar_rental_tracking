import React from 'react';
import {
  LayoutDashboard,
  Truck,
  ArrowLeftRight,
  Bell,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavPage = 'dashboard' | 'equipment' | 'check-in-out' | 'alerts' | 'analytics';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  alertCount?: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  alertCount = 0,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { role, displayName } = useAuth();

  const navItems: Array<{
    id: NavPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipment', label: 'Equipment', icon: Truck },
    { id: 'check-in-out', label: 'Check-in / Out', icon: ArrowLeftRight },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0F172A] border-r border-gray-800/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-black text-lg tracking-wider shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wide text-white uppercase">CATERPILLAR</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">PRO</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Smart Rental Tracking</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10 font-bold'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-black text-amber-400'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Role Card & System Info */}
        <div className="p-3 border-t border-gray-800/80 space-y-2 bg-[#0B0F17]/50">
          <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-gray-200 truncate">{displayName}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Role:</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded">
                {role}
              </span>
            </div>
          </div>

          <div className="px-2 text-[10px] text-gray-500 flex items-center justify-between">
            <span>Privacy-First Fleet Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
