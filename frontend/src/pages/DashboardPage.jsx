import React from 'react';
import {
  TrendingUp,
  Receipt,
  Coins,
  Cpu,
  Clock,
  ScanLine,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Wifi,
  Battery,
  Weight
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function DashboardPage({ stats, onSelectReceipt, onNavigateTab, onOpenSimulate }) {
  const {
    total_donations = 0,
    total_transactions = 0,
    today_amount = 0,
    today_count = 0,
    cash_in_boxes = 0,
    total_weight_kg = 0,
    pending_review_count = 0,
    pending_review_value = 0,
    active_alerts_count = 0,
    denomination_breakdown = [],
    daily_trends = [],
    recent_donations = [],
    devices = []
  } = stats || {};

  // Find max daily amount for chart scaling
  const maxTrendAmount = Math.max(...daily_trends.map((d) => d.amount || 0), 10000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}
      >
        <StatCard
          title="Total Trust Collections"
          value={`₹${total_donations.toLocaleString()}`}
          subtitle={`${total_transactions} total transactions`}
          icon={TrendingUp}
          trend="+18.4% this month"
          trendType="up"
          color="amber"
        />

        <StatCard
          title="Today's Collections"
          value={`₹${today_amount.toLocaleString()}`}
          subtitle={`${today_count} devotees today`}
          icon={Clock}
          trend="Peak Darshan Hours"
          trendType="up"
          color="emerald"
        />

        <StatCard
          title="Physical Cash in Boxes"
          value={`₹${cash_in_boxes.toLocaleString()}`}
          subtitle={`${total_weight_kg} kg sensor weight`}
          icon={Coins}
          trend="4 Boxes Active"
          trendType="up"
          color="blue"
        />

        <StatCard
          title="Pending Sensor Review"
          value={pending_review_count}
          subtitle={`₹${pending_review_value.toLocaleString()} awaiting audit`}
          icon={ScanLine}
          trend={active_alerts_count > 0 ? `${active_alerts_count} Active Alerts` : 'All Systems Normal'}
          trendType={active_alerts_count > 0 ? 'down' : 'up'}
          color={pending_review_count > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* 2. Middle Grid: Daily Trends Chart + Denomination Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Daily Donation Trends Chart */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Daily Collection Trends
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                7-Day Revenue Progression (Cash vs Digital)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                fontWeight: 600
              }}
            >
              Past 7 Days
            </span>
          </div>

          {/* Custom SVG / Bar Chart */}
          <div style={{ flex: 1, minHeight: '220px', display: 'flex', alignItems: 'flex-end', gap: '14px', paddingTop: '20px' }}>
            {daily_trends.map((day, idx) => {
              const heightPct = Math.round(((day.amount || 0) / maxTrendAmount) * 100);
              const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>
                    ₹{((day.amount || 0) / 1000).toFixed(1)}k
                  </div>
                  {/* Bar column */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${Math.max(14, heightPct)}%`,
                      borderRadius: '8px 8px 3px 3px',
                      background: 'linear-gradient(180deg, #f59e0b 0%, rgba(217, 119, 6, 0.4) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      transition: 'height 0.3s ease',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                    title={`${day.date}: ₹${(day.amount || 0).toLocaleString()} (${day.count || 0} donations)`}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Denomination-wise Breakdown */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Denomination-wise Breakdown
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Physical Currency Note & Coin Distribution
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('detections')}
              style={{
                background: 'none',
                border: 'none',
                color: '#f59e0b',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Audit Queue</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Denomination Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {denomination_breakdown.map((item, idx) => {
              const maxTotal = 75000;
              const barWidth = Math.min(100, Math.round((item.total / maxTotal) * 100));
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.denomination}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.count} notes / units &nbsp;|&nbsp; <strong>₹{item.total.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: item.color,
                        boxShadow: `0 0 8px ${item.color}88`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Smart Dan Peti Device Connection Status Fleet */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Smart Dan Peti Fleet Status
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Live IoT Telemetry, Fill Level % and Tamper Sensors
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('devices')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: '#f59e0b',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Manage All Boxes →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {devices.map((box) => {
            const isAlert = box.status === 'ALERT' || box.tamper_alert;
            return (
              <div
                key={box.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: isAlert ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                      {box.box_uid}
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '0.92rem', color: '#fff', fontWeight: 600 }}>
                      {box.name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {box.location}
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: isAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isAlert ? '#ef4444' : '#10b981'
                    }}
                  >
                    <span className="live-indicator-dot" style={{ background: isAlert ? '#ef4444' : '#10b981' }} />
                    {isAlert ? 'ALERT' : box.status}
                  </span>
                </div>

                {/* Progress bar for fill percentage */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    <span>Capacity Fill Level</span>
                    <strong>{box.fill_percentage}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
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

                {/* Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Weight size={13} color="#f59e0b" /> {box.weight_kg} kg
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Battery size={13} color="#10b981" /> {box.battery_pct}%
                  </span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>
                    ₹{parseFloat(box.current_cash_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Donations Table */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Recent Devotee Donations
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Real-time Ledger Inflow
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('donations')}
            style={{
              background: 'none',
              border: 'none',
              color: '#f59e0b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View Complete Ledger ({total_transactions}) →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt / Txn</th>
                <th>Devotee Name</th>
                <th>Dedicated Seva</th>
                <th>Payment Mode</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {recent_donations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No donations recorded yet.
                  </td>
                </tr>
              ) : (
                recent_donations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f59e0b', fontSize: '0.8rem' }}>
                        {d.receipt_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {d.donor_name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {d.cause_name}
                    </td>
                    <td>
                      <span className={`method-badge method-${(d.payment_method || '').toLowerCase()}`}>
                        {d.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '0.96rem' }}>
                      ₹{parseFloat(d.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectReceipt(d)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          color: '#f59e0b',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
