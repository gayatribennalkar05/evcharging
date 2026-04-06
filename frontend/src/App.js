// src/App.js
import React, { useState } from 'react';
import './styles/global.css';
import StationsPage     from './pages/StationsPage';
import BookingPage      from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ManagePage       from './pages/ManagePage';

export default function App() {
  const [view,       setView]       = useState('stations');
  const [selStation, setSelStation] = useState(null);
  const [confirmed,  setConfirmed]  = useState(null);
  // When navigating to Manage from ConfirmationPage we pass the token
  const [manageToken, setManageToken] = useState('');

  const go = (page, data) => {
    setView(page);
    if (page === 'booking')   setSelStation(data);
    if (page === 'confirmed') setConfirmed(data);
    if (page === 'manage' && data?.token) setManageToken(data.token);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header view={view} go={go} />
      <main className="main">
        {view === 'stations'  && (
          <StationsPage onBook={s => go('booking', s)} />
        )}
        {view === 'booking'   && selStation && (
          <BookingPage
            station={selStation}
            onBack={() => go('stations')}
            onDone={b => go('confirmed', b)}
          />
        )}
        {view === 'confirmed' && confirmed && (
          <ConfirmationPage
            booking={confirmed}
            onHome={() => go('stations')}
            onManage={() => go('manage', { token: confirmed.booking_token })}
          />
        )}
        {view === 'manage' && (
          <ManagePage
            initialToken={manageToken}
            onBack={() => go('stations')}
          />
        )}
      </main>
      <footer className="footer">
        <div className="footer-logo">⚡ EV CHARGE PRO</div>
        <div className="footer-sub">
          Powering Mysuru's EV Future · No account needed · Book in seconds
        </div>
      </footer>
    </div>
  );
}

function Header({ view, go }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => go('stations')}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">EV CHARGE</span>
          <span className="logo-badge">PRO</span>
        </div>
        <nav className="nav-links">
          <button
            className={`nav-btn ${view === 'stations' ? 'active' : ''}`}
            onClick={() => go('stations')}
          >
            🏠 Stations
          </button>
          <button
            className={`nav-btn ${view === 'manage' ? 'active' : ''}`}
            onClick={() => go('manage', {})}
          >
            📋 My Booking
          </button>
        </nav>
      </div>
    </header>
  );
}
