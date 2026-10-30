import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download, Landmark } from 'lucide-react';

export default function DonationReceiptModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.created_at
    ? new Date(receipt.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('en-IN');

  const amount = parseFloat(receipt.amount || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content receipt-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Top Actions */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
            Official Electronic Trust Donation Receipt
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print / Save
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="printable-receipt" style={{ padding: '28px' }}>
          {/* Trust Banner */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #f59e0b', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <Landmark size={24} color="#d97706" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                SRI MAHA MANDIR TRUST
              </h2>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Registered Religious & Charitable Trust | Smart Dan Peti Electronic Audit System
            </div>
            <div style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 700, marginTop: '4px' }}>
              80G Tax Exemption Reg. No: AAATS1234F/80G/2022-23
            </div>
          </div>

          {/* Receipt & Transaction Reference */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '16px', color: '#475569' }}>
            <div>
              <div><strong>Receipt No:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{receipt.receipt_number}</span></div>
              <div style={{ marginTop: '3px' }}><strong>Date & Time:</strong> {formattedDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Txn Ref:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{receipt.transaction_id}</span></div>
              <div style={{ marginTop: '3px' }}><strong>Payment Mode:</strong> {receipt.payment_method?.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Donor Particulars Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Donor Information
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {receipt.donor_name || 'Anonymous Devotee'}
            </div>
            {receipt.donor_pan && (
              <div style={{ fontSize: '0.82rem', color: '#0284c7', marginTop: '3px', fontWeight: 600 }}>
                PAN: {receipt.donor_pan} (80G Eligible)
              </div>
            )}
            {receipt.donor_phone && (
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Contact: {receipt.donor_phone}
              </div>
            )}
          </div>

          {/* Cause and Amount */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Description / Seva</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', color: '#475569' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.cause_name || 'General Trust Corpus Fund'}</div>
                    {receipt.sankalp_text && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                        Devotee Sankalp: "{receipt.sankalp_text}"
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a' }}>
                    ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification QR and Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  fontSize: '0.65rem',
                  color: '#64748b',
                  textAlign: 'center',
                  padding: '4px'
                }}
              >
                [VERIFIED QR CODE]
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                <div style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Digitally Signed & Sealed
                </div>
                <div>Scan QR to verify authentic trust receipt on portal.</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.74rem', color: '#64748b' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Authorized Signature</div>
              <div>Chief Financial Trustee</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
