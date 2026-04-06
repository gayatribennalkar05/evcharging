// models/Review.js
const db = require('../config/db');

class Review {
  static async add({ station_id, booking_token, rating, comment, reviewer_name }) {
    // Ensure booking exists and is confirmed/completed for this station
    const [b] = await db.execute(
      `SELECT id FROM bookings
       WHERE booking_token = ? AND station_id = ? AND status IN ('confirmed','completed')`,
      [booking_token, station_id]
    );
    if (!b[0]) return { success: false, error: 'Valid booking required to leave a review.' };

    try {
      await db.execute(
        `INSERT INTO reviews (station_id, booking_token, rating, comment, reviewer_name)
         VALUES (?, ?, ?, ?, ?)`,
        [station_id, booking_token, rating, comment || null, reviewer_name || 'Anonymous']
      );
      // Recompute station avg rating & review count
      await db.execute(
        `UPDATE stations
         SET rating       = (SELECT AVG(r.rating) FROM reviews r WHERE r.station_id = ?),
             total_reviews = (SELECT COUNT(*)     FROM reviews r WHERE r.station_id = ?)
         WHERE id = ?`,
        [station_id, station_id, station_id]
      );
      return { success: true };
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return { success: false, error: 'You already reviewed this booking.' };
      console.error('Review error:', e);
      return { success: false, error: 'Review failed. Please try again.' };
    }
  }

  static async forStation(stationId) {
    const [rows] = await db.execute(
      `SELECT rating, comment, reviewer_name, created_at
       FROM reviews WHERE station_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [stationId]
    );
    return rows;
  }
}

module.exports = Review;
