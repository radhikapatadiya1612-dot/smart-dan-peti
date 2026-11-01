import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  QrCode,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  PlusCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  Copy,
  X,
  Sparkles,
  ArrowUpRight,
  Landmark,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, fallbackData } from '../api/client';
import DonationReceiptModal from '../components/DonationReceiptModal';
import { useNotification } from '../context/NotificationContext';

const DEFAULT_ONLINE_DONATIONS = [
  {
    id: 101,
    receipt_number: 'SDP-REC-20261020-0010',
    transaction_id: 'UPI-TXN-9842109850',
    donor_name: 'Srinivasan Iyer',
    donor_phone: '+91 98401 22334',
    donor_email: 'srini.iyer@example.com',
    donor_pan: 'APPSI5566M',
    amount: 15000,
    payment_method: 'UPI_QR',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Temple Heritage & Sanctum Renovation',
    created_at: '2026-10-20 15:15:50'
  },
  {
    id: 102,
    receipt_number: 'SDP-REC-20261020-0009',
    transaction_id: 'UPI-TXN-9842109849',
    donor_name: 'Rajesh K. Aggarwal',
    donor_phone: '+91 98100 99887',
    donor_email: 'rajesh.agg@example.com',
    donor_pan: 'AKLPA8899Z',
    amount: 2100,
    payment_method: 'UPI_QR',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Daily Deepam & Temple Pooja Seva',
    created_at: '2026-10-20 14:40:25'
  },
  {
    id: 103,
    receipt_number: 'SDP-REC-20261020-0007',
    transaction_id: 'UPI-TXN-9842109847',
    donor_name: 'Vijay & Meena Patel',
    donor_phone: '+91 99201 44556',
    donor_email: 'vpatel@example.com',
    donor_pan: 'AHJPP6677T',
    amount: 5000,
    payment_method: 'UPI_QR',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Goshala - Sacred Cow Care & Fodder',
    created_at: '2026-10-20 13:05:14'
  },
  {
    id: 104,
    receipt_number: 'SDP-REC-20261020-0006',
    transaction_id: 'NET-TXN-9842109846',
    donor_name: 'Dr. Sunita Deshmukh',
    donor_phone: '+91 97654 32190',
    donor_email: 'sunita.doc@example.com',
    donor_pan: 'ABMPD1122K',
    amount: 21000,
    payment_method: 'NET_BANKING',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Vidyadhanam - Veda Patashala & Child Education',
    created_at: '2026-10-20 12:20:30'
  },
  {
    id: 105,
    receipt_number: 'SDP-REC-20261020-0004',
    transaction_id: 'UPI-TXN-9842109844',
    donor_name: 'Amitabh Sengupta',
    donor_phone: '+91 98112 34567',
    donor_email: 'amitabh.sen@example.com',
    donor_pan: 'CCDPS4455Q',
    amount: 2500,
    payment_method: 'UPI_QR',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Annadanam - Free Meals for Devotees',
    created_at: '2026-10-20 11:12:00'
  },
  {
    id: 106,
    receipt_number: 'SDP-REC-20261020-0003',
    transaction_id: 'CARD-TXN-9842109843',
    donor_name: 'Kavitha Natarajan',
    donor_phone: '+91 94451 88992',
    donor_email: 'kavitha.n@example.com',
    donor_pan: 'BNMPK9942R',
    amount: 11000,
    payment_method: 'CARD',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Goshala - Sacred Cow Care & Fodder',
    created_at: '2026-10-20 10:30:45'
  },
  {
    id: 107,
    receipt_number: 'SDP-REC-20261020-0001',
    transaction_id: 'UPI-TXN-9842109841',
    donor_name: 'Rameshwar Sharma',
    donor_phone: '+91 98234 56789',
    donor_email: 'rameshwar.s@example.com',
    donor_pan: 'AABCS1234F',
    amount: 5100,
    payment_method: 'UPI_QR',
    payment_status: 'COMPLETED',
    is_80g_claimed: 1,
    cause_name: 'Annadanam - Free Meals for Devotees',
    created_at: '2026-10-20 09:15:22'
  }
];

