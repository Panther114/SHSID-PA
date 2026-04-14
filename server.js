'use strict';

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

// Trigger DB migration on startup
require('./db');

const app = express();

// Serve pre-built frontend from dist/
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.json());
app.use(express.static(DIST_DIR));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/guides', require('./routes/guides'));

// SPA fallback — serve index.html for all non-API routes
// so client-side routing (/guides, /upload) works on direct visit or refresh
app.get('*', (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).send('Frontend not built. Run: npm run build');
  }
  res.sendFile(indexPath);
});

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
