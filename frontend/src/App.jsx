import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api, fallbackData } from './api/client';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import DonationHistoryPage from './pages/DonationHistoryPage';
import PendingDetectionPage from './pages/PendingDetectionPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import DeviceSettingsPage from './pages/DeviceSettingsPage';
import LoginPage from './pages/LoginPage';
import DonationReceiptModal from './components/DonationReceiptModal';
import SimulateDetectionModal from './components/SimulateDetectionModal';
import DualAuthEmptyModal from './components/DualAuthEmptyModal';
import RecordDonationModal from './components/RecordDonationModal';
import './App.css';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Core App State
  const [stats, setStats] = useState(fallbackData.stats);
  const [causes, setCauses] = useState([]);
  const [devices, setDevices] = useState(fallbackData.stats.devices);
  const [users, setUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [dualAuthBox, setDualAuthBox] = useState(null);

  // Fetch all initial data from backend with fallback
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // 1. Check health
      const healthRes = await api.checkHealth();
      const online = Boolean(healthRes.success && healthRes.status === 'ONLINE');
      setIsOnline(online);

      // 2. Fetch Dashboard Stats
      const statsRes = await api.getDashboardStats();
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
        if (statsRes.stats.devices) setDevices(statsRes.stats.devices);
      }

      // 3. Fetch Causes
      const causesRes = await api.getCauses();
      if (causesRes.success && causesRes.causes) {
        setCauses(causesRes.causes);
      }

      // 4. Fetch Users for dual-auth
      const usersRes = await api.getUsers();
      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users);
      }
    } catch (err) {
      console.warn('[App Data Sync Notice]', err);
      setIsOnline(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto sync telemetry every 15 seconds
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  // If user signed out, show LoginPage
  if (!user) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="app-container">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pendingCount={stats?.pending_review_count || 0}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <Topbar
          activeTab={activeTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isOnline={isOnline}
          onOpenDemoDetection={() => setShowSimulateModal(true)}
          onOpenNewDonation={() => setShowRecordModal(true)}
          onRefresh={fetchDashboardData}
          refreshing={refreshing}
          alertCount={stats?.active_alerts_count || 0}
        />

        {/* Offline Demo Banner if MySQL/Backend unreachable */}
        {!isOnline && (
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#fde68a'
            }}
          >
            <div>
              <strong>Demo Simulation Mode:</strong> Backend on port 5000 is syncing or MySQL is starting up. Displaying simulated hardware telemetry and sample data.
            </div>
            <button
              onClick={fetchDashboardData}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.74rem'
              }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page Routing */}
        <main className="page-wrapper">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onSelectReceipt={(receipt) => setSelectedReceipt(receipt)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSimulate={() => setShowSimulateModal(true)}
            />
          )}

          {activeTab === 'donations' && (
            <DonationHistoryPage
              causes={causes}
              onSelectReceipt={(receipt) => setSelectedReceipt(receipt)}
            />
          )}

          {activeTab === 'detections' && (
            <PendingDetectionPage
              onOpenSimulate={() => setShowSimulateModal(true)}
              onSelectReceipt={(receipt) => setSelectedReceipt(receipt)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              stats={stats}
              causes={causes}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementPage />
          )}

          {activeTab === 'audit' && (
            <AuditLogsPage />
          )}

          {activeTab === 'devices' && (
            <DeviceSettingsPage
              devices={devices}
              onRefresh={fetchDashboardData}
              onOpenDualAuthEmpty={(box) => setDualAuthBox(box)}
              onDeviceUpdated={fetchDashboardData}
            />
          )}
        </main>
      </div>

      {/* 80G Tax Exemption Donation Receipt Modal */}
      <DonationReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />

      {/* Demo Detection Mode Banknote Simulator Modal */}
      <SimulateDetectionModal
        isOpen={showSimulateModal}
        onClose={() => setShowSimulateModal(false)}
        devices={devices}
        causes={causes}
        onDetectionCreated={fetchDashboardData}
      />

      {/* Dual-Key Physical Cash Emptying Modal */}
      <DualAuthEmptyModal
        isOpen={Boolean(dualAuthBox)}
        onClose={() => setDualAuthBox(null)}
        box={dualAuthBox}
        users={users}
        onEmptied={fetchDashboardData}
      />

      {/* Record Donation Modal */}
      <RecordDonationModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        causes={causes}
        devices={devices}
        onDonationCreated={fetchDashboardData}
        onSelectReceipt={(receipt) => setSelectedReceipt(receipt)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
