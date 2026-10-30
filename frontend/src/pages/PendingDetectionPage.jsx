import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Plus,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

export default function PendingDetectionPage({ onOpenSimulate, onSelectReceipt }) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING or APPROVED
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState({ total_pending: 0, pending_value: 0, avg_confidence: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [overrideMap, setOverrideMap] = useState({});

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingDetections(activeSubTab);
      if (res.success) {
        setDetections(res.detections || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching detections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, [activeSubTab]);

  const handleApprove = async (id, originalDenom) => {
    setActionLoading(id);
    const override = overrideMap[id];
    try {
      const res = await api.approveDetection(id, {
        override_denomination: override || originalDenom,
        notes: override ? `Approved with manual auditor override from ₹${originalDenom} to ₹${override}` : undefined
      });
      if (res.success) {
        fetchDetections();
      }
    } catch (err) {
      console.error('Failed to approve detection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason (e.g. Counterfeit watermark, torn note, foreign token):', 'Torn / Mutilated Note');
    if (!reason) return;

    setActionLoading(id);
    try {
      const res = await api.rejectDetection(id, { reason });
      if (res.success) {
        fetchDetections();
      }
    } catch (err) {
      console.error('Failed to reject detection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Simulation Banner Notice */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ScanLine size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.96rem' }}>
              Banknote Sensor & AI Verification Buffer (Demo Detection Mode)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Optical sensors flag cash insertions for review. When physical camera/validator is connected, live captures appear here.
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSimulate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#111827',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Simulate Banknote Insertion
        </button>
      </div>

      {/* KPI mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Awaiting Review</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {stats.total_pending} notes
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Buffer Value</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{stats.pending_value?.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Sensor Confidence</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {stats.avg_confidence}%
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '22px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          {/* Sub tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSubTab('PENDING')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: activeSubTab === 'PENDING' ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                background: activeSubTab === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: activeSubTab === 'PENDING' ? '#f59e0b' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Pending Buffer ({stats.total_pending})
            </button>
            <button
              onClick={() => setActiveSubTab('APPROVED')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: activeSubTab === 'APPROVED' ? '1px solid #10b981' : '1px solid var(--border-color)',
                background: activeSubTab === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeSubTab === 'APPROVED' ? '#10b981' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Verified History
            </button>
          </div>

          <button
            onClick={fetchDetections}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Detection ID</th>
                <th>Denomination</th>
                <th>Smart Dan Peti</th>
                <th>Sensor Confidence</th>
                <th>Serial / Watermark</th>
                <th>Cause / Seva</th>
                <th>Time Logged</th>
                {activeSubTab === 'PENDING' ? (
                  <th style={{ textAlign: 'center', minWidth: '220px' }}>Audit Decision</th>
                ) : (
                  <th>Reviewed By</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading detection buffer...
                  </td>
                </tr>
              ) : detections.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {activeSubTab === 'PENDING'
                      ? 'No pending banknote detections. Buffer is clear.'
                      : 'No approved records in history.'}
                  </td>
                </tr>
              ) : (
                detections.map((d) => {
                  const confPct = Math.round(parseFloat(d.confidence_score || 0) * 100);
                  const isHighConf = confPct >= 85;
                  const currentOverride = overrideMap[d.id] || d.detected_denomination;

                  return (
                    <tr key={d.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', fontSize: '0.8rem' }}>
                          #DET-{d.id}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {d.mode}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.94rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          ₹{d.detected_denomination}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{d.box_name}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.box_location}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              color: isHighConf ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {confPct}%
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isHighConf ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isHighConf ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {isHighConf ? 'High Match' : 'Review Required'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {d.sensor_type}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.78rem' }}>
                          {d.serial_number_snippet || 'N/A'}
                        </span>
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {d.cause_name}
                      </td>

                      <td style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        {new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      {activeSubTab === 'PENDING' ? (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {/* Override dropdown */}
                            <select
                              value={currentOverride}
                              onChange={(e) => setOverrideMap({ ...overrideMap, [d.id]: parseInt(e.target.value, 10) })}
                              className="custom-select"
                              style={{ width: '90px', padding: '4px 6px', fontSize: '0.74rem' }}
                              title="Override denomination if AI detected incorrectly"
                            >
                              <option value="500">₹500</option>
                              <option value="200">₹200</option>
                              <option value="100">₹100</option>
                              <option value="50">₹50</option>
                              <option value="20">₹20</option>
                              <option value="10">₹10</option>
                            </select>

                            <button
                              disabled={actionLoading === d.id}
                              onClick={() => handleApprove(d.id, d.detected_denomination)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                cursor: 'pointer'
                              }}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>

                            <button
                              disabled={actionLoading === d.id}
                              onClick={() => handleReject(d.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                fontWeight: 600,
                                fontSize: '0.74rem',
                                cursor: 'pointer'
                              }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                          {d.reviewed_by_name || 'System Auditor'}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
