import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Receipt, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api/client';

export default function DonationHistoryPage({ onSelectReceipt, causes = [] }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCause, setSelectedCause] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCause) params.cause_id = selectedCause;
      if (selectedMethod) params.payment_method = selectedMethod;

      const res = await api.getDonations(params);
      if (res.success && res.donations) {
        setDonations(res.donations);
      }
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search, selectedCause, selectedMethod]);

  const totalFilteredAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const handleExportCsv = () => {
    if (donations.length === 0) return;
    const headers = ['Receipt No', 'Transaction ID', 'Donor Name', 'Amount', 'Cause', 'Payment Method', 'Date', '80G Claimed'];
    const rows = donations.map((d) => [
      d.receipt_number,
      d.transaction_id,
      `"${d.donor_name}"`,
      d.amount,
      `"${d.cause_name || ''}"`,
      d.payment_method,
      d.created_at,
      d.is_80g_claimed ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Smart_Dan_Peti_Donations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters & Actions Bar */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '18px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search donor, receipt, phone..."
              className="custom-input"
              style={{ paddingLeft: '38px', height: '40px' }}
            />
          </div>

          {/* Cause Filter */}
          <select
            value={selectedCause}
            onChange={(e) => setSelectedCause(e.target.value)}
            className="custom-select"
            style={{ width: 'auto', minWidth: '180px', height: '40px' }}
          >
            <option value="">All Sevas / Causes</option>
            {causes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="custom-select"
            style={{ width: 'auto', minWidth: '160px', height: '40px' }}
          >
            <option value="">All Payment Modes</option>
            <option value="UPI_QR">UPI QR Code</option>
            <option value="CASH_BOX">Physical Cash Box</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="NET_BANKING">Net Banking</option>
          </select>
        </div>

        {/* Export Button & Total Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filtered Value</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
              ₹{totalFilteredAmount.toLocaleString()}
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Donation Ledger Records ({donations.length})
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Immutable electronic audit records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Devotee Name</th>
                <th>Seva / Purpose</th>
                <th>Payment Mode</th>
                <th>Smart Box / Origin</th>
                <th>Date & Time</th>
                <th>80G Tax</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading donation records...
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No donation records found matching criteria.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', fontSize: '0.82rem' }}>
                        {d.receipt_number}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {d.transaction_id}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{d.donor_name}</div>
                      {d.donor_phone && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.donor_phone}</span>}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{d.cause_name}</span>
                    </td>
                    <td>
                      <span className={`method-badge method-${(d.payment_method || '').toLowerCase()}`}>
                        {d.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {d.box_name || 'Online Portal'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </td>
                    <td>
                      {d.is_80g_claimed ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          80G Claimed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>General</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
                      ₹{parseFloat(d.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectReceipt(d)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          color: '#f59e0b',
                          padding: '5px 12px',
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
