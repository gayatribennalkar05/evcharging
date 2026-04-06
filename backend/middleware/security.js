// middleware/security.js
const db = require('../config/db');

/* ── in-memory rate limiter ── */
const store = new Map();

const rateLimit = (max = 60, windowMs = 60000) => (req, res, next) => {
  const ip  = getIP(req);
  const key = `${ip}:${req.path}`;
  const now = Date.now();
  const hits = (store.get(key) || []).filter(t => t > now - windowMs);
  if (hits.length >= max) {
    return res.status(429).json({ success: false, error: 'Too many requests. Slow down.', code: 'RATE_LIMIT' });
  }
  hits.push(now);
  store.set(key, hits);
  if (Math.random() < 0.01) cleanStore();
  next();
};

function cleanStore() {
  const cut = Date.now() - 120000;
  for (const [k, v] of store) {
    const f = v.filter(t => t > cut);
    f.length ? store.set(k, f) : store.delete(k);
  }
}

/* ── IP booking cap ── */
const ipBookingCap = async (req, res, next) => {
  const ip  = getIP(req);
  const max = parseInt(process.env.MAX_BOOKINGS_PER_IP) || 5;
  try {
    const [r] = await db.execute(
      `SELECT COUNT(*) AS c FROM bookings WHERE user_ip=? AND booking_date=CURDATE() AND status!='cancelled'`,
      [ip]
    );
    if (r[0].c >= max)
      return res.status(429).json({ success: false, error: `Max ${max} bookings per day per IP.`, code: 'IP_CAP' });
    next();
  } catch { next(); }
};

/* ── sanitize body/query ── */
const sanitize = (req, _res, next) => {
  const clean = v => typeof v === 'string'
    ? v.trim().replace(/[<>]/g, '').replace(/javascript:/gi, '').substring(0, 500)
    : v;
  const deep  = o => { if (o && typeof o === 'object') Object.keys(o).forEach(k => { o[k] = typeof o[k] === 'string' ? clean(o[k]) : deep(o[k]); }); return o; };
  req.body  = deep(req.body);
  req.query = deep(req.query);
  next();
};

/* ── booking validator ── */
const validateBooking = (req, res, next) => {
  const { station_id, slot_id, user_name, user_email, user_phone, vehicle_number, booking_date } = req.body;
  const errs = [];

  if (!station_id || isNaN(station_id))    errs.push('Valid station required');
  if (!slot_id    || isNaN(slot_id))       errs.push('Valid slot required');
  if (!user_name  || user_name.length < 2) errs.push('Name too short');
  if (!user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) errs.push('Invalid email');
  if (!user_phone || !/^[6-9]\d{9}$/.test(user_phone.replace(/\D/g,''))) errs.push('Invalid 10-digit phone');
  if (!vehicle_number) errs.push('Vehicle number required');
  if (!booking_date)   errs.push('Booking date required');

  if (booking_date) {
    const d   = new Date(booking_date);
    const tod = new Date(); tod.setHours(0,0,0,0);
    const max = new Date(); max.setDate(max.getDate()+30);
    if (d < tod) errs.push('Cannot book past dates');
    if (d > max) errs.push('Max 30 days in advance');
  }

  if (errs.length) return res.status(400).json({ success: false, error: 'Validation failed', details: errs });
  next();
};

/* ── token validator ── */
const validateToken = (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return res.status(400).json({ success: false, error: 'Token required' });
  if (token.length < 10 || token.length > 100) return res.status(400).json({ success: false, error: 'Invalid token' });
  req.bookingToken = token;
  next();
};

/* ── malicious request check ──
   Only block genuine SQL injection attack patterns.
   Avoid blocking common English words like DELETE, INSERT, SELECT
   which can legitimately appear in user_name, notes, vehicle numbers etc.
*/
const guardMalicious = (req, res, next) => {
  const bad = /(<script[\s>]|eval\s*\(|UNION\s+SELECT|DROP\s+TABLE|DROP\s+DATABASE|;\s*DROP|;\s*TRUNCATE)/i;
  const check = o => o && Object.values(o).some(v => typeof v === 'string' && bad.test(v));
  if (check(req.body) || check(req.query))
    return res.status(400).json({ success: false, error: 'Invalid request', code: 'BLOCKED' });
  next();
};

/* ── logger ── */
const logger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now()-start}ms [${getIP(req)}]`));
  next();
};

/* ── helper ── */
function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || '127.0.0.1';
}

module.exports = { rateLimit, ipBookingCap, sanitize, validateBooking, validateToken, guardMalicious, logger, getIP };
