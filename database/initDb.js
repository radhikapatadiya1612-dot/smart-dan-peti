const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const dbUrl = process.env.DATABASE_URL || 'mysql://u_Wl75mG:CcgGtOQKJCfm@sql.freedb.tech:3306/freedb_T8zrBxcy';
const dbHost = process.env.DB_HOST || 'sql.freedb.tech';
const dbUser = process.env.DB_USER || 'u_Wl75mG';
const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'CcgGtOQKJCfm';
const dbName = process.env.DB_NAME || 'freedb_T8zrBxcy';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 Smart Dan Peti Database Initialization');
  console.log(`• Host    : ${dbHost}:${dbPort}`);
  console.log(`• Database: ${dbName}`);
  console.log(`• User    : ${dbUser}`);
  console.log('====================================================');

  const schemaFile = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaFile)) {
    console.error(`❌ Schema file not found: ${schemaFile}`);
    process.exit(1);
  }

  let sql = fs.readFileSync(schemaFile, 'utf8');

  // Strip database creation or selection so queries execute inside allocated DB
  sql = sql
    .replace(/CREATE\s+DATABASE[^;]+;/gi, '-- Skipped CREATE DATABASE')
    .replace(/USE\s+[^;]+;/gi, '-- Skipped USE');

  let connection;
  try {
    const connOptions = process.env.DATABASE_URL 
      ? { uri: process.env.DATABASE_URL, multipleStatements: true, ssl: dbSsl, connectTimeout: 10000 }
      : { host: dbHost, user: dbUser, password: dbPassword, database: dbName, port: dbPort, multipleStatements: true, ssl: dbSsl, connectTimeout: 10000 };

    connection = await mysql.createConnection(connOptions);

    console.log('✅ Connected to remote FreeDB database successfully!');
    console.log('⏳ Executing schema.sql (tables & initial seed data)...');

    await connection.query(sql);

    console.log('✅ All tables and initial seed data created successfully!');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Total tables in ${dbName}: ${tables.length}`);
    tables.forEach(row => {
      console.log('   - ' + Object.values(row)[0]);
    });

    await connection.end();
    console.log('\n🎉 Database initialization finished successfully!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
