const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL || 'mysql://u_Wl75mG:CcgGtOQKJCfm@sql.freedb.tech:3306/freedb_T8zrBxcy';
const dbHost = process.env.DB_HOST || 'sql.freedb.tech';
const dbUser = process.env.DB_USER || 'u_Wl75mG';
const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'CcgGtOQKJCfm';
const dbName = process.env.DB_NAME || 'freedb_T8zrBxcy';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

let pool;
if (process.env.DATABASE_URL) {
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: true,
    ssl: dbSsl
  });
} else {
  pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: true,
    ssl: dbSsl
  });
}

/**
 * Initializes database tables and seed data from database/schema.sql if not present.
 */
async function initDatabaseSchema() {
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn(`[Database] Schema file not found at: ${schemaPath}`);
    return;
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if core tables already exist in the database
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log(`[Database] Core tables already verified in '${dbName}'.`);
      return;
    }

    console.log(`[Database] Initializing schema from schema.sql into database '${dbName}'...`);
    let sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Remove any CREATE DATABASE or USE statements to execute directly in the connected database
    sqlContent = sqlContent
      .replace(/CREATE\s+DATABASE[^;]+;/gi, '-- Skipped CREATE DATABASE')
      .replace(/USE\s+[^;]+;/gi, '-- Skipped USE');

    await connection.query(sqlContent);
    console.log(`[Database] ✅ Schema tables and initial seed data applied successfully to '${dbName}'!`);
  } catch (error) {
    console.warn(`[Database Notice] Schema auto-sync: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Tests connection to the MySQL database and attempts schema sync if connected.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`\x1b[32m[Database] Connected successfully to MySQL database '${dbName}' at ${dbHost}:${dbPort}\x1b[0m`);
    connection.release();

    // Auto-create tables and initial seed data if needed
    await initDatabaseSchema();
    return true;
  } catch (error) {
    console.log(`\x1b[33m[Database Notice] Remote/Local MySQL connection attempt: ${error.message}\x1b[0m`);
    console.log(`\x1b[36m[Database Notice] Target: host=${dbHost}, user=${dbUser}, database=${dbName}, port=${dbPort}\x1b[0m`);
    console.log(`\x1b[36m[Database Notice] Backend is running in resilient Demo/Simulation fallback mode.\x1b[0m`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabaseSchema
};
