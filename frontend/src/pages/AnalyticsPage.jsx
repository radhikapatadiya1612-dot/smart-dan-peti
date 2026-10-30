import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Coins,
  CreditCard,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';

export default function AnalyticsPage({ stats, causes = [] }) {
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchExpenseData() {
      try {
        const res = await api.getExpenseSummary();
        if (res.success) {
          setExpenseSummary(res);
        }
      } catch (e) {
        console.error('Failed to load expense summary:', e);
      }
    }
    fetchExpenseData();
  }, []);

  const {
    total_donations = 0,
    cash_total = 0,
    digital_total = 0,
    total_transactions = 0,
    total_spent = 0,
    net_balance = 0,
    denomination_breakdown = [],
    daily_trends = []
  } = stats || {};

  const cashPct = total_donations > 0 ? Math.round((cash_total / total_donations) * 100) : 0;
  const digitalPct = total_donations > 0 ? Math.round((digital_total / total_donations) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Collections</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            ₹{total_donations.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>100% Verified Inflow</span>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Seva Expenditure</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            ₹{total_spent.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Utilized on Meals, Renovation, Cows</span>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Trust Corpus Reserve</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{net_balance.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>Audited Bank Balance</span>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions Count</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {total_transactions.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Avg ₹{total_transactions > 0 ? Math.round(total_donations / total_transactions) : 0} / donor</span>
        </div>
      </div>

      {/* Row 2: Digital vs Cash Ratio + Cause Allocation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Payment Channels Split */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Payment Channels (Cash vs Digital)
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Digital Kiosk & QR vs Physical Smart Dan Peti Drops
          </span>

          <div style={{ display: 'flex', gap: '14px', margin: '24px 0 16px' }}>
            {/* Digital share */}
            <div style={{ flex: digitalPct, background: '#3b82f6', height: '14px', borderRadius: '4px', minWidth: '20px' }} title={`Digital: ${digitalPct}%`} />
            {/* Cash share */}
            <div style={{ flex: cashPct, background: '#f59e0b', height: '14px', borderRadius: '4px', minWidth: '20px' }} title={`Physical Cash: ${cashPct}%`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ padding: '14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 600, fontSize: '0.84rem' }}>
                <QrCode size={18} /> Digital (UPI, Cards, Net)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                ₹{digital_total.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.76rem', color: '#93c5fd' }}>{digitalPct}% of Total Inflow</span>
            </div>

            <div style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 600, fontSize: '0.84rem' }}>
                <Coins size={18} /> Physical Cash Box Drops
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                ₹{cash_total.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.76rem', color: '#fde68a' }}>{cashPct}% of Total Inflow</span>
            </div>
          </div>
        </div>

        {/* Cause / Seva Fund Target Progress */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Seva Corpus Allocation & Targets
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Progress towards dedicated charitable funds
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
            {causes.map((c) => {
              const collected = parseFloat(c.collected_amount || 0);
              const target = parseFloat(c.target_amount || 1000000);
              const pct = Math.min(100, Math.round((collected / target) * 100));
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{c.name}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      ₹{collected.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ ₹{(target / 100000).toFixed(1)}L ({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Denomination Volume Matrix */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '22px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
          Physical Currency Vault Denominations
        </h3>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Detailed currency unit counts authenticated through Smart Dan Peti sensors
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginTop: '18px' }}>
          {denomination_breakdown.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color }}>{item.denomination}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>
                ₹{item.total.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.count} units</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
