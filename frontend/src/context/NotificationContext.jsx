import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  RefreshCw,
  Landmark,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Add a toast notification
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = {
      id,
      type: toast.type || 'info', // 'success' | 'info' | 'warning' | 'error'
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration || 4000
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience toast methods
  const notify = {
    success: (message, title = 'Operation Successful') => {
      return addToast({ type: 'success', title, message });
    },
    error: (message, title = 'Action Failed') => {
      return addToast({ type: 'error', title, message });
    },
    info: (message, title = 'Notice') => {
      return addToast({ type: 'info', title, message });
    },
    warning: (message, title = 'Attention Required') => {
      return addToast({ type: 'warning', title, message });
    }
  };

  // Bespoke Confirmation Modal replacing ugly window.confirm
  const confirmAction = useCallback(
    ({
      title = 'Confirm Action',
      message = 'Are you sure you wish to proceed?',
      details = null,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'gold', // 'gold' | 'danger'
      iconType = 'warning', // 'warning' | 'reset' | 'shield'
      onConfirm
    }) => {
      setConfirmDialog({
        title,
        message,
        details,
        confirmText,
        cancelText,
        confirmVariant,
        iconType,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          setConfirmDialog(null);
        }
      });
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ notify, confirmAction, addToast, removeToast }}>
      {children}

      {/* 1. FLOATING TOAST CONTAINER (Top Right) */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '420px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          let accentColor = 'var(--gold-primary)';
          let bgColor = 'var(--card-bg)';
          let borderColor = 'var(--border-color)';
          let icon = <Info size={20} color="var(--gold-primary)" />;

          if (t.type === 'success') {
            accentColor = 'var(--emerald)';
            borderColor = 'var(--emerald-card-border)';
            icon = <CheckCircle2 size={20} color="var(--emerald)" />;
          } else if (t.type === 'error') {
            accentColor = '#dc2626';
            borderColor = '#f87171';
            icon = <XCircle size={20} color="#dc2626" />;
          } else if (t.type === 'warning') {
            accentColor = '#d97706';
            borderColor = '#f59e0b';
            icon = <AlertTriangle size={20} color="#d97706" />;
          }

          return (
            <div
              key={t.id}
              className="toast-notification-item"
              style={{
                pointerEvents: 'auto',
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '16px 18px',
                boxShadow: '0 12px 36px rgba(44, 34, 24, 0.16), 0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              {/* Left Accent Indicator */}
              <div
                style={{
                  width: '4px',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  background: accentColor
                }}
              />

              {/* Toast Icon */}
              <div
                style={{
                  flexShrink: 0,
                  marginTop: '1px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'var(--bg-subbox)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icon}
              </div>

              {/* Toast Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      marginBottom: '3px'
                    }}
                  >
                    {t.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}
                >
                  {t.message}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-subbox)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. CUSTOM CONFIRMATION MODAL (Replaces ugly browser window.confirm) */}
      {confirmDialog && (
        <div
          className="modal-overlay"
          onClick={confirmDialog.onCancel}
          style={{
            zIndex: 99998,
            animation: 'fadeInOverlay 0.2s ease forwards'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '92%',
              background: 'var(--card-bg)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '22px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(44, 34, 24, 0.25), 0 0 0 1px rgba(194, 112, 8, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Top Decorative Temple Accent Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background:
                  confirmDialog.confirmVariant === 'danger'
                    ? 'linear-gradient(90deg, #dc2626 0%, #f59e0b 100%)'
                    : 'linear-gradient(90deg, var(--gold-hover) 0%, var(--gold-primary) 50%, #f59e0b 100%)'
              }}
            />

            {/* Header Icon & Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background:
                    confirmDialog.confirmVariant === 'danger'
                      ? 'rgba(220, 38, 38, 0.12)'
                      : 'var(--gold-card-bg)',
                  border:
                    confirmDialog.confirmVariant === 'danger'
                      ? '1px solid rgba(220, 38, 38, 0.3)'
                      : '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    confirmDialog.confirmVariant === 'danger'
                      ? '#dc2626'
                      : 'var(--gold-primary)',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(194, 112, 8, 0.15)'
                }}
              >
                {confirmDialog.iconType === 'reset' ? (
                  <RefreshCw size={26} strokeWidth={2.4} />
                ) : confirmDialog.iconType === 'shield' ? (
                  <ShieldAlert size={26} strokeWidth={2.4} />
                ) : (
                  <AlertTriangle size={26} strokeWidth={2.4} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--gold-card-bg)',
                    border: '1px solid var(--gold-card-border)',
                    color: 'var(--text-gold)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px'
                  }}
                >
                  <Landmark size={12} color="var(--gold-primary)" />
                  <span>Temple Financial Governance</span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3
                  }}
                >
                  {confirmDialog.title}
                </h3>
              </div>

              <button
                onClick={confirmDialog.onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '8px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Body */}
            <div
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: confirmDialog.details ? '14px' : '24px'
              }}
            >
              {confirmDialog.message}
            </div>

            {/* Optional Details Callout Box */}
            {confirmDialog.details && (
              <div
                style={{
                  background: 'var(--bg-subbox)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {confirmDialog.details}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="btn-ghost"
                style={{ padding: '11px 20px', borderRadius: '12px' }}
              >
                {confirmDialog.cancelText}
              </button>

              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={confirmDialog.confirmVariant === 'danger' ? 'btn-danger' : 'btn-gold'}
                style={{ padding: '11px 22px', borderRadius: '12px' }}
              >
                {confirmDialog.iconType === 'reset' && <RefreshCw size={16} />}
                <span>{confirmDialog.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

