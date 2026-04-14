import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    setError('');
    if (!email || !password) { setError('Account and password are required.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          <h2 className="modal-title" id="modal-title">Admin Login</h2>
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
              placeholder="ask austin for account name"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
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
          <button className="full-btn" onClick={submit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
