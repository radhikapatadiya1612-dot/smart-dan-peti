import React, { useState } from 'react';
import { X, ScanLine, AlertCircle, CheckCircle, Sparkles, Cpu } from 'lucide-react';
import { api } from '../api/client';

export default function SimulateDetectionModal({ isOpen, onClose, onDetectionCreated, devices = [], causes = [] }) {
  if (!isOpen) return null;

  const [boxId, setBoxId] = useState(devices[0]?.id || 1);
  const [denomination, setDenomination] = useState(500);
  const [causeId, setCauseId] = useState(causes[0]?.id || 1);
  const [confidence, setConfidence] = useState(0.94);
  const [sensorType, setSensorType] = useState('OPTICAL_SPECTRAL');
  const [notes, setNotes] = useState('Simulated optical scan with UV watermark and magnetic thread verification.');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const denomOptions = [
    { value: 500, label: '₹500 Note', color: '#3b82f6' },
    { value: 200, label: '₹200 Note', color: '#f59e0b' },
    { value: 100, label: '₹100 Note', color: '#8b5cf6' },
    { value: 50, label: '₹50 Note', color: '#10b981' },
    { value: 20, label: '₹20 Note', color: '#ec4899' },
    { value: 10, label: '₹10 Note', color: '#6366f1' }
  ];

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const payload = {
      box_id: boxId,
      detected_denomination: denomination,
      cause_id: causeId,
      confidence_score: confidence,
      sensor_type: sensorType,
      notes
    };

    try {
      const res = await api.simulateDetection(payload);
      if (res.success) {
        setResult({
          success: true,
          message: res.message || `₹${denomination} note captured in buffer for review.`
        });
        if (onDetectionCreated) onDetectionCreated();
        setTimeout(() => {
          onClose();
          setResult(null);
        }, 1500);
      } else {
        setResult({ success: false, message: res.error || 'Failed to simulate detection' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Server communication error' });
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
          maxWidth: '560px',
          width: '92%',
          background: 'var(--card-bg)',
          borderRadius: '18px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(245, 158, 11, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ScanLine size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                Demo Detection Simulator
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                Test Bill Validator & Optical AI Pipeline
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div
          style={{
            margin: '18px 24px 0',
            padding: '12px 14px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            display: 'flex',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#93c5fd'
          }}
        >
          <Cpu size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
          <div>
            <strong>Hardware Test Simulation:</strong> This generates synthetic banknote sensor events
            for testing verification workflows. Physical camera/spectral sensors trigger when live IoT hardware is plugged in.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSimulate} style={{ padding: '20px 24px' }}>
          {/* Denomination Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Select Banknote Denomination
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {denomOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDenomination(opt.value)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: denomination === opt.value ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                    background: denomination === opt.value ? `${opt.color}22` : 'rgba(255, 255, 255, 0.03)',
                    color: denomination === opt.value ? opt.color : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Box Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Target Smart Dan Peti
              </label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="custom-select"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.box_uid})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Dedicated Seva / Cause
              </label>
              <select
                value={causeId}
                onChange={(e) => setCauseId(e.target.value)}
                className="custom-select"
              >
                {causes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Confidence Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Simulated AI Confidence Score
              </label>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: confidence >= 0.85 ? '#10b981' : '#f59e0b' }}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>50% (Uncertain - Requires Review)</span>
              <span>85% (Good)</span>
              <span>99% (Crisp Verified)</span>
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: result.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: result.success ? '#10b981' : '#ef4444',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{result.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
              {submitting ? 'Scanning...' : 'Trigger Note Insertion Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
