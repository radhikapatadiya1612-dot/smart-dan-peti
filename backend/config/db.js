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
    console.log(`\x1b[33m[Database Notice] MySQL is not running on port ${process.env.DB_PORT || '3306'}.\x1b[0m`);
    console.log(`\x1b[36m[Database Notice] Backend is running in resilient Demo/Simulation mode.\x1b[0m`);
    console.log(`\x1b[90m[Database Notice] To enable MySQL, start MySQL service in XAMPP (Control Panel).\x1b[0m`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
