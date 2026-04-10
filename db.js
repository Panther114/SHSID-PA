'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

module.exports = pool;
