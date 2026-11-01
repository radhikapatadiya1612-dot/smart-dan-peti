import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import CountingDashboard from './pages/CountingDashboard';
import OnlinePaymentsPage from './pages/OnlinePaymentsPage';
import AdminAuthPage from './pages/AdminAuthPage';
import {
  Landmark,
  LogOut,
  ShieldCheck,
  Coins,
  CreditCard,
  UserPlus,
  Sparkles,
  Layers,
  Calendar
} from 'lucide-react';
import './App.css';

function MainApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('counting'); // 'counting' | 'online'

  useEffect(() => {
    // Clear any obsolete slate/dark mode settings
    localStorage.removeItem('sdp_theme_mode');
    document.documentElement.setAttribute('data-theme', 'sandstone');
  }, []);

  // If administrator is not logged in, render the dedicated Admin Portal
  if (!user) {
    return <AdminAuthPage onLoginSuccess={() => {}} />;
  }

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar with Dynamic Theme Support */}
      <header
        style={{
          height: '76px',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: 'var(--shadow-card)',
          transition: 'background-color 0.25s ease'
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-hover) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-btn-text)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}
          >
            <Landmark size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Smart Dan Peti
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  background: 'var(--emerald-card-bg)',
                  border: '1px solid var(--emerald-card-border)',
                  color: 'var(--emerald)',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                <span className="live-indicator-dot" style={{ width: '6px', height: '6px' }} />
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-gold)', fontWeight: 700, letterSpacing: '0.01em' }}>
              Sri Maha Mandir Trust • IoT Financial Governance
            </div>
          </div>
        </div>

        {/* Center Mode Switcher: Cash Counting vs Online Payments */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subbox)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '5px',
            gap: '6px'
          }}
        >
          <button
            onClick={() => setActiveTab('counting')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'counting' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'counting' ? 'var(--gold-btn-text)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'counting' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: activeTab === 'counting' ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <Coins size={18} />
            <span>Cash & Denomination Counting</span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'online' ? 'var(--gold-primary)' : 'transparent',
              color: activeTab === 'online' ? 'var(--gold-btn-text)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'online' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: activeTab === 'online' ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <CreditCard size={18} />
            <span>Online Payments & UPI</span>
          </button>
        </div>

        {/* Right Area: Admin Profile & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Admin Identity Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px 6px 8px',
              borderRadius: '12px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'var(--gold-primary)',
                color: 'var(--gold-btn-text)',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {user.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
                  ADMINISTRATOR
                </span>
              </div>
            </div>
          </div>

          {/* Admin Sign Out */}
          <button
            onClick={logout}
            title="Log out of Administrator Session"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="page-wrapper" style={{ flex: 1, padding: '26px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'counting' ? <CountingDashboard /> : <OnlinePaymentsPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
