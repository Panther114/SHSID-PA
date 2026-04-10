'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SEED_USERS = [
  { email: process.env.FURINA_ACCOUNT || 'Furina', password: process.env.FURINA_PASSWORD || 'Gavania114514' },
  { email: process.env.ADMIN_ACCOUNT  || 'admin',  password: process.env.ADMIN_PASSWORD  || 'shsidpeeradvisor' },
];

if (!process.env.FURINA_ACCOUNT || !process.env.FURINA_PASSWORD ||
    !process.env.ADMIN_ACCOUNT  || !process.env.ADMIN_PASSWORD) {
  console.warn('WARNING: One or more user credential environment variables are not set. Using built-in defaults. Set FURINA_ACCOUNT, FURINA_PASSWORD, ADMIN_ACCOUNT, and ADMIN_PASSWORD in production.');
}

const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_authorized BOOLEAN DEFAULT false,
      created_at    TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS guides (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      subject       TEXT NOT NULL,
      subject_level TEXT NOT NULL,
      issue_number  INTEGER NOT NULL,
      filename      TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_by   INTEGER REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT now()
    );
  `);

  for (const user of SEED_USERS) {
    const hash = await bcrypt.hash(user.password, 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, is_authorized)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             is_authorized = true`,
      [user.email, hash]
    );
  }
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

module.exports = pool;
