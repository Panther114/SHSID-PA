'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');

// Trigger DB migration on startup
require('./db');

const app = express();

app.use(express.json());
app.get('/icon.png', (_req, res) => {
  res.sendFile(path.join(__dirname, 'icon.png'));
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
