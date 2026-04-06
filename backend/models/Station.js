// models/Station.js
const db = require('../config/db');

class Station {
  static async getAll() {
    const [rows] = await db.execute(
      `SELECT s.*,
        (SELECT COUNT(*) FROM bookings b
         WHERE b.station_id = s.id AND b.status = 'confirmed' AND b.booking_date = CURDATE()
        ) AS active_bookings
       FROM stations s
       ORDER BY (s.status = 'active') DESC, s.rating DESC`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM stations WHERE id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async getStats() {
    const [[s]]  = await db.execute(`SELECT COUNT(*) AS total, SUM(status='active') AS active FROM stations`);
    const [[b]]  = await db.execute(`SELECT COUNT(*) AS today FROM bookings WHERE booking_date = CURDATE() AND status = 'confirmed'`);
    const [[sl]] = await db.execute(`SELECT SUM(total_slots) AS slots FROM stations WHERE status = 'active'`);
    return {
      totalStations:  s.total,
      activeStations: s.active,
      todayBookings:  b.today,
      totalSlots:     sl.slots
    };
  }
}

module.exports = Station;
