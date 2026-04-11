'use strict';

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

// Trigger DB migration on startup
require('./db');

const app = express();
let iconBuffer;
try {
  iconBuffer = fs.readFileSync(path.join(__dirname, 'icon.png'));
} catch (err) {
  console.error('Failed to load icon.png:', err);
}

app.use(express.json());
app.get('/icon.png', (_req, res) => {
  if (!iconBuffer) {
    return res.status(404).end();
  }
  res.set('Cache-Control', 'public, max-age=86400, must-revalidate');
  res.type('png').send(iconBuffer);
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/guides', require('./routes/guides'));

// Multer error handler
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
