// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// Trigger DB connection check on startup
require('./config/db');

const { sanitize, guardMalicious, logger } = require('./middleware/security');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST','DELETE'] }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(logger);
app.use(sanitize);
app.use(guardMalicious);

app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: '⚡ EV Charge Pro API running', time: new Date() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, error: `${req.method} ${req.path} not found` })
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('\n⚡  EV Charge Pro — Backend API');
  console.log(`🌐  http://localhost:${PORT}`);
  console.log(`🏥  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
