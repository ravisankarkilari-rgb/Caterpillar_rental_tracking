import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { CheckInOutPage } from './pages/CheckInOutPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EquipmentDetailDrawer } from './components/modals/EquipmentDetailDrawer';
import { QRCodeDisplayModal } from './components/common/QRCodeDisplayModal';
import { SimulatedScannerModal } from './components/common/SimulatedScannerModal';
import { Equipment } from './types';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [qrEquipment, setQrEquipment] = useState<Equipment | null>(null);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);

  // CheckInOut prefill state
  const [checkInOutTargetId, setCheckInOutTargetId] = useState('');
  const [checkInOutMode, setCheckInOutMode] = useState<'checkout' | 'checkin'>('checkout');

  // Active Alert count for sidebar badge
  const [alertCount, setAlertCount] = useState(0);

  const fetchAlertCount = async () => {
    if (!isAuthenticated) return;
    try {
      const alerts = await api.getAlerts({ resolved: false });
      setAlertCount(alerts.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlertCount();
    }
  }, [refreshTrigger, isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectEquipmentById = async (equipmentId: string) => {
    try {
      const equip = await api.getEquipmentById(equipmentId);
      setSelectedEquipment(equip);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScannerResult = async (scannedId: string) => {
    try {
      const equip = await api.getEquipmentById(scannedId);
      setSelectedEquipment(equip);
    } catch (err) {
      alert(`Equipment ${scannedId} not found in fleet registry.`);
    }
  };

  const handleStartCheckIn = (equip: Equipment) => {
    setSelectedEquipment(null);
    setCheckInOutTargetId(equip.equipment_id);
    setCheckInOutMode('checkin');
    setCurrentPage('check-in-out');
  };

  const handleStartCheckOut = (equip: Equipment) => {
    setSelectedEquipment(null);
    setCheckInOutTargetId(equip.equipment_id);
    setCheckInOutMode('checkout');
    setCurrentPage('check-in-out');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          // clear one-time prefill on manual tab navigation
          setCheckInOutTargetId('');
        }}
        alertCount={alertCount}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          currentPage={currentPage}
          onOpenScanner={() => setIsGlobalScannerOpen(true)}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          onRefresh={triggerRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onSelectEquipment={setSelectedEquipment}
              onNavigateToAlerts={() => setCurrentPage('alerts')}
              onNavigateToCheckOut={() => {
                setCheckInOutMode('checkout');
                setCurrentPage('check-in-out');
              }}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'equipment' && (
            <EquipmentPage
              onSelectEquipment={setSelectedEquipment}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'check-in-out' && (
            <CheckInOutPage
              initialEquipmentId={checkInOutTargetId}
              initialMode={checkInOutMode}
              onOperationSuccess={() => {
                triggerRefresh();
              }}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              onSelectEquipmentById={handleSelectEquipmentById}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsPage refreshTrigger={refreshTrigger} />
          )}
        </main>
      </div>

      {/* Equipment Detail Modal/Drawer */}
      <EquipmentDetailDrawer
        equipment={selectedEquipment}
        isOpen={!!selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
        onCheckInClick={handleStartCheckIn}
        onCheckOutClick={handleStartCheckOut}
        onViewQrClick={(eq) => setQrEquipment(eq)}
        onEquipmentUpdated={(updated) => {
          setSelectedEquipment(updated);
          triggerRefresh();
        }}
      />

      {/* QR Code Tag Modal */}
      <QRCodeDisplayModal
        equipment={qrEquipment}
        isOpen={!!qrEquipment}
        onClose={() => setQrEquipment(null)}
      />

      {/* Global Simulated QR/RFID Scanner */}
      <SimulatedScannerModal
        isOpen={isGlobalScannerOpen}
        onClose={() => setIsGlobalScannerOpen(false)}
        onScan={handleScannerResult}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
