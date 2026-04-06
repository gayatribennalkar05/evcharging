// controllers/stationController.js
const Station  = require('../models/Station');
const TimeSlot = require('../models/TimeSlot');
const Review   = require('../models/Review');

// GET /api/stations
const getAll = async (req, res) => {
  try {
    const data = await Station.getAll();
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to load stations' });
  }
};

// GET /api/stations/stats
const getStats = async (req, res) => {
  try {
    const stats = await Station.getStats();
    res.json({ success: true, data: stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
};

// GET /api/stations/:id
const getOne = async (req, res) => {
  try {
    const s = await Station.getById(req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Station not found' });
    const reviews = await Review.forStation(req.params.id);
    res.json({ success: true, data: { ...s, reviews } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to load station' });
  }
};

// GET /api/stations/:id/slots?date=YYYY-MM-DD
const getSlots = async (req, res) => {
  try {
    let { date } = req.query;
    const { id } = req.params;

    // Default to today in IST if no date given
    if (!date) {
      const now = new Date();
      const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      date = ist.toISOString().split('T')[0];
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD.' });

    // Get today's date in IST for comparison
    const nowIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const todayIST = nowIST.toISOString().split('T')[0];
    if (date < todayIST)
      return res.status(400).json({ success: false, error: 'Cannot fetch slots for past dates' });

    const station = await Station.getById(id);
    if (!station) return res.status(404).json({ success: false, error: 'Station not found' });

    const rawSlots = await TimeSlot.getForDate(id, date);
    const now = new Date();

    const slots = rawSlots.map(s => {
      // s.slot_date is 'YYYY-MM-DD' string (dateStrings:true)
      // Compare in IST by appending +05:30
      const slotStart = new Date(`${s.slot_date}T${s.start_time}+05:30`);
      return {
        id:           s.id,
        station_id:   s.station_id,
        slot_date:    s.slot_date,
        start_time:   s.start_time,
        end_time:     s.end_time,
        is_available: !!s.is_available,
        is_past:      slotStart <= now
      };
    });

    res.json({
      success: true,
      data: {
        station,
        date,
        slots,
        available: slots.filter(s => s.is_available && !s.is_past).length
      }
    });
  } catch (e) {
    console.error('getSlots error:', e);
    res.status(500).json({ success: false, error: 'Failed to load slots' });
  }
};

module.exports = { getAll, getStats, getOne, getSlots };
