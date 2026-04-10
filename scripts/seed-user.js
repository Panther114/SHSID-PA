'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db');

const SEED_USERS = [
  {
    email: process.env.SEED_EMAIL || 'admin@example.com',
    password: process.env.SEED_PASSWORD || 'changeme',
  },
  { email: process.env.FURINA_ACCOUNT || 'Furina',  password: process.env.FURINA_PASSWORD || 'Gavania114514' },
  { email: process.env.ADMIN_ACCOUNT  || 'admin',   password: process.env.ADMIN_PASSWORD  || 'shsidpeeradvisor' },
];

(async () => {
  try {
    for (const user of SEED_USERS) {
      const hash = await bcrypt.hash(user.password, 12);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, is_authorized)
         VALUES ($1, $2, true)
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               is_authorized = true
         RETURNING id, email, is_authorized`,
        [user.email, hash]
      );
      console.log('Seeded user:', result.rows[0]);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
