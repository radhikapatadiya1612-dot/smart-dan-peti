const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_dan_peti',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database: ${process.env.DB_NAME || 'smart_dan_peti'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MySQL:`, error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
