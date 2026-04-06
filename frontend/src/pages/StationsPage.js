// src/pages/StationsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { stationAPI } from '../services/api';

const AMENITY_ICONS = {
  WiFi: '📶', Cafe: '☕', Restroom: '🚻', Parking: '🅿️', CCTV: '📷',
  Shopping: '🛍️', '24x7': '🕐', 'AC Lounge': '❄️', 'Waiting Lounge': '🪑',
  Greenery: '🌿'
};
const CHARGER_COLOR_CLASS = {
  CCS: 'badge-ccs', CHAdeMO: 'badge-chademo', Type2: 'badge-type2', Type1: 'badge-type1'
};

export default function StationsPage({ onBook }) {
  const [stations, setStations] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [sortBy,   setSortBy]   = useState('rating');

  useEffect(() => {
    Promise.all([stationAPI.getAll(), stationAPI.getStats()])
      .then(([s, st]) => { setStations(s.data || []); setStats(st.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...stations];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    if (filter === 'ccs')   list = list.filter(s => s.charger_types.includes('CCS'));
    if (filter === 'type2') list = list.filter(s => s.charger_types.includes('Type2'));
    if (filter === 'fast')  list = list.filter(s => parseFloat(s.power_kw) >= 50);
    if (filter === 'open')  list = list.filter(s => s.status === 'active');
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'price')  list.sort((a, b) => a.price_per_hour - b.price_per_hour);
    if (sortBy === 'power')  list.sort((a, b) => b.power_kw - a.power_kw);
    return list;
  }, [stations, search, filter, sortBy]);

  if (loading) return (
    <div className="loader-wrap">
      <div className="spinner"></div>
      <p className="loader-text">Loading stations…</p>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="alert alert-err">
        ❌ {error} — Make sure the backend is running on port 5000
      </div>
    </div>
  );

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-tag"><span></span> MYSURU EV NETWORK</div>
        <h1>
          <span className="hi">Charge Smarter,</span><br />Drive Greener
        </h1>
        <p className="hero-sub">
          Find and book EV charging slots across Mysuru instantly. No account needed.
        </p>
        {stats && (
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-num">{stats.activeStations}</div>
              <div className="stat-label">Active Stations</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{stats.totalSlots}+</div>
              <div className="stat-label">Charging Slots</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{stats.todayBookings}</div>
              <div className="stat-label">Bookings Today</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Availability</div>
            </div>
          </div>
        )}
      </section>

      {/* FILTERS */}
      <div className="filters-bar">
        <div className="filters-inner">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search stations or locations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {[
            { id: 'all',   label: 'All' },
            { id: 'open',  label: '⚡ Open Now' },
            { id: 'fast',  label: '🚀 Fast (50 kW+)' },
            { id: 'ccs',   label: 'CCS' },
            { id: 'type2', label: 'Type 2' },
          ].map(f => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <select
            className="filter-btn"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="rating">Sort: Rating</option>
            <option value="price">Sort: Price</option>
            <option value="power">Sort: Power</option>
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="page">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <h3>No stations found</h3>
            <p>Try a different search or filter</p>
          </div>
        ) : (
          <div className="stations-grid">
            {filtered.map((s, i) => (
              <StationCard key={s.id} station={s} onBook={onBook} delay={i * 45} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StationCard({ station: s, onBook, delay }) {
  const chargers  = s.charger_types.split(',').map(c => c.trim());
  const amenities = s.amenities ? s.amenities.split(',').map(a => a.trim()) : [];
  const filled    = Math.round(parseFloat(s.rating));
  const stars     = '★'.repeat(filled) + '☆'.repeat(5 - filled);

  return (
    <div
      className={`station-card fade-up ${s.status !== 'active' ? 'maintenance' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => s.status === 'active' && onBook(s)}
    >
      <div className="card-top">
        <div className="card-badge-row">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {chargers.map(c => (
              <span key={c} className={`charger-badge ${CHARGER_COLOR_CLASS[c] || 'badge-type2'}`}>
                {c}
              </span>
            ))}
          </div>
          <span className={`status-dot ${s.status}`} title={s.status}></span>
        </div>
        <div className="card-name">{s.name}</div>
        <div className="card-addr">📍 {s.address}</div>
        <div className="card-rating">
          <span className="stars">{stars}</span>
          <span className="rating-num">{parseFloat(s.rating).toFixed(1)}</span>
          <span className="rating-count">({s.total_reviews} reviews)</span>
          {s.active_bookings > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
              🔥 {s.active_bookings} active
            </span>
          )}
        </div>
      </div>

      <div className="card-stats">
        <div className="c-stat">
          <div className="c-stat-val accent">{s.power_kw} kW</div>
          <div className="c-stat-label">Power</div>
        </div>
        <div className="c-stat">
          <div className="c-stat-val green">{s.total_slots}</div>
          <div className="c-stat-label">Slots</div>
        </div>
        <div className="c-stat">
          <div className={`c-stat-val ${s.status === 'active' ? 'green' : s.status === 'maintenance' ? 'yellow' : 'red'}`}
            style={{ textTransform: 'capitalize' }}>
            {s.status}
          </div>
          <div className="c-stat-label">Status</div>
        </div>
      </div>

      {amenities.length > 0 && (
        <div className="card-amenities">
          {amenities.slice(0, 5).map(a => (
            <span key={a} className="amenity-tag">
              {AMENITY_ICONS[a] || '•'} {a}
            </span>
          ))}
          {amenities.length > 5 && (
            <span className="amenity-tag">+{amenities.length - 5} more</span>
          )}
        </div>
      )}

      <div className="card-footer">
        <div>
          <div className="price-label">Price</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span className="price-val">₹{s.price_per_hour}</span>
            <span className="price-unit">/ hour</span>
          </div>
        </div>
        {s.status === 'active' ? (
          <button
            className="btn-book-now"
            onClick={e => { e.stopPropagation(); onBook(s); }}
          >
            ⚡ Book Now
          </button>
        ) : (
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>
            🔧 {s.status === 'maintenance' ? 'Maintenance' : 'Offline'}
          </span>
        )}
      </div>
    </div>
  );
}
