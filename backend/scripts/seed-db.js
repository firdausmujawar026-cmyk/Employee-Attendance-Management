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

async function seedDb() {
  console.log(`[DB-Seed] Seeding MySQL database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}...`);
  let connection;

  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });

    const seedPath = path.join(__dirname, '..', '..', 'database', 'sample-data.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Sample data file not found at ${seedPath}`);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('[DB-Seed] Executing database/sample-data.sql...');
    await connection.query(seedSql);
    console.log(`[DB-Seed] Sample data seeded successfully!`);
  } catch (err) {
    console.error('[DB-Seed] Error executing sample data script:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDb();
