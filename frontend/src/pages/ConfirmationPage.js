// src/pages/ConfirmationPage.js
import React, { useState } from 'react';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const min = m || '00';
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${min} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
  if (!d) return '';
  // d may be 'YYYY-MM-DD' or ISO string
  const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  const [y, mo, day] = s.split('-');
  const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(day));
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConfirmationPage({ booking: b, onHome, onManage }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(b.booking_token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="confirm-page fade-up">
      <div className="confirm-card">

        {/* Success header */}
        <div className="confirm-top">
          <div className="confirm-anim">✅</div>
          <div className="confirm-title">Booking Confirmed!</div>
          <div className="confirm-sub">
            Your EV charging slot is reserved at <strong>{b.station_name}</strong>
          </div>
        </div>

        {/* Token */}
        <div className="token-section">
          <div className="token-label">🔐 Your Booking Token — Save This!</div>
          <div className="token-box">
            <div className="token-val">{b.booking_token}</div>
            <button className="copy-btn" onClick={copy}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="token-warn">
            ⚠️ This token is your only way to view or cancel your booking. Save it now!
          </div>
        </div>

        {/* Details */}
        <div className="confirm-details">
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)' }}>
            Booking Details
          </div>
          <div className="detail-grid">
            {[
              ['Station',      b.station_name],
              ['Date',         fmtDate(b.booking_date)],
              ['Time',         `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`],
              ['Amount',       `₹${b.amount}`],
              ['Name',         b.user_name],
              ['Vehicle No.',  b.vehicle_number],
              ['Vehicle Type', b.vehicle_type],
              ['Status',       '✅ Confirmed'],
            ].map(([label, val]) => (
              <div key={label} className="detail-cell">
                <div className="d-label">{label}</div>
                <div className={`d-value ${label === 'Status' ? 'green' : label === 'Amount' || label === 'Time' ? 'accent' : ''}`}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What's next */}
        <div style={{ padding: '0 28px 22px' }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--accent)' }}>
              📌 What's Next?
            </div>
            <ol style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '2', paddingLeft: '18px' }}>
              <li>Arrive at <strong style={{ color: 'var(--text)' }}>{b.station_name}</strong> on <strong style={{ color: 'var(--text)' }}>{fmtDate(b.booking_date)}</strong></li>
              <li>Show your token <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{b.booking_token.substring(0, 16)}…</strong> to station staff</li>
              <li>Plug in your <strong style={{ color: 'var(--text)' }}>{b.vehicle_number}</strong> and start charging!</li>
              <li>Need to cancel? Click <strong style={{ color: 'var(--text)' }}>Manage This Booking</strong> below</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="confirm-actions">
          <button className="btn-primary" onClick={onHome}>⚡ Book Another</button>
          <button className="btn-secondary" onClick={onManage}>📋 Manage This Booking</button>
        </div>
      </div>
    </div>
  );
}
