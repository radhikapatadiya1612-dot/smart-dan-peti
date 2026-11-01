import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Coins,
  Banknote,
  Calendar,
  Clock,
  TrendingUp,
  Printer,
  PlusCircle,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  Landmark,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  X,
  Sparkles,
  Database
} from 'lucide-react';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';

// Master Currency & Coin denominations specification
const DEFAULT_DENOMINATIONS = [
  // Notes
  { id: 'n500', name: '₹500 Note', value: 500, type: 'note', color: '#3b82f6', daily: 48, weekly: 336, monthly: 1440, yearly: 17280 },
  { id: 'n200', name: '₹200 Note', value: 200, type: 'note', color: '#f59e0b', daily: 35, weekly: 245, monthly: 1050, yearly: 12600 },
  { id: 'n100', name: '₹100 Note', value: 100, type: 'note', color: '#a855f7', daily: 82, weekly: 574, monthly: 2460, yearly: 29520 },
  { id: 'n50',  name: '₹50 Note',  value: 50,  type: 'note', color: '#10b981', daily: 64, weekly: 448, monthly: 1920, yearly: 23040 },
  { id: 'n20',  name: '₹20 Note',  value: 20,  type: 'note', color: '#ec4899', daily: 95, weekly: 665, monthly: 2850, yearly: 34200 },
  { id: 'n10',  name: '₹10 Note',  value: 10,  type: 'note', color: '#06b6d4', daily: 140, weekly: 980, monthly: 4200, yearly: 50400 },
  // Coins
  { id: 'c20',  name: '₹20 Coin',  value: 20,  type: 'coin', color: '#eab308', daily: 25, weekly: 175, monthly: 750, yearly: 9000 },
  { id: 'c10',  name: '₹10 Coin',  value: 10,  type: 'coin', color: '#14b8a6', daily: 80, weekly: 560, monthly: 2400, yearly: 28800 },
  { id: 'c5',   name: '₹5 Coin',   value: 5,   type: 'coin', color: '#38bdf8', daily: 210, weekly: 1470, monthly: 6300, yearly: 75600 },
  { id: 'c2',   name: '₹2 Coin',   value: 2,   type: 'coin', color: '#94a3b8', daily: 280, weekly: 1960, monthly: 8400, yearly: 100800 },
  { id: 'c1',   name: '₹1 Coin',   value: 1,   type: 'coin', color: '#cbd5e1', daily: 390, weekly: 2730, monthly: 11700, yearly: 140400 }
];

