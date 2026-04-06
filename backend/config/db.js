// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'evcharging',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  timezone:           '+05:30',
  charset:            'utf8mb4',
  dateStrings:        true   // ← FIX: return DATE columns as plain 'YYYY-MM-DD' strings, not Date objects
});

(async () => {
  try {
    const c = await pool.getConnection();
    console.log(`✅  MySQL (${process.env.DB_NAME || 'evcharging'}) connected via XAMPP`);
    c.release();
  } catch (e) {
    console.error('❌  MySQL connection failed:', e.message);
    console.error('    → Make sure XAMPP MySQL is running on port 3306');
    process.exit(1);
  }
})();

module.exports = pool;
