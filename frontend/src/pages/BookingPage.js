// src/pages/BookingPage.js
import React, { useState, useEffect } from 'react';
import { stationAPI, bookingAPI } from '../services/api';

const VEHICLE_TYPES = ['2-Wheeler', '4-Wheeler', 'SUV', 'Bus', 'Other'];

const CHARGER_STYLES = {
  CCS:     { bg: '#dbeeff', border: '#3b82f6', color: '#1d4ed8' },
  CHAdeMO: { bg: '#fef3c7', border: '#f59e0b', color: '#92400e' },
  Type2:   { bg: '#dcfce7', border: '#22c55e', color: '#15803d' },
  Type1:   { bg: '#f3e8ff', border: '#a855f7', color: '#6d28d9' },
};

// Format time: '09:00:00' → '9:00 AM'
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const min = m || '00';
  const suffix = hr >= 12 ? 'PM' : 'AM';
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${min} ${suffix}`;
}

// Format date 'YYYY-MM-DD' → 'Mon, 5 Apr 2025'
function fmtDate(d) {
  if (!d) return '';
  const [y, mo, day] = d.split('-');
  const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(day));
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Get today's date in IST as 'YYYY-MM-DD'
function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function maxDateIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setDate(ist.getDate() + 30);
  return ist.toISOString().split('T')[0];
}

// Helper: parse amenities string into array — defined before component to avoid hoisting issues
function getAmenities(station) {
  return station.amenities
    ? station.amenities.split(',').map(a => a.trim()).filter(Boolean)
    : [];
}

export default function BookingPage({ station, onBack, onDone }) {
  const today  = todayIST();
  const maxDay = maxDateIST();

  const defaultCharger = station.charger_types.split(',')[0].trim();

  const [date,       setDate]       = useState(today);
  const [slots,      setSlots]      = useState([]);
  const [selSlot,    setSelSlot]    = useState(null);
  const [sloading,   setSloading]   = useState(false);
  const [slotError,  setSlotError]  = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [form,       setForm]       = useState({
    user_name: '', user_email: '', user_phone: '',
    vehicle_number: '', vehicle_type: '4-Wheeler',
    charger_type: defaultCharger, notes: ''
  });
  const [errors,     setErrors]     = useState({});
  const [apiErr,     setApiErr]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load station reviews once
  useEffect(() => {
    stationAPI.getOne(station.id)
      .then(r => setReviews(r.data?.reviews || []))
      .catch(() => {});
  }, [station.id]);

  // Load slots whenever date changes
  useEffect(() => {
    if (!date) return;
    setSloading(true);
    setSelSlot(null);
    setSlotError(null);
    stationAPI.getSlots(station.id, date)
      .then(r => setSlots(r.data?.slots || []))
      .catch(e => { setSlots([]); setSlotError(e.message); })
      .finally(() => setSloading(false));
  }, [date, station.id]);

  const chargers = station.charger_types.split(',').map(c => c.trim());
  const stationAmenities = getAmenities(station);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.user_name.trim() || form.user_name.trim().length < 2)
      e.user_name = 'Enter your full name (min 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.user_email.trim()))
      e.user_email = 'Enter a valid email address';
    if (!/^[6-9]\d{9}$/.test(form.user_phone.replace(/\D/g, '')))
      e.user_phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.vehicle_number.trim())
      e.vehicle_number = 'Vehicle number is required';
    if (!selSlot)
      e.slot = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiErr(null);
    try {
      const res = await bookingAPI.create({
        station_id:     station.id,
        slot_id:        selSlot.id,
        booking_date:   date,
        user_name:      form.user_name.trim(),
        user_email:     form.user_email.trim(),
        user_phone:     form.user_phone.trim(),
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        vehicle_type:   form.vehicle_type,
        charger_type:   form.charger_type,
        notes:          form.notes.trim() || null
      });
      onDone(res.data);
    } catch (err) {
      setApiErr(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <button className="back-btn" onClick={onBack}>← Back to Stations</button>

      <div className="booking-grid">
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Station info */}
          <div className="section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '5px', color: 'var(--text)' }}>
                  {station.name}
                </h2>
                <p style={{ color: 'var(--text2)', fontSize: '13px' }}>📍 {station.address}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px' }}>
                  <span style={{ color: 'var(--yellow)', fontSize: '14px' }}>
                    {'★'.repeat(Math.round(parseFloat(station.rating)))}
                    {'☆'.repeat(5 - Math.round(parseFloat(station.rating)))}
                  </span>
                  <span style={{ fontWeight: 700 }}>{parseFloat(station.rating).toFixed(1)}</span>
                  <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
                    ({station.total_reviews} reviews)
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)' }}>
                  ₹{station.price_per_hour}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>per hour</div>
              </div>
            </div>

            {/* Charger selector */}
            <div style={{ marginBottom: stationAmenities.length > 0 ? '14px' : '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Select Charger Type
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {chargers.map(c => {
                  const style = CHARGER_STYLES[c] || CHARGER_STYLES.Type2;
                  const selected = form.charger_type === c;
                  return (
                    <button key={c} onClick={() => set('charger_type', c)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                        transition: 'all 0.18s',
                        background: selected ? style.bg : 'var(--bg2)',
                        border: selected ? `2px solid ${style.border}` : '1px solid var(--border)',
                        color: selected ? style.color : 'var(--text2)',
                      }}
                    >
                      ⚡ {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            {stationAmenities.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {stationAmenities.map(a => (
                  <span key={a} className="amenity-tag">{a}</span>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="section-box">
            <div className="section-head">📅 Select Date</div>
            <input
              type="date"
              className="date-input"
              value={date}
              min={today}
              max={maxDay}
              onChange={e => setDate(e.target.value)}
            />
            {date && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                📌 {fmtDate(date)}
              </div>
            )}
          </div>

          {/* Time Slot Picker */}
          <div className="section-box">
            <div className="section-head">🕐 Select Time Slot</div>
            {errors.slot && (
              <div className="alert alert-err" style={{ marginBottom: '12px' }}>
                ⚠️ {errors.slot}
              </div>
            )}
            {sloading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', color: 'var(--text2)' }}>
                <div className="spinner" style={{ width: '22px', height: '22px', borderWidth: '2px' }}></div>
                Loading available slots…
              </div>
            ) : slotError ? (
              <div className="alert alert-err">{slotError}</div>
            ) : slots.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontSize: '13px', padding: '12px 0' }}>
                No slots available for this date.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px', fontWeight: 500 }}>
                  {slots.filter(s => s.is_available && !s.is_past).length} slots available
                </div>
                <div className="slots-grid">
                  {slots.map(slot => {
                    const disabled = !slot.is_available || slot.is_past;
                    const selected = selSlot?.id === slot.id;
                    return (
                      <div
                        key={slot.id}
                        className={`slot ${disabled ? 'slot-disabled' : ''} ${selected ? 'slot-selected' : ''}`}
                        onClick={() => !disabled && setSelSlot(slot)}
                        title={slot.is_past ? 'Past slot' : !slot.is_available ? 'Already booked' : 'Click to select'}
                      >
                        <div className="slot-time">{fmtTime(slot.start_time)}</div>
                        <div className="slot-tag">
                          {slot.is_past ? 'Past' : slot.is_available ? 'Free' : 'Booked'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <div className="section-box">
              <div className="section-head">⭐ Recent Reviews</div>
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < Math.min(2, reviews.length - 1) ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.reviewer_name || 'Anonymous'}</span>
                    <span style={{ color: 'var(--yellow)', fontSize: '13px' }}>{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN — FORM ── */}
        <div>
          <div className="section-box" style={{ position: 'sticky', top: '80px' }}>
            <div className="section-head">👤 Your Details</div>

            {apiErr && <div className="alert alert-err">❌ {apiErr}</div>}

            <div className="form-row">
              <label>Full Name *</label>
              <input
                className={`inp ${errors.user_name ? 'err' : ''}`}
                placeholder="Rajesh Kumar"
                value={form.user_name}
                onChange={e => set('user_name', e.target.value)}
              />
              {errors.user_name && <div className="field-err">{errors.user_name}</div>}
            </div>

            <div className="form-row">
              <label>Email Address *</label>
              <input
                className={`inp ${errors.user_email ? 'err' : ''}`}
                type="email"
                placeholder="rajesh@example.com"
                value={form.user_email}
                onChange={e => set('user_email', e.target.value)}
              />
              {errors.user_email && <div className="field-err">{errors.user_email}</div>}
            </div>

            <div className="form-row">
              <label>Mobile Number *</label>
              <input
                className={`inp ${errors.user_phone ? 'err' : ''}`}
                type="tel"
                placeholder="9876543210"
                value={form.user_phone}
                onChange={e => set('user_phone', e.target.value)}
              />
              {errors.user_phone && <div className="field-err">{errors.user_phone}</div>}
            </div>

            <div className="inp-grid2">
              <div className="form-row">
                <label>Vehicle Number *</label>
                <input
                  className={`inp ${errors.vehicle_number ? 'err' : ''}`}
                  placeholder="KA01AB1234"
                  value={form.vehicle_number}
                  onChange={e => set('vehicle_number', e.target.value.toUpperCase())}
                />
                {errors.vehicle_number && <div className="field-err">{errors.vehicle_number}</div>}
              </div>
              <div className="form-row">
                <label>Vehicle Type</label>
                <select
                  className="inp"
                  value={form.vehicle_type}
                  onChange={e => set('vehicle_type', e.target.value)}
                >
                  {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>Notes (Optional)</label>
              <input
                className="inp"
                placeholder="Any special requirements…"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>

            {/* Cost Calculator */}
            {selSlot && (
              <div className="cost-calc">
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--accent)' }}>
                  💰 Cost Estimate
                </div>
                <div className="cost-row"><span>Charger type</span><span>{form.charger_type}</span></div>
                <div className="cost-row"><span>Duration</span><span>1 hour</span></div>
                <div className="cost-row"><span>Rate</span><span>₹{station.price_per_hour}/hr</span></div>
                <div className="cost-row total"><span>Total</span><span>₹{station.price_per_hour}</span></div>
              </div>
            )}

            {/* Booking Summary */}
            {selSlot && (
              <div className="booking-summary">
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>
                  📋 Booking Summary
                </div>
                <div className="summary-row">
                  <span>Station</span><span>{station.name}</span>
                </div>
                <div className="summary-row">
                  <span>Date</span><span>{fmtDate(date)}</span>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <span>{fmtTime(selSlot.start_time)} – {fmtTime(selSlot.end_time)}</span>
                </div>
                <div className="summary-row">
                  <span>Charger</span><span>{form.charger_type}</span>
                </div>
              </div>
            )}

            <button className="btn-confirm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Confirming…' : '⚡ Confirm Booking — Free'}
            </button>

            <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginTop: '10px' }}>
              🔒 No account required · Secure booking token issued instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
