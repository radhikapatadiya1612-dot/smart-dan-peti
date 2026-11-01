import React, { useState } from 'react';
import {
  Landmark,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminAuthPage({ onLoginSuccess }) {
  const { login, registerAdmin, quickDemoLogin, loading } = useAuth();
  
  // 'login' | 'register'
  const [activeMode, setActiveMode] = useState('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin@smartdanpeti.org');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAdminKey, setRegAdminKey] = useState('ADMIN2026');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Admin Sign In
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter your administrator email and password.');
      return;
    }

    const res = await login(loginEmail.trim(), loginPassword);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res.message || 'Invalid administrator credentials. Access restricted to authorized admins.');
    }
  };

  // Handle Create Admin Account
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill all mandatory fields (Name, Email, Password).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (regAdminKey.trim() !== 'ADMIN2026' && regAdminKey.trim() !== 'admin123') {
      setError('Invalid Admin Security Key. Authorized passcode is required (Hint: ADMIN2026).');
      return;
    }

    const res = await registerAdmin({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      pan_number: regPan.trim().toUpperCase(),
      admin_key: regAdminKey.trim()
    });

    if (res.success) {
      setSuccessMsg('Administrator account registered successfully! Entering dashboard...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 800);
    } else {
      setError(res.message || 'Failed to create administrator account.');
    }
  };

  const handleInstantDemo = () => {
    quickDemoLogin();
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 90% 80% at 50% -10%, var(--gold-card-bg) 0%, var(--bg-primary) 70%, var(--bg-secondary) 100%)',
        padding: '24px',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {/* Top Gold Accent Bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, var(--gold-hover) 0%, var(--gold-primary) 50%, var(--border-gold) 100%)'
          }}
        />

        {/* Header with Temple Emblem & Admin Security Badge */}
        <div style={{ textAlign: 'center', padding: '32px 32px 18px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-hover) 100%)',
              color: 'var(--gold-btn-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(194, 112, 8, 0.35)'
            }}
          >
            <Landmark size={32} strokeWidth={2.4} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'var(--gold-card-bg)',
              border: '1px solid var(--gold-card-border)',
              color: 'var(--text-gold)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}
          >
            <ShieldCheck size={14} color="var(--gold-primary)" />
            <span>Authorized Administrator Access Only</span>
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            Smart Dan Peti
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Temple Trust Digital Hundi & Financial Management System
          </p>

          {/* Mode Switcher Tabs: Sign In vs Create Account */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-subbox)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginTop: '22px',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                border: 'none',
                background: activeMode === 'login' ? 'var(--gold-primary)' : 'transparent',
                color: activeMode === 'login' ? 'var(--gold-btn-text)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'login' ? 800 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeMode === 'login' ? '0 4px 12px rgba(194, 112, 8, 0.3)' : 'none'
              }}
            >
              <Lock size={15} />
              <span>Admin Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                border: 'none',
                background: activeMode === 'register' ? 'var(--gold-primary)' : 'transparent',
                color: activeMode === 'register' ? 'var(--gold-btn-text)' : 'var(--text-secondary)',
                fontWeight: activeMode === 'register' ? 800 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeMode === 'register' ? '0 4px 12px rgba(194, 112, 8, 0.3)' : 'none'
              }}
            >
              <KeyRound size={15} />
              <span>Create Admin Account</span>
            </button>
          </div>
        </div>

        {/* Error / Success Feedback Banner */}
        <div style={{ padding: '0 32px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '11px 14px',
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '11px 14px',
                borderRadius: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* MODE 1: ADMIN SIGN IN FORM */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ padding: '6px 32px 28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                Administrator Official Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '12px',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@smartdanpeti.org"
                  required
                  className="custom-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Admin Password
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-gold)', fontWeight: 700 }}>
                  Demo: admin123
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '12px',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="custom-input"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ width: '100%', padding: '13px', fontSize: '0.94rem' }}
            >
              <span>{loading ? 'Authenticating Admin...' : 'Sign In as Administrator'}</span>
              <ArrowRight size={18} />
            </button>

            {/* Quick Demo Login Option */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleInstantDemo}
                style={{
                  background: 'var(--gold-card-bg)',
                  border: '1.5px dashed var(--border-gold)',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  color: 'var(--text-gold)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={15} color="var(--gold-primary)" />
                <span>One-Click Demo Admin (Srikanth Ramanathan)</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CREATE ADMIN ACCOUNT */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ padding: '6px 32px 28px' }}>
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--gold-card-bg)',
                border: '1px solid var(--gold-card-border)',
                color: 'var(--text-gold)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <KeyRound size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
              <span>
                Authorized registration: Requires master trust passcode <strong>ADMIN2026</strong>.
              </span>
            </div>

            {/* Admin Full Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Mahant Raghavendra Sharma"
                  required
                  className="custom-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Admin Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Administrator Email *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin.trustee@smartdanpeti.org"
                  required
                  className="custom-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Phone & PAN Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Mobile / WhatsApp
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="custom-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Trust PAN / ID
                </label>
                <input
                  type="text"
                  value={regPan}
                  onChange={(e) => setRegPan(e.target.value)}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="custom-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            {/* Master Admin Security Key */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Master Admin Security Passkey *
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-gold)', fontWeight: 700 }}>
                  Key: ADMIN2026
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={17} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--gold-primary)' }} />
                <input
                  type="text"
                  value={regAdminKey}
                  onChange={(e) => setRegAdminKey(e.target.value)}
                  placeholder="ADMIN2026"
                  required
                  className="custom-input"
                  style={{ paddingLeft: '42px', fontWeight: 700, color: 'var(--text-gold)', background: 'var(--gold-card-bg)', borderColor: 'var(--border-gold)' }}
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Create Password *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  required
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Confirm Password *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="custom-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ width: '100%', padding: '13px', fontSize: '0.94rem' }}
            >
              <span>{loading ? 'Registering Admin...' : 'Register Administrator Account'}</span>
              <CheckCircle2 size={18} />
            </button>
          </form>
        )}

        {/* Footer Security Note */}
        <div
          style={{
            padding: '16px 32px',
            background: 'var(--bg-subbox)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: 'var(--text-muted)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} color="var(--gold-primary)" /> Sri Maha Mandir Trust HQ
          </span>
          <span>End-to-End Encrypted (TLS 1.3)</span>
        </div>
      </div>
    </div>
  );
}
