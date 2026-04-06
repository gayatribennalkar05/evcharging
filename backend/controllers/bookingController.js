// controllers/bookingController.js
const Booking  = require('../models/Booking');
const Station  = require('../models/Station');
const TimeSlot = require('../models/TimeSlot');
const Review   = require('../models/Review');
const { getIP } = require('../middleware/security');

// POST /api/bookings
const create = async (req, res) => {
  try {
    const {
      station_id, slot_id, user_name, user_email, user_phone,
      vehicle_number, vehicle_type, booking_date, notes, charger_type
    } = req.body;

    // Validate station
    const station = await Station.getById(station_id);
    if (!station)                    return res.status(404).json({ success: false, error: 'Station not found' });
    if (station.status !== 'active') return res.status(400).json({ success: false, error: 'Station is not active' });

    // Validate slot belongs to station and date matches
    const slot = await TimeSlot.getById(slot_id);
    if (!slot || String(slot.station_id) !== String(station_id))
      return res.status(400).json({ success: false, error: 'Invalid slot for this station' });

    // FIX: slot_date is now a plain string 'YYYY-MM-DD' (dateStrings:true in pool)
    const slotDateStr = slot.slot_date; // already 'YYYY-MM-DD'
    if (slotDateStr !== booking_date)
      return res.status(400).json({ success: false, error: `Slot date (${slotDateStr}) does not match booking date (${booking_date})` });

    // Prevent booking past slots (compare in IST)
    const slotStart = new Date(`${booking_date}T${slot.start_time}+05:30`);
    if (slotStart <= new Date())
      return res.status(400).json({ success: false, error: 'Cannot book a past time slot' });

    const result = await Booking.create({
      station_id,
      slot_id,
      user_name:      user_name.trim(),
      user_email:     user_email.trim().toLowerCase(),
      user_phone:     user_phone.replace(/\D/g, ''),
      vehicle_number: vehicle_number.toUpperCase().replace(/\s/g, ''),
      vehicle_type:   vehicle_type   || '4-Wheeler',
      user_ip:        getIP(req),
      booking_date,
      start_time:     slot.start_time,
      end_time:       slot.end_time,
      charger_type:   charger_type   || station.charger_types.split(',')[0].trim(),
      duration_hours: 1,
      amount:         station.price_per_hour,
      notes:          notes || null
    });

    if (!result.success) return res.status(409).json(result);

    res.status(201).json({
      success: true,
      message: '⚡ Booking confirmed!',
      data: {
        booking_token:   result.token,
        station_name:    station.name,
        station_address: station.address,
        booking_date,
        start_time:      slot.start_time,
        end_time:        slot.end_time,
        user_name:       user_name.trim(),
        user_email:      user_email.trim().toLowerCase(),
        vehicle_number:  vehicle_number.toUpperCase().replace(/\s/g, ''),
        vehicle_type:    vehicle_type || '4-Wheeler',
        charger_type:    charger_type || station.charger_types.split(',')[0].trim(),
        amount:          station.price_per_hour,
        status:          'confirmed'
      }
    });
  } catch (e) {
    console.error('Create booking error:', e);
    res.status(500).json({ success: false, error: 'Booking failed. Please try again.' });
  }
};

// GET /api/bookings/:token
const getByToken = async (req, res) => {
  try {
    const b = await Booking.getByToken(req.params.token);
    if (!b) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, data: b });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
};

// DELETE /api/bookings/:token
const cancel = async (req, res) => {
  try {
    const result = await Booking.cancel(req.params.token);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'Booking cancelled. Slot is now free.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Cancellation failed' });
  }
};

// POST /api/bookings/:token/review
const addReview = async (req, res) => {
  try {
    const { station_id, rating, comment, reviewer_name } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    const result = await Review.add({
      station_id,
      booking_token: req.params.token,
      rating,
      comment,
      reviewer_name
    });
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'Review submitted! Thank you.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Review submission failed' });
  }
};

module.exports = { create, getByToken, cancel, addReview };
