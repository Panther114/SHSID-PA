import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { AuthRole, Theme } from '../types';

interface NavProps {
  theme: Theme;
  onToggle: () => void;
  role?: AuthRole;
  onLoginClick?: () => void;
}

const themeIcon: Record<Theme, string> = {
  dark: '☀',
  light: '🌸',
  pink: '🌙',
};

export default function Nav({ theme, onToggle, role, onLoginClick }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isGuides = location.pathname === '/guides';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav>
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <img src="/icon.png" alt="PA" className="nav-icon-img" />
          <span className="nav-brand">SHSID Peer Advisors</span>
        </Link>
        <div className="nav-spacer" />
        <div className="nav-actions">
          {isGuides ? (
            <Link to="/" className="nav-link">Home</Link>
          ) : (
            <Link to="/guides" className="nav-link">Resources</Link>
          )}
          {!isGuides && isAdmin && (
            <Link to="/upload" className="btn btn-primary" style={{ marginRight: '0.2rem' }}>
              Upload Guide
            </Link>
          )}
          {isGuides && (
            <>
              {!isStudent && !isAdmin && onLoginClick && (
                <button className="btn btn-ghost" onClick={onLoginClick}>
                  Login
                </button>
              )}
              <span
                className={`nav-status-badge ${isAdmin ? 'status-admin' : isStudent ? 'status-student' : 'status-none'}`}
              >
                {isAdmin ? 'Admin' : isStudent ? 'Student' : 'Not logged in'}
              </span>
            </>
          )}
          {isGuides && isAdmin && (
            <Link to="/upload" className="btn btn-primary" style={{ marginRight: '0.2rem' }}>
              Upload Guide
            </Link>
          )}
          <button className="theme-btn" onClick={onToggle} aria-label="Toggle theme" title="Toggle theme">
            {themeIcon[theme]}
          </button>
          {/* Hamburger — visible only on mobile via CSS */}
          <button
            className={`hamburger-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="mobile-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeMenu}
            />
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to="/" className="mobile-nav-link" onClick={closeMenu}>Home</Link>
              {!isGuides && <Link to="/guides" className="mobile-nav-link" onClick={closeMenu}>Resources</Link>}
              {isAdmin && (
                <>
                  <div className="mobile-nav-divider" />
                  <Link to="/upload" className="mobile-nav-link" onClick={closeMenu}>
                    Upload Guide
                  </Link>
                </>
              )}
              {isGuides && !isAdmin && !isStudent && onLoginClick && (
                <>
                  <div className="mobile-nav-divider" />
                  <button
                    className="mobile-nav-link"
                    onClick={() => { closeMenu(); onLoginClick(); }}
                  >
                    Login
                  </button>
                </>
              )}
              {isGuides && (
                <>
                  <div className="mobile-nav-divider" />
                  <div className={`mobile-nav-status ${isAdmin ? 'status-admin' : isStudent ? 'status-student' : 'status-none'}`}>
                    {isAdmin ? 'Admin' : isStudent ? 'Student' : 'Not logged in'}
                  </div>
                </>
              )}
              <div className="mobile-nav-divider" />
              <button className="mobile-nav-link" onClick={() => { onToggle(); closeMenu(); }}>
                Theme: {theme === 'dark' ? 'Dark ☀' : theme === 'light' ? 'Light 🌸' : 'Pink 🌙'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
