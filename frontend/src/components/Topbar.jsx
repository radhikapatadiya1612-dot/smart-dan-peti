import React from 'react';
import {
  Menu,
  Bell,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({
  activeTab,
  collapsed,
  setCollapsed,
  isOnline,
  onOpenDemoDetection,
  onOpenNewDonation,
  onRefresh,
  refreshing,
  alertCount = 0
}) {
  const { user } = useAuth();

  const titleMap = {
    dashboard: 'Smart Dan Peti Dashboard',
    donations: 'Donation History & Ledger',
    detections: 'Pending Detection Review',
    analytics: 'Financial Analytics & Reports',
    users: 'User & Role Management',
    audit: 'Security & Compliance Audit Logs',
    devices: 'Smart Dan Peti Fleet & Settings'
  };

  return (
    <header
      style={{
        height: '70px',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Left: Hamburger & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.22rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
            {titleMap[activeTab] || 'Smart Dan Peti'}
          </h1>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Temple Trust IoT Financial & Physical Security System
          </span>
        </div>
      </div>

      {/* Right: Actions, Connection Status & Quick Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend / MySQL status pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '0.76rem',
            fontWeight: 600,
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            color: isOnline ? '#10b981' : '#f59e0b'
          }}
          title={isOnline ? 'Connected to Node.js backend & MySQL database' : 'Using Demo Simulation data'}
        >
          {isOnline ? (
            <>
              <Database size={13} />
              <span>MySQL Live</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>Demo Mode</span>
            </>
          )}
        </div>

        {/* Demo Detection Mode Button */}
        <button
          onClick={onOpenDemoDetection}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Simulate a banknote insertion in Demo Detection Mode"
        >
          <ScanLine size={16} />
          <span>Simulate Bill Sensor</span>
        </button>

        {/* Quick Record Donation */}
        <button
          onClick={onOpenNewDonation}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 14px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            color: '#111827',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
          }}
        >
          <PlusCircle size={16} />
          <span>Record Donation</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Refresh Data"
        >
          <RefreshCw size={17} className={refreshing ? 'spin-animation' : ''} />
        </button>

        {/* System Alert Bell */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: alertCount > 0 ? '#ef4444' : 'var(--text-secondary)',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`${alertCount} Active Alert(s)`}
          >
            <Bell size={17} />
          </button>
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {alertCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
