import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Mail, Phone, Lock, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    phone: '',
    pan_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        // Fallback default list
        setUsers([
          { id: 1, name: 'Srikanth Ramanathan', email: 'admin@smartdanpeti.org', role: 'ADMIN', phone: '+91 98765 43210', pan_number: 'ABCDE1234F', is_active: 1 },
          { id: 2, name: 'Mahant Aniruddha Das', email: 'trustee@smartdanpeti.org', role: 'TRUSTEE', phone: '+91 98765 43211', pan_number: 'TRUST9876G', is_active: 1 },
          { id: 3, name: 'Pandit Radheshyam', email: 'priest@smartdanpeti.org', role: 'PRIEST', phone: '+91 98765 43212', pan_number: 'PRIEST123H', is_active: 1 },
          { id: 4, name: 'Suresh K. Auditor', email: 'auditor@smartdanpeti.org', role: 'AUDITOR', phone: '+91 98765 43213', pan_number: 'AUDIT4567J', is_active: 1 },
          { id: 5, name: 'Sunil Sharma', email: 'operator@smartdanpeti.org', role: 'OPERATOR', phone: '+91 98765 43214', pan_number: 'OPERA1234K', is_active: 1 }
        ]);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      const res = await api.register(formData);
      if (res.success) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', role: 'OPERATOR', phone: '', pan_number: '' });
        fetchUsers();
      } else {
        setModalError(res.error || 'Failed to create user');
      }
    } catch (err) {
      setModalError('Server error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const roleColors = {
    ADMIN: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Full system control, box config, financial approvals' },
    TRUSTEE: { text: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', desc: 'Dual-key clearance, expense oversight, high governance' },
    AUDITOR: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', desc: 'Banknote verification review, ledger audit, compliance' },
    PRIEST: { text: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', desc: 'Sankalp blessing, pooja seva, dual-key sanctum clearance' },
    OPERATOR: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', desc: 'Kiosk oversight, sensor log inspection, ticket monitoring' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner and Add User */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Authorized Trust Personnel & Role-Based Access (RBAC)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cryptographically signed dual-key and audit permission privileges
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            color: '#111827',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <UserPlus size={16} /> Add Authorized Official
        </button>
      </div>

      {/* Role Permission Descriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {Object.entries(roleColors).map(([rName, rMeta]) => (
          <div
            key={rName}
            style={{
              background: 'var(--card-bg)',
              border: `1px solid ${rMeta.text}33`,
              borderRadius: '12px',
              padding: '14px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '6px',
                background: rMeta.bg,
                color: rMeta.text,
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              {rName}
            </span>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
              {rMeta.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Official Name</th>
                <th>Email Address</th>
                <th>Role & Access Level</th>
                <th>Phone Number</th>
                <th>Trust PAN / ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const rStyle = roleColors[u.role] || roleColors.OPERATOR;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                      {u.id === currentUser?.id && (
                        <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                          (Current Active Session)
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: rStyle.bg,
                          color: rStyle.text,
                          fontWeight: 700,
                          fontSize: '0.74rem'
                        }}
                      >
                        <Shield size={12} /> {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.phone || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.8rem' }}>
                      {u.pan_number || 'N/A'}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: u.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.is_active ? '#10b981' : '#ef4444'
                        }}
                      >
                        <CheckCircle size={12} /> {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '92%',
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '24px',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Add Authorized Official</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modalError && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.8rem' }}>
                  {modalError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mahant Ramanuja"
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Trust Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="official@smartdanpeti.org"
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Assigned RBAC Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="custom-select"
                >
                  <option value="ADMIN">ADMIN (Full Permissions)</option>
                  <option value="TRUSTEE">TRUSTEE (Dual-Key Clearance)</option>
                  <option value="AUDITOR">AUDITOR (Ledger & Sensor Verification)</option>
                  <option value="PRIEST">PRIEST (Pooja Seva & Sanctum Clearance)</option>
                  <option value="OPERATOR">OPERATOR (Kiosk Monitoring)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="custom-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ background: '#f59e0b', color: '#111827', fontWeight: 700 }}>
                  {submitting ? 'Creating...' : 'Grant Role & Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
