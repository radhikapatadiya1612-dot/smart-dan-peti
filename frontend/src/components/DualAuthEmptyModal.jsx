import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export default function DualAuthEmptyModal({ isOpen, onClose, box, users = [], onEmptied }) {
  if (!isOpen || !box) return null;

  const [user1Id, setUser1Id] = useState(users[0]?.id || 1);
  const [user2Id, setUser2Id] = useState(users[1]?.id || 2);
  const [sealBagNumber, setSealBagNumber] = useState(`SEAL-BAG-${Math.floor(100000 + Math.random() * 900000)}`);
  const [notes, setNotes] = useState('Standard scheduled weekend dual-key cash clearance.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmpty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (parseInt(user1Id, 10) === parseInt(user2Id, 10)) {
      setError('Dual authentication requires two distinct authorized trustees / officials.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.emptyBoxDualAuth(box.id, {
        user1_id: user1Id,
        user2_id: user2Id,
        seal_bag_number: sealBagNumber,
        notes
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Smart Dan Peti emptied and sealed successfully.');
        if (onEmptied) onEmptied();
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1800);
      } else {
        setError(res.error || 'Failed to empty box.');
      }
    } catch (err) {
      setError('Server error during dual-key authorization.');
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
          maxWidth: '520px',
          width: '92%',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden'
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
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                Dual-Key Cash Box Emptying
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                {box.name} ({box.box_uid})
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Info card */}
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Current Cash Inside
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                ₹{parseFloat(box.current_cash_amount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Sensor Weight / Fill %
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                {box.weight_kg} kg ({box.fill_percentage}%)
              </div>
            </div>
          </div>

          <form onSubmit={handleEmpty}>
            {/* User 1 Selection */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Key Holder #1 (Primary Official / Trustee)
              </label>
              <select
                value={user1Id}
                onChange={(e) => setUser1Id(e.target.value)}
                className="custom-select"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* User 2 Selection */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Key Holder #2 (Auditor / Co-Trustee / Priest)
              </label>
              <select
                value={user2Id}
                onChange={(e) => setUser2Id(e.target.value)}
                className="custom-select"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Tamper Seal Bag # */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Security Tamper-Proof Seal Bag Number
              </label>
              <input
                type="text"
                value={sealBagNumber}
                onChange={(e) => setSealBagNumber(e.target.value)}
                className="custom-input"
                required
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Audit Verification Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="custom-input"
              />
            </div>

            {/* Alerts */}
            {error && (
              <div style={{ marginBottom: '14px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.82rem' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ marginBottom: '14px', padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontWeight: 700
                }}
              >
                {submitting ? 'Verifying Dual-Key...' : 'Authorize & Seal Box'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
