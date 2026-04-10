'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const guidesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload attempts. Please try again later.' },
});

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Resolve a filename to a canonical path strictly within uploadsDir
function resolveUploadPath(filename) {
  const base = path.resolve(uploadsDir);
  const resolved = path.resolve(base, path.basename(filename));
  if (!resolved.startsWith(base + path.sep)) {
    throw new Error('Invalid filename');
  }
  return resolved;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// GET /api/guides
router.get('/', guidesLimiter, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, subject, subject_level, issue_number, filename, original_name, created_at
       FROM guides
       ORDER BY subject, subject_level, issue_number`
    );

    const guides = result.rows.map((g) => ({
      ...g,
      pdf_url: `/api/guides/pdf/${g.filename}`,
    }));

    res.json(guides);
  } catch (err) {
    console.error('GET /api/guides error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/guides/upload  (protected)
router.post('/upload', uploadLimiter, authMiddleware, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  let uploadedFilePath;
  try {
    uploadedFilePath = resolveUploadPath(req.file.filename);
  } catch {
    fs.unlink(path.join(uploadsDir, path.basename(req.file.filename)), (err) => {
      if (err) console.error('Failed to clean up uploaded file:', err);
    });
    return res.status(400).json({ error: 'Invalid file path' });
  }

  const { title, subject, subject_level, issue_number } = req.body;
  if (!title || !subject || !subject_level || !issue_number) {
    fs.unlink(uploadedFilePath, () => {});
    return res.status(400).json({ error: 'title, subject, subject_level, and issue_number are required' });
  }

  const issueNum = parseInt(issue_number, 10);
  if (isNaN(issueNum) || issueNum < 1) {
    fs.unlink(uploadedFilePath, () => {});
    return res.status(400).json({ error: 'issue_number must be a positive integer' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO guides (title, subject, subject_level, issue_number, filename, original_name, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, subject, subject_level, issueNum, req.file.filename, req.file.originalname, req.user.sub]
    );

    const guide = result.rows[0];
    res.status(201).json({ ...guide, pdf_url: `/api/guides/pdf/${guide.filename}` });
  } catch (err) {
    fs.unlink(uploadedFilePath, () => {});
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/guides/pdf/:filename  — serve PDF
router.get('/pdf/:filename', guidesLimiter, (req, res) => {
  let filePath;
  try {
    filePath = resolveUploadPath(req.params.filename);
  } catch {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const safeFilename = path.basename(filePath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('Stream error serving PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to read file' });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
});

module.exports = router;
