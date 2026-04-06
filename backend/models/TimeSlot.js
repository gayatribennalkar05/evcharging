// models/TimeSlot.js
const db = require('../config/db');

class TimeSlot {
  // Generate hourly slots from 06:00 to 22:00 for a given station + date
  static async generate(stationId, date) {
    for (let h = 6; h < 22; h++) {
      const s = `${String(h).padStart(2, '0')}:00:00`;
      const e = `${String(h + 1).padStart(2, '0')}:00:00`;
      await db.execute(
        `INSERT IGNORE INTO time_slots (station_id, slot_date, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, 1)`,
        [stationId, date, s, e]
      );
    }
  }

  // Return all slots for a station+date, generating them if not yet present
  static async getForDate(stationId, date) {
    await TimeSlot.generate(stationId, date);
    // dateStrings:true in pool config means slot_date comes back as 'YYYY-MM-DD'
    const [rows] = await db.execute(
      `SELECT ts.id, ts.station_id, ts.slot_date, ts.start_time, ts.end_time, ts.is_available,
              s.price_per_hour, s.name AS station_name
       FROM time_slots ts
       JOIN stations s ON s.id = ts.station_id
       WHERE ts.station_id = ? AND ts.slot_date = ?
       ORDER BY ts.start_time`,
      [stationId, date]
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM time_slots WHERE id = ?`, [id]
    );
    return rows[0] || null;
  }
}

module.exports = TimeSlot;
