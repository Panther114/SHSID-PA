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
    const account = email.trim();
    const pwd = password.trim();
    if (!account) { setError(isStudentMode ? 'G number is required.' : 'Account is required.'); return; }
    if (isAdminMode && !pwd) { setError('Account and password are required.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isStudentMode
            ? { mode: 'student', gNumber: account }
            : { mode: 'admin', email: account, password: pwd }
        ),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok) { setError(data.error ?? 'Login failed.'); return; }
      if (!data.token) { setError('Login failed. Please try again.'); return; }
      onSuccess(data.token);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) submit();
  };

  const pickMode = (nextMode: 'admin' | 'student') => {
    setMode(nextMode);
    setError('');
    setEmail('');
    setPassword('');
  };

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
            <form className="modal-content" onSubmit={onSubmit}>
              <h2 className="modal-title" id="modal-title">Login</h2>
              <div className="form-field">
                <div className="form-label">Login Type</div>
                <div className="login-role-picker" role="radiogroup" aria-label="Select login type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isStudentMode}
                    className={`login-role-btn${isStudentMode ? ' active' : ''}`}
                    onClick={() => pickMode('student')}
                  >
                    <span className="login-role-title">Student</span>
                    <span className="login-role-sub">Use your G number</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isAdminMode}
                    className={`login-role-btn${isAdminMode ? ' active' : ''}`}
                    onClick={() => pickMode('admin')}
                  >
                    <span className="login-role-title">Admin</span>
                    <span className="login-role-sub">Use account + password</span>
                  </button>
                </div>
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
                <label className="form-label" htmlFor="login-email">
                  {isStudentMode ? 'G Number' : 'Account'}
                </label>
                <input
                  id="login-email"
                  className="form-input"
                  type="text"
                  autoComplete="username"
                  placeholder={isStudentMode ? 'Enter your G number' : 'Enter account name'}
                  value={email}
                  required
                  onChange={e => setEmail(e.target.value)}
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
                    required
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              )}
              <button type="submit" className="full-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
