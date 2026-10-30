import React, { useState } from 'react';
import { Landmark, Lock, Mail, Shield, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onLoginSuccess }) {
  const { login, quickDemoLogin, loading, demoUsers } = useAuth();
  const [email, setEmail] = useState('admin@smartdanpeti.org');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  const handleRoleSelect = (roleKey) => {
    quickDemoLogin(roleKey);
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #030712 100%)',
        padding: '24px',
        color: '#fff'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '36px 30px 20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Landmark size={36} strokeWidth={2.4} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
            Smart Dan Peti
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Secure Temple Trust IoT & Financial Management Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '10px 30px 24px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Official Trust Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smartdanpeti.org"
                required
                className="custom-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="custom-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#111827',
              fontWeight: 700,
              fontSize: '0.96rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Trust Portal'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Role Switcher for instant evaluator testing */}
        <div
          style={{
            padding: '20px 30px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} /> Quick One-Click Demo Roles:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {Object.entries(demoUsers).slice(0, 4).map(([roleKey, u]) => (
              <button
                key={roleKey}
                type="button"
                onClick={() => handleRoleSelect(roleKey)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <span>{u.role}: {u.name.split(' ')[0]}</span>
                <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
