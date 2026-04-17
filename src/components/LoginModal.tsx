import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (token: string) => void;
}

const MODAL_LEFT_POP_INITIAL = { opacity: 0, y: 18, x: -18, scale: 0.96 };
const MODAL_LEFT_POP_ANIMATE = { opacity: 1, y: 0, x: 0, scale: 1 };

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState<'admin' | 'student' | ''>('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const isStudentMode = mode === 'student';
  const isAdminMode = mode === 'admin';

  const submit = async () => {
    setError('');
    if (!mode) { setError('Please select Admin or Student.'); return; }
    if (!email) { setError(isStudentMode ? 'G number is required.' : 'Account is required.'); return; }
    if (isAdminMode && !password) { setError('Account and password are required.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isStudentMode
            ? { mode: 'student', gNumber: email }
            : { mode: 'admin', email, password }
        ),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok) { setError(data.error ?? 'Login failed.'); return; }
      onSuccess(data.token!);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={MODAL_LEFT_POP_INITIAL}
          animate={MODAL_LEFT_POP_ANIMATE}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          <div className="modal-inner">
            <div className="modal-content">
              <h2 className="modal-title" id="modal-title">Login</h2>
              <div className="form-field">
                <label className="form-label" htmlFor="login-mode">Login Type</label>
                <select
                  id="login-mode"
                  className="form-input"
                  value={mode}
                  aria-label="Select Admin or Student"
                  onChange={e => setMode(e.target.value as 'admin' | 'student' | '')}
                >
                  <option value="" disabled hidden>Select Admin or Student</option>
                  <option value="admin">Admin Login</option>
                  <option value="student">Student Login</option>
                </select>
              </div>
              {error && (
                <motion.div
                  className="form-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              <div className="form-field">
                <label className="form-label" htmlFor="login-email">Account</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="text"
                  autoComplete="username"
                  placeholder={isStudentMode ? 'G number' : 'account name'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onKey}
                />
              </div>
              {!isStudentMode && (
                <div className="form-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    className="form-input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={onKey}
                  />
                </div>
              )}
              <button className="full-btn" onClick={submit} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
