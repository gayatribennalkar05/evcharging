// src/pages/ManagePage.js
import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../services/api';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const min = m || '00';
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${min} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
  if (!d) return '';
  const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  const [y, mo, day] = s.split('-');
  const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(day));
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_PILL_CLASS = {
  confirmed: 'status-confirmed',
  cancelled: 'status-cancelled',
  completed: 'status-completed',
};

export default function ManagePage({ onBack, initialToken = '' }) {
  const [token,      setToken]      = useState(initialToken);
  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [review,     setReview]     = useState({ rating: 0, comment: '', reviewer_name: '' });
  const [reviewDone, setReviewDone] = useState(false);
  const [hoverStar,  setHoverStar]  = useState(0);

  // Auto-search if token was passed from ConfirmationPage
  useEffect(() => {
    if (initialToken && initialToken.length > 10) {
      doSearch(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  const doSearch = async (tok) => {
    const t = tok || token;
    if (!t.trim()) return setError('Please enter your booking token');
    setLoading(true);
    setError(null);
    setBooking(null);
    setSuccess(null);
    setShowReview(false);
    setReviewDone(false);
    try {
      const r = await bookingAPI.getByToken(t.trim());
      setBooking(r.data);
    } catch (e) {
      setError(e.message || 'Booking not found. Please check your token.');
    } finally {
      setLoading(false); }
  };

  const handleSearch = () => doSearch(token);

  const cancel = async () => {
    if (!window.confirm('Cancel this booking? The slot will be released for others.')) return;
    setCancelling(true);
    setError(null);
    try {
      await bookingAPI.cancel(token.trim());
      setSuccess('✅ Booking cancelled successfully. The slot is now free for others.');
      setBooking(b => ({ ...b, status: 'cancelled' }));
    } catch (e) {
      setError(e.message || 'Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const submitReview = async () => {
    if (!review.rating) return setError('Please select a star rating first.');
    setError(null);
    try {
      await bookingAPI.addReview(token.trim(), {
        station_id:    booking.station_id,
        rating:        review.rating,
        comment:       review.comment,
        reviewer_name: review.reviewer_name
      });
      setReviewDone(true);
      setSuccess('⭐ Thank you! Your review has been submitted.');
    } catch (e) {
      setError(e.message || 'Failed to submit review.');
    }
  };

  const canCancel = booking?.status === 'confirmed';

  return (
    <div className="manage-page fade-up">
      <div className="manage-hero">
        <h2>📋 My Booking</h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>
          Enter your booking token to view, cancel, or leave a review
        </p>
      </div>

      {/* Token Search */}
      <div className="token-search">
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
          Your booking token looks like:{' '}
          <code style={{
            color: 'var(--accent)', background: 'var(--bg2)',
            padding: '2px 8px', borderRadius: '5px', fontSize: '12px',
            fontFamily: 'monospace', border: '1px solid var(--border)'
          }}>
            EVC-XXXXXXXXXXXX-XXXX
          </code>
        </div>
        <div className="token-row">
          <input
            className="token-input"
            placeholder="Paste your booking token here…"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}
            style={{ padding: '11px 20px', borderRadius: '10px', whiteSpace: 'nowrap', flex: 'none' }}>
            {loading ? '⏳' : '🔍 Find'}
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-err">❌ {error}</div>}
      {success && <div className="alert alert-ok">{success}</div>}

      {booking && (
        <div className="booking-detail-card">
          {/* Header */}
          <div className="bdc-header">
            <div>
              <div className="bdc-title">{booking.station_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '3px' }}>
                📍 {booking.station_address}
              </div>
            </div>
            <span className={`status-pill ${STATUS_PILL_CLASS[booking.status] || ''}`}>
              {booking.status.toUpperCase()}
            </span>
          </div>

          {/* Details */}
          <div className="bdc-rows">
            {[
              ['📅 Date',       fmtDate(booking.booking_date)],
              ['🕐 Time',       `${fmtTime(booking.start_time)} – ${fmtTime(booking.end_time)}`],
              ['⚡ Charger',    booking.charger_type],
              ['🚗 Vehicle',    `${booking.vehicle_number} (${booking.vehicle_type})`],
              ['👤 Name',       booking.user_name],
              ['📧 Email',      booking.user_email],
              ['📱 Phone',      booking.user_phone],
              ['💰 Amount',     `₹${booking.amount}`],
              ['🎟️ Token',      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent)', wordBreak: 'break-all' }}>{booking.booking_token}</span>],
              ['🕒 Booked On',  new Date(booking.created_at).toLocaleString('en-IN')],
              booking.cancelled_at ? ['❌ Cancelled', new Date(booking.cancelled_at).toLocaleString('en-IN')] : null,
              booking.notes       ? ['📝 Notes',     booking.notes] : null,
            ].filter(Boolean).map(([k, v], i) => (
              <div key={i} className="bdc-row">
                <span className="bdc-key">{k}</span>
                <span className="bdc-val">{v}</span>
              </div>
            ))}
          </div>

          {/* Cancel */}
          {canCancel && (
            <div className="cancel-zone">
              <span className="cancel-note">⚠️ Cancellation allowed for future bookings only</span>
              <button className="btn-cancel" onClick={cancel} disabled={cancelling}>
                {cancelling ? '⏳ Cancelling…' : '🚫 Cancel Booking'}
              </button>
            </div>
          )}

          {/* Review */}
          {(booking.status === 'confirmed' || booking.status === 'completed') && !reviewDone && (
            <div className="review-zone">
              {!showReview ? (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                  onClick={() => setShowReview(true)}
                >
                  ⭐ Leave a Review
                </button>
              ) : (
                <>
                  <h4>Rate your experience at {booking.station_name}</h4>
                  <div className="star-row">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`star-btn ${n <= (hoverStar || review.rating) ? 'lit' : ''}`}
                        onMouseEnter={() => setHoverStar(n)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setReview(r => ({ ...r, rating: n }))}
                      >
                        {n <= (hoverStar || review.rating) ? '★' : '☆'}
                      </button>
                    ))}
                    <span style={{ fontSize: '13px', color: 'var(--text2)', marginLeft: '8px' }}>
                      {review.rating ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][review.rating] : 'Select rating'}
                    </span>
                  </div>
                  <div className="form-row" style={{ marginBottom: '10px' }}>
                    <input
                      className="inp"
                      placeholder="Your name (optional)"
                      value={review.reviewer_name}
                      onChange={e => setReview(r => ({ ...r, reviewer_name: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <textarea
                      className="inp"
                      rows={3}
                      placeholder="Share your experience (optional)…"
                      value={review.comment}
                      onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 'none', padding: '9px 20px', fontSize: '13px', borderRadius: '8px' }}
                      onClick={submitReview}
                    >
                      Submit Review
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ flex: 'none', padding: '9px 20px', fontSize: '13px', borderRadius: '8px' }}
                      onClick={() => setShowReview(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {reviewDone && (
            <div style={{ padding: '16px 22px' }}>
              <div className="alert alert-ok">⭐ Thank you for your review!</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '28px' }}>
        <button className="back-btn" onClick={onBack}>← Back to Stations</button>
      </div>
    </div>
  );
}
