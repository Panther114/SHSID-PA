import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import IssueTab from '../components/IssueTab';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import type { Guide, Subject } from '../types';

const revealVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Guides() {
  const { theme, toggle } = useTheme();
  const { token, role, login, logout } = useAuth();
  const canViewGuides = role === 'admin' || role === 'student';
  const canManageGuides = role === 'admin';

  const [guides,    setGuides]    = useState<Guide[]>([]);
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (!canViewGuides) {
      setGuides([]);
      setError('');
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const [guidesRes, subjectsRes] = await Promise.all([
          fetch('/api/guides', { signal: ac.signal }),
          fetch('/subjects.json', { signal: ac.signal }),
        ]);
        if (!guidesRes.ok) throw new Error('Failed to load guides');
        const guidesData = await guidesRes.json() as Guide[];
        const subjectsData = subjectsRes.ok ? await subjectsRes.json() as { subjects: Subject[] } : { subjects: [] };
        setGuides(guidesData);
        setSubjects(subjectsData.subjects ?? []);
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError('Failed to load guides. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [canViewGuides]);

  const removeGuide = useCallback((id: number) => {
    setGuides(prev => prev.filter(g => g.id !== id));
  }, []);

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return guides;
    const q = search.trim().toLowerCase();
    return guides.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      g.subject_level.toLowerCase().includes(q)
    );
  }, [guides, search]);

  const byIssue = useMemo(() => {
    const idx: Record<number, Guide[]> = {};
    for (const g of filteredGuides) {
      if (!idx[g.issue_number]) idx[g.issue_number] = [];
      idx[g.issue_number].push(g);
    }
    return idx;
  }, [filteredGuides]);

  const sortedIssues = useMemo(() =>
    Object.keys(byIssue).map(Number).sort((a, b) => a - b),
    [byIssue]
  );

  return (
    <>
      <Nav
        theme={theme}
        onToggle={toggle}
        role={role}
        onLoginClick={() => setShowModal(true)}
        onLogout={logout}
      />

      {showModal && !canViewGuides && (
        <LoginModal onClose={() => setShowModal(false)} onSuccess={login} />
      )}

      {/* Guide Hero */}
      <section className="guide-hero">
        <div className="guide-hero-blob gh-blob-1" aria-hidden="true" />
        <div className="guide-hero-blob gh-blob-2" aria-hidden="true" />
        <div className="pa-glow-orb" aria-hidden="true" style={{
          width: '190px', height: '190px',
          background: 'var(--c-accent-glow)',
          top: '14%', left: '13%',
          animationDelay: '0.2s', animationDuration: '10s',
        }} />
        <div className="pa-glow-orb" aria-hidden="true" style={{
          width: '140px', height: '140px',
          background: 'var(--c-blue-bg)',
          bottom: '15%', right: '17%',
          animationDelay: '2.3s', animationDuration: '11.5s',
        }} />
        <div className="guide-hero-grid" aria-hidden="true" />
        <div className="guide-hero-grain" aria-hidden="true" />
        <div className="deco-chip" aria-hidden="true"
          style={{ top: '22%', right: '8%', animationDelay: '0.4s', animationDuration: '8s' }}>
          📚
        </div>
        <div className="deco-chip deco-chip-sm" aria-hidden="true"
          style={{ bottom: '18%', left: '7%', animationDelay: '0.8s', animationDuration: '9.5s' }}>
          ✏️
        </div>
        <motion.div
          className="guide-hero-content"
          variants={revealVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="guide-hero-eyebrow">
            <span className="guide-hero-eyebrow-dot" />
            Official SHSID PA Website
          </div>
          <h1 className="guide-hero-title">
            Academic Guides<br />
            <span className="guide-hero-grad">by Your Peers</span>
          </h1>
          <div className="guide-hero-accent-bar" aria-hidden="true" />
          <p className="guide-hero-sub">
            Peer-written study guides, organized by semester, subject, and level.
          </p>
        </motion.div>
      </section>

      {/* Search toolbar */}
      {canViewGuides && (
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              type="search"
              placeholder="Search guides or subjects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search guides"
            />
          </div>
        </div>
      )}

      {loading && <SkeletonLoader />}

      {!loading && !canViewGuides && (
        <div className="guides-content">
          <div className="empty-state-frame state-msg">
            <div className="empty-state-illustration" aria-hidden="true">🔒</div>
            <div className="empty-state-text">
              <div className="state-msg-title">Log in to view resources</div>
              <div>Student or admin login is required to access guides.</div>
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="guides-content">
          <div className="error-banner">{error}</div>
        </div>
      )}

      {!loading && canViewGuides && !error && guides.length === 0 && (
        <div className="guides-content">
          <div className="empty-state-frame state-msg">
            <div className="empty-state-illustration" aria-hidden="true">📖</div>
            <div className="empty-state-text">
              <div className="state-msg-title">No guides yet</div>
              <div>Check back soon — new guides are added regularly.</div>
            </div>
          </div>
        </div>
      )}

      {!loading && canViewGuides && !error && guides.length > 0 && (
        <div className="guides-content">
          {sortedIssues.length === 0 ? (
            <div className="empty-state-frame state-msg">
              <div className="empty-state-illustration" aria-hidden="true">🔍</div>
              <div className="empty-state-text">
                <div className="state-msg-title">No guides found</div>
                <div>Try adjusting your search.</div>
              </div>
            </div>
          ) : (
            sortedIssues.map(issue => (
                <IssueTab
                  key={issue}
                  issueNumber={issue}
                  guides={byIssue[issue]}
                  subjects={subjects}
                  search={search}
                  canManageGuides={canManageGuides}
                  token={token}
                  onRemove={removeGuide}
                />
            ))
          )}
        </div>
      )}

      <Footer />
    </>
  );
}
