import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendType = 'up', color = 'amber' }) {
  const colorMap = {
    amber: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      text: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.2)'
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.25)',
      text: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.2)'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      text: '#10b981',
      glow: 'rgba(16, 185, 129, 0.2)'
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)',
      text: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.2)'
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.1)',
      border: 'rgba(244, 63, 94, 0.25)',
      text: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.2)'
    }
  };

  const scheme = colorMap[color] || colorMap.amber;

  return (
    <div
      className="stat-card"
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${scheme.border}`,
        borderRadius: '16px',
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.25), 0 0 15px -3px ${scheme.glow}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        </div>
        {Icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: scheme.bg,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: scheme.text
            }}
          >
            <Icon size={24} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.82rem' }}>
          {trend && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.76rem',
                background: trendType === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: trendType === 'up' ? '#10b981' : '#ef4444'
              }}
            >
              {trendType === 'up' ? '↑' : '↓'} {trend}
            </span>
          )}
          {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