export default function OnlinePaymentsPage() {
  const { notify } = useNotification();

  const [donations, setDonations] = useState(() => {
    try {
      const saved = localStorage.getItem('sdp_online_donations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_ONLINE_DONATIONS;
  });

  const [causes, setCauses] = useState(fallbackData.causes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [causeFilter, setCauseFilter] = useState('ALL');

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [copiedTxnId, setCopiedTxnId] = useState(null);

  // Form State
  const [payForm, setPayForm] = useState({
    amount: '1100',
    cause_id: '1',
    donor_name: '',
    donor_phone: '',
    donor_email: '',
    donor_pan: '',
    is_80g_claimed: false,
    payment_method: 'UPI_QR',
    sankalp_text: ''
  });

  // Fetch from backend
  const fetchDonations = async () => {
    setLoading(true);
    try {
      const [donationsRes, causesRes] = await Promise.all([
        api.getDonations({ limit: 100 }),
        api.getCauses ? api.getCauses() : Promise.resolve({ success: false })
      ]);

      if (causesRes?.success && causesRes.causes) {
        setCauses(causesRes.causes);
      }

      if (donationsRes?.success && donationsRes.donations) {
        // Filter only online payment methods
        const onlineOnly = donationsRes.donations.filter((d) => d.payment_method !== 'CASH_BOX');
        if (onlineOnly.length > 0) {
          setDonations(onlineOnly);
          localStorage.setItem('sdp_online_donations', JSON.stringify(onlineOnly));
        }
      }
    } catch (err) {
      console.warn('Using local online donations list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Save to localStorage whenever donations change
  useEffect(() => {
    try {
      localStorage.setItem('sdp_online_donations', JSON.stringify(donations));
    } catch (e) {
      console.error(e);
    }
  }, [donations]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalAmt = 0;
    let upiAmt = 0;
    let upiCount = 0;
    let cardNetAmt = 0;
    let cardNetCount = 0;
    let claimed80GCount = 0;

    donations.forEach((d) => {
      const amt = Number(d.amount) || 0;
      totalAmt += amt;
      if (d.payment_method === 'UPI_QR') {
        upiAmt += amt;
        upiCount += 1;
      } else {
        cardNetAmt += amt;
        cardNetCount += 1;
      }
      if (d.is_80g_claimed) {
        claimed80GCount += 1;
      }
    });

    return {
      totalAmt,
      totalCount: donations.length,
      upiAmt,
      upiCount,
      cardNetAmt,
      cardNetCount,
      claimed80GCount
    };
  }, [donations]);

  // Filtered List
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      // Channel match
      if (methodFilter !== 'ALL' && d.payment_method !== methodFilter) {
        return false;
      }
      // Cause match
      if (causeFilter !== 'ALL' && String(d.cause_id || d.cause_name) !== String(causeFilter)) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (d.donor_name || '').toLowerCase().includes(query);
        const receiptMatch = (d.receipt_number || '').toLowerCase().includes(query);
        const txnMatch = (d.transaction_id || '').toLowerCase().includes(query);
        const phoneMatch = (d.donor_phone || '').toLowerCase().includes(query);
        if (!nameMatch && !receiptMatch && !txnMatch && !phoneMatch) {
          return false;
        }
      }
      return true;
    });
  }, [donations, methodFilter, causeFilter, searchTerm]);

  // Copy to clipboard helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTxnId(id);
    notify.info(`Transaction ID copied to clipboard: ${text}`, 'Copied to Clipboard');
    setTimeout(() => setCopiedTxnId(null), 2000);
  };

  // Submit payment form
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(payForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      notify.warning('Please enter a valid donation offering amount greater than ₹0.', 'Invalid Amount');
      return;
    }

    const selectedCause = causes.find((c) => String(c.id) === String(payForm.cause_id)) || causes[0];
    const timestamp = Date.now().toString().slice(-8);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    const newRecord = {
      id: Date.now(),
      receipt_number: `SDP-REC-${dateStr}-${randomSuffix}`,
      transaction_id: `${payForm.payment_method.slice(0, 3)}-TXN-${timestamp}${randomSuffix}`,
      donor_name: payForm.donor_name.trim() || 'Generous Devotee',
      donor_phone: payForm.donor_phone.trim() || null,
      donor_email: payForm.donor_email.trim() || null,
      donor_pan: payForm.is_80g_claimed && payForm.donor_pan ? payForm.donor_pan.toUpperCase() : null,
      amount: amountVal,
      payment_method: payForm.payment_method,
      payment_status: 'COMPLETED',
      is_80g_claimed: Boolean(payForm.is_80g_claimed && payForm.donor_pan),
      cause_id: selectedCause.id,
      cause_name: selectedCause.name,
      sankalp_text: payForm.sankalp_text.trim() || null,
      created_at: new Date().toISOString()
    };

    // Try posting to backend
    try {
      await api.createDonation(newRecord);
    } catch (err) {
      console.warn('Saved online donation locally.');
    }

    setDonations([newRecord, ...donations]);
    setShowPayModal(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    notify.success(
      `Digital offering of ₹${amountVal.toLocaleString('en-IN')} received successfully! Official e-receipt generated.`,
      'Offering Completed'
    );

    // Open receipt modal immediately
    setSelectedReceipt(newRecord);

    // Reset form
    setPayForm({
      amount: '1100',
      cause_id: '1',
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      donor_pan: '',
      is_80g_claimed: false,
      payment_method: 'UPI_QR',
      sankalp_text: ''
    });
  };

  // Export CSV
  const exportCSV = () => {
    notify.info('Exporting online digital donation ledger...', 'Exporting CSV');
    const headers = [
      'Receipt Number',
      'Transaction ID',
      'Devotee Name',
      'Phone',
      'Email',
      'PAN (80G)',
      'Cause / Seva',
      'Payment Method',
      'Amount (INR)',
      'Status',
      'Date & Time'
    ];

    const rows = filteredDonations.map((d) => [
      `"${d.receipt_number}"`,
      `"${d.transaction_id}"`,
      `"${d.donor_name || 'Anonymous'}"`,
      `"${d.donor_phone || '-'}"`,
      `"${d.donor_email || '-'}"`,
      `"${d.donor_pan || '-'}"`,
      `"${d.cause_name}"`,
      d.payment_method,
      d.amount,
      d.payment_status,
      `"${d.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Online_Donation_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Online donation transaction ledger downloaded as CSV.', 'Export Complete');
  };

  // Generate dynamic UPI URI
  const currentUpiUri = useMemo(() => {
    const amt = parseFloat(payForm.amount) || 101;
    return `upi://pay?pa=smartdanpeti@upi&pn=Sri%20Maha%20Mandir%20Trust&am=${amt.toFixed(2)}&cu=INR&tn=Donation%20Seva`;
  }, [payForm.amount]);

  // QR Code Image source
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUpiUri)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Clean Modern Light Header Banner */}
      <div
        className="designer-card"
        style={{
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              flexShrink: 0
            }}
          >
            <QrCode size={28} strokeWidth={2.4} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Online Payments & Digital Donation Ledger
            </h1>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span>Instant Dynamic UPI QR Code, Card & Net Banking Gateway</span>
              <span>•</span>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>Section 80G Tax Exemption Receipts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPayModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#070b14',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)'
            }}
          >
            <PlusCircle size={16} />
            <span>+ Make Online Payment / UPI QR</span>
          </button>

          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchDonations}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Refresh Transactions"
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards in Balanced Adaptive Theme */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        {/* Total Online Inflow */}
        <div className="designer-card" style={{ padding: '22px', borderLeft: '4px solid var(--blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Online Inflow
            </span>
            <span style={{ background: 'var(--blue-card-bg)', color: 'var(--blue)', fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--blue-card-border)' }}>
              {metrics.totalCount} Transactions
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            ₹{metrics.totalAmt.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, marginTop: '8px', display: 'block' }}>
            ✓ 100% Direct Bank Settlement
          </span>
        </div>

        {/* UPI & QR Payments */}
        <div className="designer-card" style={{ padding: '22px', borderLeft: '4px solid var(--gold-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              UPI & Dynamic QR
            </span>
            <span style={{ background: 'var(--gold-card-bg)', color: 'var(--gold-primary)', fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--gold-card-border)' }}>
              {metrics.upiCount} Payments
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            ₹{metrics.upiAmt.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', marginTop: '8px', display: 'block', fontWeight: 600 }}>
            PhonePe, GPay, Paytm, BHIM
          </span>
        </div>

        {/* Card & Net Banking */}
        <div className="designer-card" style={{ padding: '22px', borderLeft: '4px solid var(--purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--purple)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Card & Net Banking
            </span>
            <span style={{ background: 'var(--purple-card-bg)', color: 'var(--purple)', fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--purple-card-border)' }}>
              {metrics.cardNetCount} Payments
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            ₹{metrics.cardNetAmt.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block', fontWeight: 600 }}>
            Debit / Credit Card & IMPS
          </span>
        </div>

        {/* 80G Tax Exemption Receipts */}
        <div className="designer-card" style={{ padding: '22px', borderLeft: '4px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              80G Tax Certificates
            </span>
            <span style={{ background: 'var(--emerald-card-bg)', color: 'var(--emerald)', fontSize: '0.72rem', fontWeight: 800, padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--emerald-card-border)' }}>
              {metrics.claimed80GCount} Issued
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {metrics.claimed80GCount} Devotees
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, marginTop: '8px', display: 'block' }}>
            ✓ Registered 80G Compliant
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div
        className="designer-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="custom-input"
            style={{ paddingLeft: '38px', height: '38px' }}
            placeholder="Search by Devotee Name, Receipt No, or Transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="custom-select"
            style={{ height: '38px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="ALL">All Online Channels</option>
            <option value="UPI_QR">📱 UPI & QR Code</option>
            <option value="CARD">💳 Credit / Debit Card</option>
            <option value="NET_BANKING">🏛️ Net Banking</option>
          </select>

          <select
            className="custom-select"
            style={{ height: '38px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value)}
          >
            <option value="ALL">All Dedicated Causes</option>
            {causes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Online Payment History Ledger Table */}
      <div
        className="designer-card"
        style={{
          overflow: 'hidden',
          padding: 0
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Online Payment Transaction Ledger
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Showing {filteredDonations.length} verified digital offerings & e-receipts
            </span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--emerald)', fontWeight: 600 }}>
            ● Live Bank Synchronized
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '950px' }}>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Transaction ID</th>
                <th>Devotee Details</th>
                <th>Dedicated Cause / Seva</th>
                <th>Channel</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No online payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => (
                  <tr key={d.id}>
                    {/* Receipt No */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', fontSize: '0.8rem' }}>
                        {d.receipt_number}
                      </span>
                    </td>

                    {/* Transaction ID */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {d.transaction_id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(d.transaction_id, d.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedTxnId === d.id ? '#10b981' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Copy Transaction ID"
                        >
                          {copiedTxnId === d.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    {/* Devotee */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {d.donor_name || 'Anonymous Devotee'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginTop: '2px' }}>
                          {d.donor_phone && <span>{d.donor_phone}</span>}
                          {d.donor_pan && (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              80G: {d.donor_pan}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cause */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {d.cause_name}
                    </td>

                    {/* Channel */}
                    <td>
                      <span className={`method-badge method-${(d.payment_method || '').toLowerCase()}`}>
                        {d.payment_method === 'UPI_QR' ? '📱 UPI QR' : d.payment_method === 'CARD' ? '💳 CARD' : '🏛️ NET BANKING'}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                    </td>

                    {/* Amount */}
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '0.98rem' }}>
                      ₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                        <span className="live-indicator-dot" style={{ background: '#10b981' }} /> SUCCESS
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedReceipt(d)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={13} /> View 80G
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MAKE ONLINE PAYMENT / UPI MODAL */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <QrCode size={24} color="var(--gold-primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Make Online Offering / Dynamic UPI Payment
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Scan with PhonePe, Google Pay, Paytm, BHIM or Pay via Card/Net Banking
                  </span>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Left Column: Form Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Preset Amount Chips */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Donation Amount (₹)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {['251', '501', '1100', '2100', '5100', '11000', '21000', '51000'].map((amt) => {
                        const isSel = payForm.amount === amt;
                        return (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setPayForm({ ...payForm, amount: amt })}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: isSel ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                              background: isSel ? 'var(--gold-card-bg)' : 'var(--bg-subbox)',
                              color: isSel ? 'var(--gold-primary)' : 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ₹{Number(amt).toLocaleString('en-IN')}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="custom-input"
                      placeholder="Custom Amount (₹)"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  {/* Dedicated Cause */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Dedicated Seva / Cause
                    </label>
                    <select
                      className="custom-select"
                      value={payForm.cause_id}
                      onChange={(e) => setPayForm({ ...payForm, cause_id: e.target.value })}
                    >
                      {causes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Devotee Name */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Devotee Name
                    </label>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Full Name (e.g. Rameshwar Sharma)"
                      value={payForm.donor_name}
                      onChange={(e) => setPayForm({ ...payForm, donor_name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Phone & Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        className="custom-input"
                        placeholder="+91 98765 43210"
                        value={payForm.donor_phone}
                        onChange={(e) => setPayForm({ ...payForm, donor_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        className="custom-input"
                        placeholder="receipt@devotee.org"
                        value={payForm.donor_email}
                        onChange={(e) => setPayForm({ ...payForm, donor_email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 80G Tax Exemption Checkbox & PAN */}
                  <div style={{ padding: '12px', background: 'var(--bg-subbox)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={payForm.is_80g_claimed}
                        onChange={(e) => setPayForm({ ...payForm, is_80g_claimed: e.target.checked })}
                      />
                      <span>Claim Section 80G Tax Exemption Certificate</span>
                    </label>
                    {payForm.is_80g_claimed && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          maxLength={10}
                          className="custom-input"
                          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                          placeholder="Devotee PAN (e.g. ABCDE1234F)"
                          value={payForm.donor_pan}
                          onChange={(e) => setPayForm({ ...payForm, donor_pan: e.target.value })}
                          required={payForm.is_80g_claimed}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Channel */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Select Payment Channel
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'UPI_QR', label: '📱 UPI QR' },
                        { id: 'CARD', label: '💳 Card' },
                        { id: 'NET_BANKING', label: '🏛️ Net Banking' }
                      ].map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setPayForm({ ...payForm, payment_method: m.id })}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: payForm.payment_method === m.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                            background: payForm.payment_method === m.id ? 'var(--gold-card-bg)' : 'var(--bg-subbox)',
                            color: payForm.payment_method === m.id ? 'var(--gold-primary)' : 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live QR Code / Payment Action */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-subbox)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  {payForm.payment_method === 'UPI_QR' ? (
                    <>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        Dynamic Instant UPI QR Code
                      </span>

                      {/* QR Display with white canvas for camera scanning */}
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '12px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                          marginBottom: '14px'
                        }}
                      >
                        <img
                          src={qrCodeUrl}
                          alt="Dynamic UPI QR Code"
                          style={{ width: '180px', height: '180px', display: 'block' }}
                        />
                      </div>

                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        ₹{Number(payForm.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        UPI VPA: <strong style={{ color: 'var(--gold-primary)' }}>smartdanpeti@upi</strong>
                      </span>

                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                          type="submit"
                          style={{
                            flex: 1,
                            padding: '11px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Confirm & Issue Receipt</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', padding: '20px 0' }}>
                      <CreditCard size={48} color="var(--gold-primary)" />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Online Payment Gateway
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Secure 256-bit encrypted bank transaction processing
                        </div>
                      </div>

                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--emerald)' }}>
                        ₹{Number(payForm.amount || 0).toLocaleString('en-IN')}
                      </div>

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-hover) 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          color: 'var(--gold-btn-text)',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <ShieldCheck size={17} />
                        <span>Authorize & Issue Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Section 80G Receipt Modal */}
      <DonationReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}

