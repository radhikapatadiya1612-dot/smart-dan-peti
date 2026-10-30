import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  Battery,
  Weight,
  Key,
  AlertTriangle,
  Coins,
  Settings,
  Save,
  CheckCircle,
  RefreshCw,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { api } from '../api/client';

export default function DeviceSettingsPage({ devices = [], onRefresh, onOpenDualAuthEmpty, onDeviceUpdated }) {
  const [settings, setSettings] = useState({
    trust_name: 'Sri Maha Mandir Trust',
    tax_80g_number: 'AAATS1234F/80G/2022-23',
    upi_vpa: 'smartdanpeti@upi',
    weight_threshold_kg: 20.0,
    fill_alert_pct: 85,
    demo_mode_enabled: 1,
    currency_symbol: '₹'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getSettings();
        if (res.success && res.settings) {
          setSettings(res.settings);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSimulateCashDrop = async (boxId) => {
    setActionLoading(`cash-${boxId}`);
    try {
      const res = await api.simulateCashDrop(boxId, { amount: 500, cause_id: 1 });
      if (res.success) {
        if (onDeviceUpdated) onDeviceUpdated();
      }
    } catch (e) {
      console.error('Cash drop simulation failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerTamper = async (boxId) => {
    setActionLoading(`tamper-${boxId}`);
    try {
      const res = await api.triggerTamperAlert(boxId);
      if (res.success) {
        if (onDeviceUpdated) onDeviceUpdated();
      }
    } catch (e) {
      console.error('Tamper trigger failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Fleet Overview Header */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Smart Dan Peti Physical Boxes Fleet ({devices.length} Deployed)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Real-time weight strain gauges, tamper tilt detectors, and dual-lock status
          </span>
        </div>

        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Fleet Telemetry
        </button>
      </div>

      {/* Fleet Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {devices.map((box) => {
          const isAlert = box.status === 'ALERT' || box.tamper_alert;
          const isFull = (box.fill_percentage || 0) >= 80;

          return (
            <div
              key={box.id}
              style={{
                background: 'var(--card-bg)',
                border: isAlert ? '1px solid #ef4444' : isFull ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: isAlert ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none'
              }}
            >
              {/* Box Top Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {box.box_uid}
                  </span>
                  <h4 style={{ margin: '2px 0 0', fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    {box.name}
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {box.location}
                  </span>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: isAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isAlert ? '#ef4444' : '#10b981'
                  }}
                >
                  <span className="live-indicator-dot" style={{ background: isAlert ? '#ef4444' : '#10b981' }} />
                  {isAlert ? 'TAMPER ALARM' : box.status}
                </span>
              </div>

              {/* Hardware Telemetry Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cash Inside</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    ₹{parseFloat(box.current_cash_amount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sensor Weight</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {box.weight_kg} / {box.max_weight_kg} kg
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Battery</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {box.battery_pct}%
                  </div>
                </div>
              </div>

              {/* Fill Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>Volumetric Capacity Fullness</span>
                  <strong>{box.fill_percentage}% Full</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${box.fill_percentage}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: box.fill_percentage > 80 ? '#ef4444' : box.fill_percentage > 50 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons for this Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                <button
                  disabled={actionLoading === `cash-${box.id}`}
                  onClick={() => handleSimulateCashDrop(box.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#f59e0b',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  title="Simulate cash note insertion into this physical box"
                >
                  <Coins size={14} /> +₹500 Cash
                </button>

                <button
                  disabled={actionLoading === `tamper-${box.id}`}
                  onClick={() => handleTriggerTamper(box.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: isAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isAlert ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    color: isAlert ? '#ef4444' : 'var(--text-secondary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  title="Toggle tilt/tamper sensor test"
                >
                  <AlertTriangle size={14} /> {isAlert ? 'Clear Alarm' : 'Test Tilt'}
                </button>

                <button
                  onClick={() => onOpenDualAuthEmpty(box)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  title="Dual-key clearance workflow"
                >
                  <Key size={14} /> Dual Empty
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Application Settings Form */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Settings size={20} color="#f59e0b" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Trust Configuration & Operational Thresholds
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              80G certificate registration, UPI payment endpoint, and security limits
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Temple Trust Registered Legal Name
              </label>
              <input
                type="text"
                value={settings.trust_name || ''}
                onChange={(e) => setSettings({ ...settings, trust_name: e.target.value })}
                className="custom-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                80G Income Tax Exemption Reg. Number
              </label>
              <input
                type="text"
                value={settings.tax_80g_number || ''}
                onChange={(e) => setSettings({ ...settings, tax_80g_number: e.target.value })}
                className="custom-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Trust UPI Virtual Payment Address (VPA)
              </label>
              <input
                type="text"
                value={settings.upi_vpa || ''}
                onChange={(e) => setSettings({ ...settings, upi_vpa: e.target.value })}
                className="custom-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Box Full Weight Alarm Threshold (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.weight_threshold_kg || 20}
                onChange={(e) => setSettings({ ...settings, weight_threshold_kg: parseFloat(e.target.value) })}
                className="custom-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Fill Percentage Capacity Alarm (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={settings.fill_alert_pct || 85}
                onChange={(e) => setSettings({ ...settings, fill_alert_pct: parseInt(e.target.value, 10) })}
                className="custom-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Sensor AI Auto-Approve Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0.80"
                max="0.99"
                value={settings.auto_approve_threshold || 0.98}
                onChange={(e) => setSettings({ ...settings, auto_approve_threshold: parseFloat(e.target.value) })}
                className="custom-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="demoToggle"
                checked={Boolean(settings.demo_mode_enabled)}
                onChange={(e) => setSettings({ ...settings, demo_mode_enabled: e.target.checked ? 1 : 0 })}
                style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
              />
              <label htmlFor="demoToggle" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Enable Demo Banknote Detection Mode for testing
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {saveSuccess && (
                <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckCircle size={15} /> Settings saved & logged
                </span>
              )}
              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#111827',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
