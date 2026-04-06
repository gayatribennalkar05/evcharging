// models/Booking.js
const db = require('../config/db');
const { v4: uuid } = require('uuid');

class Booking {
  static token() {
    return `EVC-${uuid().toUpperCase().replace(/-/g, '').substring(0, 12)}-${Date.now().toString(36).toUpperCase()}`;
  }

  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the slot row to prevent double-booking
      const [slots] = await conn.execute(
        `SELECT id, is_available FROM time_slots WHERE id = ? FOR UPDATE`,
        [data.slot_id]
      );
      if (!slots[0] || !slots[0].is_available) {
        await conn.rollback();
        return { success: false, error: 'Slot just got booked. Please pick another.', code: 'UNAVAILABLE' };
      }

      const token = Booking.token();
      const [res] = await conn.execute(
        `INSERT INTO bookings
          (booking_token, station_id, slot_id, user_name, user_email, user_phone,
           vehicle_number, vehicle_type, user_ip, booking_date, start_time, end_time,
           charger_type, duration_hours, amount, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          token,
          data.station_id,
          data.slot_id,
          data.user_name,
          data.user_email,
          data.user_phone,
          data.vehicle_number,
          data.vehicle_type || '4-Wheeler',
          data.user_ip,
          data.booking_date,   // plain YYYY-MM-DD string
          data.start_time,
          data.end_time,
          data.charger_type || 'Type2',
          data.duration_hours || 1,
          data.amount,
          data.notes || null
        ]
      );

      await conn.execute(`UPDATE time_slots SET is_available = 0 WHERE id = ?`, [data.slot_id]);
      await conn.commit();
      return { success: true, token, id: res.insertId };

    } catch (e) {
      await conn.rollback();
      console.error('Booking create error:', e);
      return { success: false, error: 'Booking failed. Please try again.', code: 'FAILED' };
    } finally {
      conn.release();
    }
  }

  static async getByToken(token) {
    const [rows] = await db.execute(
      `SELECT b.*,
              s.name      AS station_name,
              s.address   AS station_address,
              s.charger_types,
              s.power_kw,
              s.amenities,
              s.rating
       FROM bookings b
       JOIN stations s ON s.id = b.station_id
       WHERE b.booking_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  static async cancel(token) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT * FROM bookings WHERE booking_token = ? FOR UPDATE`, [token]
      );
      const b = rows[0];
      if (!b)                      { await conn.rollback(); return { success: false, error: 'Booking not found.',       code: 'NOT_FOUND'  }; }
      if (b.status === 'cancelled') { await conn.rollback(); return { success: false, error: 'Already cancelled.',       code: 'CANCELLED'  }; }
      if (b.status === 'completed') { await conn.rollback(); return { success: false, error: 'Completed booking.',       code: 'COMPLETED'  }; }

      // booking_date is a plain YYYY-MM-DD string (dateStrings:true)
      const slotStart = new Date(`${b.booking_date}T${b.start_time}+05:30`);
      if (slotStart <= new Date()) {
        await conn.rollback();
        return { success: false, error: 'Cannot cancel a past booking.', code: 'PAST' };
      }

      await conn.execute(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE booking_token = ?`, [token]
      );
      await conn.execute(`UPDATE time_slots SET is_available = 1 WHERE id = ?`, [b.slot_id]);
      await conn.commit();
      return { success: true };

    } catch (e) {
      await conn.rollback();
      console.error('Cancel error:', e);
      return { success: false, error: 'Cancellation failed.', code: 'FAILED' };
    } finally {
      conn.release();
    }
  }
}

module.exports = Booking;
