'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const grade10Path = path.join(__dirname, '..', 'Grade_10.txt');

function loadGrade10Set() {
  try {
    const content = fs.readFileSync(grade10Path, 'utf8');
    return new Set(
      content
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch (err) {
    console.error('Failed to read Grade_10.txt:', err);
    return null;
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const mode = String(req.body?.mode ?? 'admin').toLowerCase();

  if (mode === 'student') {
    const gNumberRaw = String(req.body?.gNumber ?? req.body?.email ?? '').trim();
    if (!gNumberRaw) {
      return res.status(400).json({ error: 'G number is required' });
    }

    const grade10Set = loadGrade10Set();
    if (!grade10Set) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    const normalizedGNumber = gNumberRaw.toLowerCase();
    if (!grade10Set.has(normalizedGNumber)) {
      return res.status(401).json({ error: 'Invalid G number' });
    }

    const token = jwt.sign(
      { sub: normalizedGNumber, g_number: gNumberRaw, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, role: 'student' });
  }

  const email = String(req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, is_authorized FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_authorized) {
      return res.status(403).json({ error: 'Account not authorized' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'admin' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