export default function CountingDashboard() {
  const { notify, confirmAction } = useNotification();

  const [denominations, setDenominations] = useState(() => {
    try {
      const saved = localStorage.getItem('sdp_counting_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load from storage:', e);
    }
    return DEFAULT_DENOMINATIONS;
  });

  const [activePeriod, setActivePeriod] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'note' | 'coin'
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalPeriod, setModalPeriod] = useState('daily');
  const [entryCounts, setEntryCounts] = useState({});
  const [entryMode, setEntryMode] = useState('add'); // 'add' | 'set'
  const [isDbSynced, setIsDbSynced] = useState(false);

  // Sync with MySQL Database on mount
  useEffect(() => {
    async function fetchFromDb() {
      try {
        const res = await api.getCashDenominations();
        if (res?.success && Array.isArray(res.denominations) && res.denominations.length > 0) {
          const merged = res.denominations.map((d) => {
            const def = DEFAULT_DENOMINATIONS.find((x) => x.id === d.id) || {};
            return { ...def, ...d };
          });
          setDenominations(merged);
          localStorage.setItem('sdp_counting_data', JSON.stringify(merged));
          setIsDbSynced(true);
        }
      } catch (err) {
        console.warn('MySQL not reachable, using offline cached data.');
      }
    }
    fetchFromDb();
  }, []);

  // Save changes to localStorage & MySQL backend
  useEffect(() => {
    try {
      localStorage.setItem('sdp_counting_data', JSON.stringify(denominations));
      api.updateCashDenominations(denominations)
        .then(() => setIsDbSynced(true))
        .catch(() => setIsDbSynced(false));
    } catch (e) {
      console.error(e);
    }
  }, [denominations]);

  // Aggregate Calculations
  const totals = useMemo(() => {
    const res = {
      daily: { notesCount: 0, notesAmount: 0, coinsCount: 0, coinsAmount: 0, totalCount: 0, totalAmount: 0 },
      weekly: { notesCount: 0, notesAmount: 0, coinsCount: 0, coinsAmount: 0, totalCount: 0, totalAmount: 0 },
      monthly: { notesCount: 0, notesAmount: 0, coinsCount: 0, coinsAmount: 0, totalCount: 0, totalAmount: 0 },
      yearly: { notesCount: 0, notesAmount: 0, coinsCount: 0, coinsAmount: 0, totalCount: 0, totalAmount: 0 }
    };

    ['daily', 'weekly', 'monthly', 'yearly'].forEach((p) => {
      denominations.forEach((item) => {
        const count = Number(item[p]) || 0;
        const amount = count * item.value;
        if (item.type === 'note') {
          res[p].notesCount += count;
          res[p].notesAmount += amount;
        } else {
          res[p].coinsCount += count;
          res[p].coinsAmount += amount;
        }
        res[p].totalCount += count;
        res[p].totalAmount += amount;
      });
    });

    return res;
  }, [denominations]);

  // Filtered denomination list
  const filteredList = useMemo(() => {
    if (typeFilter === 'all') return denominations;
    return denominations.filter((d) => d.type === typeFilter);
  }, [denominations, typeFilter]);

  // Handle count change from Add modal
  const handleSaveCounts = (e) => {
    e.preventDefault();
    setDenominations((prev) =>
      prev.map((item) => {
        const added = Number(entryCounts[item.id]) || 0;
        if (added === 0) return item;

        const current = Number(item[modalPeriod]) || 0;
        const nextVal = entryMode === 'add' ? current + added : Math.max(0, added);

        if (modalPeriod === 'daily' && entryMode === 'add') {
          return {
            ...item,
            daily: nextVal,
            weekly: (Number(item.weekly) || 0) + added,
            monthly: (Number(item.monthly) || 0) + added,
            yearly: (Number(item.yearly) || 0) + added
          };
        }

        return {
          ...item,
          [modalPeriod]: nextVal
        };
      })
    );

    setEntryCounts({});
    setShowAddModal(false);

    notify.success(
      `Successfully recorded and updated ${modalPeriod.toUpperCase()} counting entries in the physical ledger.`,
      'Ledger Updated'
    );
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
  };

  // Quick increment/decrement helper for tactile card buttons
  const quickUpdateCount = (id, delta) => {
    const targetPeriod = activePeriod === 'all' ? 'daily' : activePeriod;
    setDenominations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = Number(item[targetPeriod]) || 0;
        const nextVal = Math.max(0, current + delta);
        if (targetPeriod === 'daily') {
          return {
            ...item,
            daily: nextVal,
            weekly: Math.max(0, (Number(item.weekly) || 0) + delta),
            monthly: Math.max(0, (Number(item.monthly) || 0) + delta),
            yearly: Math.max(0, (Number(item.yearly) || 0) + delta)
          };
        }
        return {
          ...item,
          [targetPeriod]: nextVal
        };
      })
    );
  };

  // Reset to seed figures with bespoke Temple Confirmation Modal
  const handleReset = () => {
    confirmAction({
      title: 'Reset Currency Counting Ledger?',
      message:
        'Are you sure you want to reset all physical note and coin counts to default temple seed figures? This action will overwrite the current live tally across all periods.',
      details: (
        <>
          <div style={{ fontWeight: 700, color: 'var(--text-gold)', marginBottom: '3px' }}>
            ✦ Baseline Verification Reset:
          </div>
          <div>• <strong>Banknotes:</strong> ₹500, ₹200, ₹100, ₹50, ₹20, ₹10</div>
          <div>• <strong>Coins:</strong> ₹20, ₹10, ₹5, ₹2, ₹1</div>
          <div>• <strong>Audit Status:</strong> Re-aligns tallies with Sri Maha Mandir baseline ledger</div>
        </>
      ),
      confirmText: 'Yes, Reset All Counts',
      cancelText: 'Cancel / Keep Counts',
      confirmVariant: 'danger',
      iconType: 'reset',
      onConfirm: async () => {
        setDenominations(DEFAULT_DENOMINATIONS);
        localStorage.setItem('sdp_counting_data', JSON.stringify(DEFAULT_DENOMINATIONS));
        try {
          await api.saveDenominations(DEFAULT_DENOMINATIONS);
        } catch (e) {
          console.warn('Backend sync on reset:', e);
        }
        notify.success(
          'All physical cash and coin counts have been restored to default temple seed figures.',
          'Ledger Reset Successfully'
        );
        try {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }
    });
  };

  // Print Panchanama / Audit Sheet
  const handlePrint = () => {
    notify.info('Preparing official Panchanama physical cash audit sheet for print...', 'Panchanama Print');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Export CSV
  const exportToCSV = () => {
    notify.info('Exporting physical counting ledger to CSV...', 'Generating CSV');
    const headers = [
      'Denomination Name',
      'Currency Type',
      'Unit Face Value (INR)',
      'Daily Count',
      'Daily Total (INR)',
      'Weekly Count',
      'Weekly Total (INR)',
      'Monthly Count',
      'Monthly Total (INR)',
      'Yearly Count',
      'Yearly Total (INR)'
    ];

    const rows = denominations.map((d) => [
      `"${d.name}"`,
      d.type.toUpperCase(),
      d.value,
      d.daily,
      d.daily * d.value,
      d.weekly,
      d.weekly * d.value,
      d.monthly,
      d.monthly * d.value,
      d.yearly,
      d.yearly * d.value
    ]);

    // Sub-totals
    rows.push([
      '"NOTES SUBTOTAL"',
      'BANKNOTES',
      '-',
      totals.daily.notesCount,
      totals.daily.notesAmount,
      totals.weekly.notesCount,
      totals.weekly.notesAmount,
      totals.monthly.notesCount,
      totals.monthly.notesAmount,
      totals.yearly.notesCount,
      totals.yearly.notesAmount
    ]);

    rows.push([
      '"COINS SUBTOTAL"',
      'COINS',
      '-',
      totals.daily.coinsCount,
      totals.daily.coinsAmount,
      totals.weekly.coinsCount,
      totals.weekly.coinsAmount,
      totals.monthly.coinsCount,
      totals.monthly.coinsAmount,
      totals.yearly.coinsCount,
      totals.yearly.coinsAmount
    ]);

    rows.push([
      '"GRAND TOTAL (NOTES + COINS)"',
      'ALL',
      '-',
      totals.daily.totalCount,
      totals.daily.totalAmount,
      totals.weekly.totalCount,
      totals.weekly.totalAmount,
      totals.monthly.totalCount,
      totals.monthly.totalAmount,
      totals.yearly.totalCount,
      totals.yearly.totalAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartDanPeti_Cash_Counting_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Physical cash and coin counting ledger downloaded as CSV.', 'Export Complete');
  };

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Balanced Header Banner */}
      <div
        className="designer-card"
        style={{
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-hover) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-btn-text)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}
          >
            <Coins size={30} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Cash & Denomination Counting Ledger
              </h1>
              {isDbSynced && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'var(--emerald-card-bg)',
                    border: '1px solid var(--emerald-card-border)',
                    color: 'var(--emerald)',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                  title="All currency counts are synced in real-time with MySQL database"
                >
                  <Database size={13} />
                  <span>MySQL Connected</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <Calendar size={15} color="var(--gold-primary)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentDateStr}</span>
              <span>•</span>
              <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>Daily, Weekly, Monthly & Yearly Physical Hundi Reconciliation</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }} className="no-print">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold"
          >
            <PlusCircle size={18} />
            <span>+ Record Cash Count</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-outline-gold"
          >
            <Printer size={17} />
            <span>Print Panchanama</span>
          </button>

          <button
            onClick={exportToCSV}
            className="btn-ghost"
          >
            <Download size={17} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleReset}
            title="Reset counts to temple seed numbers"
            className="btn-ghost"
            style={{ padding: '10px 14px' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 2. Four Master Period Cards in Balanced Adaptive Theme */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {[
          {
            key: 'daily',
            label: 'Daily Cash Inflow',
            tag: "Today's Count",
            accentColor: 'var(--emerald)',
            cardBg: 'var(--emerald-card-bg)',
            borderColor: 'var(--emerald-card-border)',
            data: totals.daily
          },
          {
            key: 'weekly',
            label: 'Weekly Cash Inflow',
            tag: 'Last 7 Days',
            accentColor: 'var(--blue)',
            cardBg: 'var(--blue-card-bg)',
            borderColor: 'var(--blue-card-border)',
            data: totals.weekly
          },
          {
            key: 'monthly',
            label: 'Monthly Cash Inflow',
            tag: 'This Month',
            accentColor: 'var(--gold-primary)',
            cardBg: 'var(--gold-card-bg)',
            borderColor: 'var(--gold-card-border)',
            data: totals.monthly
          },
          {
            key: 'yearly',
            label: 'Yearly Cash Inflow',
            tag: 'Financial Year',
            accentColor: 'var(--purple)',
            cardBg: 'var(--purple-card-bg)',
            borderColor: 'var(--purple-card-border)',
            data: totals.yearly
          }
        ].map((period) => {
          const isSelected = activePeriod === period.key;
          return (
            <div
              key={period.key}
              onClick={() => setActivePeriod(activePeriod === period.key ? 'all' : period.key)}
              style={{
                background: period.cardBg,
                border: isSelected ? `2px solid ${period.accentColor}` : `1px solid ${period.borderColor}`,
                borderRadius: '18px',
                padding: '24px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: period.accentColor }}>
                  {period.label}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'var(--bg-subbox)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {period.tag}
                </span>
              </div>

              {/* Big Grand Total Amount */}
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
                ₹{period.data.totalAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Total <strong style={{ color: 'var(--text-primary)' }}>{period.data.totalCount.toLocaleString('en-IN')}</strong> pieces counted
              </div>

              {/* Sub-total Breakdown Chips: Notes vs Coins */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <div style={{ background: 'var(--bg-subbox)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Banknote size={14} color="var(--blue)" />
                    <span>Notes ({period.data.notesCount})</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--blue)', marginTop: '3px' }}>
                    ₹{period.data.notesAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subbox)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Coins size={14} color="var(--gold-primary)" />
                    <span>Coins ({period.data.coinsCount})</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-gold)', marginTop: '3px' }}>
                    ₹{period.data.coinsAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filter Bar */}
      <div
        className="designer-card no-print"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Period Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '6px' }}>
            Period View:
          </span>
          {[
            { id: 'all', label: 'All 4 Periods' },
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                border: activePeriod === tab.id ? '1px solid var(--border-gold)' : '1px solid var(--border-color)',
                background: activePeriod === tab.id ? 'var(--gold-primary)' : 'var(--bg-subbox)',
                color: activePeriod === tab.id ? 'var(--gold-btn-text)' : 'var(--text-secondary)',
                fontWeight: activePeriod === tab.id ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Currency Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '6px' }}>
            Currency Type:
          </span>
          {[
            { id: 'all', label: 'All Items (11)' },
            { id: 'note', label: 'Banknotes Only (6)' },
            { id: 'coin', label: 'Coins Only (5)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '10px',
                border: typeFilter === tab.id ? '1px solid var(--blue)' : '1px solid var(--border-color)',
                background: typeFilter === tab.id ? 'var(--blue)' : 'var(--bg-subbox)',
                color: typeFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: typeFilter === tab.id ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Currency Cards Grid: Banknotes & Coins */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredList.map((item) => {
          return (
            <div
              key={item.id}
              className="banknote-card"
              style={{
                borderTop: `4px solid ${item.color}`
              }}
            >
              {/* Card Header: Value & Type Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: item.type === 'coin' ? '50%' : '12px',
                      background: item.color,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      boxShadow: `0 4px 14px ${item.color}55`,
                      border: item.type === 'coin' ? '2px dashed rgba(255,255,255,0.6)' : 'none'
                    }}
                  >
                    {item.type === 'note' ? <Banknote size={22} strokeWidth={2.4} /> : <Coins size={22} strokeWidth={2.4} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Face Value: ₹{item.value} {item.type === 'note' ? 'Banknote' : 'Metallic Coin'}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: 'var(--bg-subbox)',
                    color: item.color,
                    border: `1px solid ${item.color}`,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {item.type.toUpperCase()}
                </span>
              </div>

              {/* 4 Periods Breakdown Matrix */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: activePeriod === 'all' ? 'repeat(4, 1fr)' : '1fr',
                  gap: '8px',
                  background: 'var(--bg-subbox)',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Daily */}
                {(activePeriod === 'all' || activePeriod === 'daily') && (
                  <div style={{ textAlign: 'center', padding: '4px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Daily</div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {(item.daily || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 800 }}>
                      ₹{((item.daily || 0) * item.value).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                {/* Weekly */}
                {(activePeriod === 'all' || activePeriod === 'weekly') && (
                  <div style={{ textAlign: 'center', padding: '4px', borderLeft: activePeriod === 'all' ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Weekly</div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {(item.weekly || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--blue)', fontWeight: 800 }}>
                      ₹{((item.weekly || 0) * item.value).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                {/* Monthly */}
                {(activePeriod === 'all' || activePeriod === 'monthly') && (
                  <div style={{ textAlign: 'center', padding: '4px', borderLeft: activePeriod === 'all' ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Monthly</div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {(item.monthly || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 800 }}>
                      ₹{((item.monthly || 0) * item.value).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                {/* Yearly */}
                {(activePeriod === 'all' || activePeriod === 'yearly') && (
                  <div style={{ textAlign: 'center', padding: '4px', borderLeft: activePeriod === 'all' ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Yearly</div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                      {(item.yearly || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 800 }}>
                      ₹{((item.yearly || 0) * item.value).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Counter Tally Controls */}
              <div
                className="no-print"
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Quick {activePeriod === 'all' ? 'Daily' : activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Tally:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => quickUpdateCount(item.id, -1)}
                    className="tally-btn"
                    title="Subtract 1"
                    style={{ color: '#dc2626' }}
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => quickUpdateCount(item.id, 1)}
                    className="tally-btn"
                    title="Add 1"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => quickUpdateCount(item.id, 5)}
                    className="tally-btn"
                    title="Add 5"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => quickUpdateCount(item.id, 10)}
                    className="tally-btn"
                    title="Add 10"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Sub-Totals & Grand Consolidated Totals Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Notes Subtotal */}
        <div
          className="designer-card"
          style={{
            padding: '24px 28px',
            background: 'var(--emerald-card-bg)',
            border: '1.5px solid var(--emerald-card-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--emerald)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Banknote size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Banknotes Subtotal
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                ₹500, ₹200, ₹100, ₹50, ₹20 & ₹10 notes
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ₹{totals[activePeriod === 'all' ? 'daily' : activePeriod].notesAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--emerald)', fontWeight: 700, marginTop: '5px' }}>
            Count: {totals[activePeriod === 'all' ? 'daily' : activePeriod].notesCount.toLocaleString('en-IN')} banknotes ({activePeriod.toUpperCase()})
          </div>
        </div>

        {/* Coins Subtotal */}
        <div
          className="designer-card"
          style={{
            padding: '24px 28px',
            background: 'var(--gold-card-bg)',
            border: '1.5px solid var(--gold-card-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--gold-primary)',
                color: 'var(--gold-btn-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Coins size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coins Subtotal
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                ₹20, ₹10, ₹5, ₹2 & ₹1 metallic coins
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ₹{totals[activePeriod === 'all' ? 'daily' : activePeriod].coinsAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-gold)', fontWeight: 700, marginTop: '5px' }}>
            Count: {totals[activePeriod === 'all' ? 'daily' : activePeriod].coinsCount.toLocaleString('en-IN')} coins ({activePeriod.toUpperCase()})
          </div>
        </div>

        {/* Consolidated Grand Total */}
        <div
          className="designer-card"
          style={{
            padding: '24px 28px',
            background: 'var(--gold-card-bg)',
            border: '2px solid var(--border-gold)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Consolidated Grand Total
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'var(--emerald-card-bg)',
                color: 'var(--emerald)',
                border: '1px solid var(--emerald-card-border)',
                fontSize: '0.74rem',
                fontWeight: 800
              }}
            >
              <ShieldCheck size={14} />
              <span>Panchanama Verified</span>
            </span>
          </div>

          <div style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            ₹{totals[activePeriod === 'all' ? 'daily' : activePeriod].totalAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-gold)', fontWeight: 700, marginTop: '5px' }}>
            Total <strong>{totals[activePeriod === 'all' ? 'daily' : activePeriod].totalCount.toLocaleString('en-IN')}</strong> pieces (Notes + Coins)
          </div>
        </div>
      </div>

      {/* 6. Modal: Record Cash Count */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--border-gold)',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--card-bg)',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--gold-primary)',
                    color: 'var(--gold-btn-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlusCircle size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Record Physical Cash Count
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Dual-Key Hundi Panchanama Entry & MySQL Synchronization
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'var(--bg-subbox)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '7px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCounts} style={{ padding: '26px 28px' }}>
              {/* Target Period & Mode Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Target Counting Period
                  </label>
                  <select
                    value={modalPeriod}
                    onChange={(e) => setModalPeriod(e.target.value)}
                    className="custom-select"
                  >
                    <option value="daily">Daily Count (Auto-increments Week/Month/Year)</option>
                    <option value="weekly">Weekly Count</option>
                    <option value="monthly">Monthly Count</option>
                    <option value="yearly">Yearly Count</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Operation Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setEntryMode('add')}
                      style={{
                        padding: '11px',
                        borderRadius: '10px',
                        border: entryMode === 'add' ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                        background: entryMode === 'add' ? 'var(--gold-card-bg)' : 'var(--bg-subbox)',
                        color: entryMode === 'add' ? 'var(--text-gold)' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Add to Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('set')}
                      style={{
                        padding: '11px',
                        borderRadius: '10px',
                        border: entryMode === 'set' ? '2px solid var(--blue)' : '1px solid var(--border-color)',
                        background: entryMode === 'set' ? 'var(--blue-card-bg)' : 'var(--bg-subbox)',
                        color: entryMode === 'set' ? 'var(--blue)' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      Overwrite Value
                    </button>
                  </div>
                </div>
              </div>

              {/* Denominations Input Matrix */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Enter Pieces Counted per Denomination:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {denominations.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--bg-subbox)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={entryCounts[item.id] || ''}
                        onChange={(e) =>
                          setEntryCounts({
                            ...entryCounts,
                            [item.id]: e.target.value
                          })
                        }
                        style={{
                          width: '100px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Submit Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                >
                  <CheckCircle2 size={18} />
                  <span>Save & Sync to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
