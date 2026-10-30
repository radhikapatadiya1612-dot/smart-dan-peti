import React, { useState, useEffect } from 'react';
import { X, Heart, PlusCircle, CheckCircle2, QrCode } from 'lucide-react';
import { api } from '../api/client';

export default function RecordDonationModal({ isOpen, onClose, causes = [], devices = [], onDonationCreated, onSelectReceipt }) {
  if (!isOpen) return null;

  const [amount, setAmount] = useState('500');
  const [causeId, setCauseId] = useState(causes[0]?.id || 1);
  const [boxId, setBoxId] = useState(devices[0]?.id || 1);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR');
  const [is80gClaimed, setIs80gClaimed] = useState(false);
  const [sankalpText, setSankalpText] = useState('');
  const [devoteeGotra, setDevoteeGotra] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Keep causeId and boxId in sync when causes/devices load
  useEffect(() => {
    if (causes && causes.length > 0) {
      if (!causes.some((c) => String(c.id) === String(causeId))) {
        setCauseId(causes[0].id);
      }
    }
  }, [causes]);

  useEffect(() => {
    if (devices && devices.length > 0) {
      if (!devices.some((d) => String(d.id) === String(boxId))) {
        setBoxId(devices[0].id);
      }
    }
  }, [devices]);

  const quickAmounts = [100, 250, 500, 1100, 2100, 5100, 11000];

  const handleToggle80g = (checked) => {
    setIs80gClaimed(checked);
    if (checked) {
      setIsAnonymous(false);
    }
  };

  const handleToggleAnonymous = (checked) => {
    setIsAnonymous(checked);
    if (checked) {
      setIs80gClaimed(false);
      setDonorPan('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please specify a valid donation amount in INR (greater than 0).');
      return;
    }

    if (is80gClaimed) {
      const cleanPan = (donorPan || '').trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      if (!cleanPan || !panRegex.test(cleanPan)) {
        setError('A valid 10-character Permanent Account Number (PAN) is required for Section 80G tax exemption (e.g. ABCDE1234F).');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: numAmount,
        cause_id: parseInt(causeId, 10),
        box_id: paymentMethod === 'CASH_BOX' && boxId ? parseInt(boxId, 10) : null,
        donor_name: isAnonymous ? 'Anonymous Devotee' : (donorName.trim() || 'Generous Devotee'),
        donor_phone: isAnonymous ? null : (donorPhone.trim() || null),
        donor_email: isAnonymous ? null : (donorEmail.trim() || null),
        donor_pan: is80gClaimed && !isAnonymous ? donorPan.trim().toUpperCase() : null,
        payment_method: paymentMethod,
        is_80g_claimed: Boolean(is80gClaimed && !isAnonymous),
        sankalp_text: sankalpText.trim() || null,
        devotee_gotra: devoteeGotra.trim() || null,
        is_anonymous: isAnonymous
      };

      const res = await api.createDonation(payload);
      if (res.success && res.donation) {
        // Reset form fields
        setAmount('500');
        setDonorName('');
        setDonorPhone('');
        setDonorEmail('');
        setDonorPan('');
        setSankalpText('');
        setDevoteeGotra('');
        setIs80gClaimed(false);
        setIsAnonymous(false);
        setError('');

        // Notify parent to refresh dashboard telemetry and history
        if (onDonationCreated) onDonationCreated(res.donation);

        // Close form modal
        onClose();

        // Immediately open and display the generated receipt
        if (onSelectReceipt) {
          onSelectReceipt(res.donation);
        }
      } else {
        setError(res.error || res.message || 'Failed to record donation. Please verify your connection.');
      }
    } catch (err) {
      setError('Server error during donation creation. Ensure backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '92%',
          background: 'var(--card-bg)',
          borderRadius: '18px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(245, 158, 11, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                Record Sacred Seva Donation
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                Temple Trust Inflow Registry
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{ marginBottom: '14px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {/* Quick Amounts */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Donation Amount (INR)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: amount === q.toString() ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    background: amount === q.toString() ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: amount === q.toString() ? '#f59e0b' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ₹{q}
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="custom-input"
              placeholder="Custom Amount in ₹"
            />
          </div>

          {/* Cause and Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Seva / Dedicated Cause
              </label>
              <select
                value={causeId}
                onChange={(e) => setCauseId(e.target.value)}
                className="custom-select"
              >
                {causes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="custom-select"
              >
                <option value="UPI_QR">UPI QR Code</option>
                <option value="CASH_BOX">Physical Cash Box</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>
          </div>

          {paymentMethod === 'CASH_BOX' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Receiving Smart Dan Peti Box
              </label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="custom-select"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.box_uid})</option>
                ))}
              </select>
            </div>
          )}

          {/* Donor details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Devotee / Donor Name
              </label>
              <input
                type="text"
                disabled={isAnonymous}
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Rameshwar Sharma"
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Contact Phone
              </label>
              <input
                type="text"
                disabled={isAnonymous}
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="custom-input"
              />
            </div>
          </div>

          {/* Sankalp / Prayer */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Devotee Prayer / Sankalp Intent (Optional)
            </label>
            <input
              type="text"
              value={sankalpText}
              onChange={(e) => setSankalpText(e.target.value)}
              placeholder="e.g. Prayers for health, family prosperity, peace"
              className="custom-input"
            />
          </div>

          {/* Checkboxes: 80G & Anonymous */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={is80gClaimed}
                onChange={(e) => setIs80gClaimed(e.target.checked)}
                style={{ accentColor: '#f59e0b' }}
              />
              <span>Claim Section 80G Tax Exemption (Requires PAN)</span>
            </label>

            {is80gClaimed && (
              <input
                type="text"
                value={donorPan}
                onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                placeholder="Permanent Account Number (PAN) e.g. ABCDE1234F"
                className="custom-input"
                required={is80gClaimed}
              />
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ accentColor: '#f59e0b' }}
              />
              <span>Mark as Gupt Daan (Anonymous Offering)</span>
            </label>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#111827',
                fontWeight: 700
              }}
            >
              {submitting ? 'Recording...' : 'Record & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
