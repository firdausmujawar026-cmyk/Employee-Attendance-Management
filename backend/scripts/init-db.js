const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'employee_attendance';

async function initDb() {
  console.log(`[DB-Init] Initializing MySQL database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}...`);
  let connection;

  try {
    // Connect without database first to ensure database exists
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[DB-Init] Executing database/schema.sql...');
    await connection.query(schemaSql);
    console.log(`[DB-Init] Database schema created successfully!`);
  } catch (err) {
    console.error('[DB-Init] Error executing schema script:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDb();
