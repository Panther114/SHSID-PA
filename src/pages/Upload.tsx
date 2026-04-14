import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { isTokenValid } from '../hooks/useAuth';
import type { Subject } from '../types';
import { SEMESTER_PERIODS } from '../types';

function UploadForm({ token }: { token: string }) {
  const [subjects,       setSubjects]       = useState<Subject[]>([]);
  const [subject,        setSubject]        = useState('');
  const [level,          setLevel]          = useState('');
  const [semesterPeriod, setSemesterPeriod] = useState<number | ''>('');
  const [file,           setFile]           = useState<File | null>(null);
  const [dragging,       setDragging]       = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/subjects.json', { signal: ac.signal })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch subjects');
        return r.json() as Promise<{ subjects: Subject[] }>;
      })
      .then(data => setSubjects(data.subjects ?? []))
      .catch(err => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to load subjects list.');
        }
      });
    return () => ac.abort();
  }, []);

  const availableLevels = subjects.find(s => s.name === subject)?.levels ?? [];

  useEffect(() => { setLevel(''); }, [subject]);

  const selectedPeriod = SEMESTER_PERIODS.find(p => p.value === semesterPeriod);
  const autoTitle = semesterPeriod && subject && level && selectedPeriod
    ? `${selectedPeriod.titlePrefix} ${subject} ${level}`
    : '';

  const setFileFromDrop = useCallback((f: File | null | undefined) => {
    if (!f) return;
    const isPdf =
      f.type === 'application/pdf' ||
      f.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setFile(f);
      setError('');
    } else {
      setFile(null);
      setError('Only PDF files are accepted.');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setFileFromDrop(e.dataTransfer.files[0]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!semesterPeriod || !subject || !level || !file) {
      setError('All fields are required.'); return;
    }
    if (!isTokenValid(token)) {
      setError('Your session has expired. Redirecting to guides…');
      setTimeout(() => { window.location.href = '/guides'; }, 2000);
      return;
    }
    const fd = new FormData();
    fd.append('title', autoTitle);
    fd.append('subject', subject);
    fd.append('subject_level', level);
    fd.append('issue_number', String(semesterPeriod));
    fd.append('pdf', file);

    setSubmitting(true);
    try {
      const res = await fetch('/api/guides/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json() as { title?: string; error?: string };
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }
      setSuccess(`"${data.title}" uploaded successfully!`);
      setSubject(''); setLevel(''); setSemesterPeriod(''); setFile(null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      {error   && <div className="msg-error">{error}</div>}
      {success && <div className="msg-success">{success}</div>}

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="subject">Subject</label>
          <select
            id="subject"
            className="form-select"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          >
            <option value="" disabled>Select a subject</option>
            {subjects.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="level">Level</label>
          <select
            id="level"
            className="form-select"
            value={level}
            onChange={e => setLevel(e.target.value)}
            required
            disabled={!subject}
          >
            <option value="" disabled>
              {subject ? 'Select a level' : 'Select subject first'}
            </option>
            {availableLevels.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="semester-period">Semester Period</label>
        <select
          id="semester-period"
          className="form-select"
          value={semesterPeriod}
          onChange={e => setSemesterPeriod(e.target.value ? Number(e.target.value) : '')}
          required
        >
          <option value="" disabled>Select a period</option>
          {SEMESTER_PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {autoTitle && (
        <div className="form-field">
          <div className="form-label">Guide Name (auto-generated)</div>
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'var(--c-accent-bg)',
            border: '1px solid var(--c-border2)',
            borderRadius: '9px',
            color: 'var(--c-text)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>{autoTitle}</div>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">PDF File</label>
        <div
          className={`drop-zone${dragging ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); if (!dragging) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          aria-label="Click or drag to upload PDF"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={e => setFileFromDrop(e.target.files?.[0])}
          />
          <span className="drop-icon">{file ? '✅' : '📄'}</span>
          {file ? (
            <div className="drop-file-name">{file.name}</div>
          ) : (
            <div className="drop-text">
              <strong>Click to choose</strong> or drag &amp; drop a PDF
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--c-text3)' }}>
                PDF files only · max 20 MB
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="full-btn" disabled={submitting}>
        {submitting ? 'Uploading…' : 'Upload Guide'}
      </button>
    </form>
  );
}

export default function Upload() {
  const { theme, toggle } = useTheme();
  const [token] = useState(() => localStorage.getItem('jwt'));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isTokenValid(token)) {
      window.location.href = '/guides';
    } else {
      setChecked(true);
    }
  }, [token]);

  if (!checked) return null;

  return (
    <>
      <div className="upload-bg" aria-hidden="true">
        <div className="upload-bg-blob upload-bg-blob-1" />
        <div className="upload-bg-blob upload-bg-blob-2" />
      </div>
      <Nav theme={theme} onToggle={toggle} />
      <div className="upload-page">
        <motion.div
          className="upload-header"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1>Upload Guide</h1>
          <p>Share a new academic guide with the SHSID community.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <UploadForm token={token!} />
        </motion.div>
        <Link to="/guides" className="back-link">← Back to all guides</Link>
      </div>
      <Footer />
    </>
  );
}
