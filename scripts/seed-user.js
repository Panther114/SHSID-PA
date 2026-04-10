'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db');

const email = process.env.SEED_EMAIL || 'admin@example.com';
const password = process.env.SEED_PASSWORD || 'changeme';

(async () => {
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, is_authorized)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             is_authorized = true
       RETURNING id, email, is_authorized`,
      [email, hash]
    );
    console.log('Seeded user:', result.rows[0]);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
