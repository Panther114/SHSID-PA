import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Guide } from '../types';

interface GuideCardProps {
  guide: Guide;
  idx: number;
  canManageGuides: boolean;
  token: string | null;
  onRemove: (id: number) => void;
}

export default function GuideCard({ guide, idx, canManageGuides, token, onRemove }: GuideCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [removing,   setRemoving]   = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/guides/${guide.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        onRemove(guide.id);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        alert(data.error ?? 'Failed to remove guide.');
        setConfirming(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setConfirming(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      className="guide-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0 }}
      transition={{
        enter: { duration: 0.3, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] },
        exit:  { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        layout: { duration: 0.25 },
      }}
      layout
    >
      <div className="guide-info">
        <div className="guide-title">{guide.title}</div>
      </div>
      <div className="guide-actions">
        {canManageGuides && !confirming && (
          <button className="remove-btn" onClick={() => setConfirming(true)}>
            Remove
          </button>
        )}
        {canManageGuides && confirming && (
          <>
            <button className="remove-btn" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Confirm'}
            </button>
            <button
              className="remove-btn"
              onClick={() => setConfirming(false)}
              disabled={removing}
              style={{ background: 'var(--c-surface)', color: 'var(--c-text2)', borderColor: 'var(--c-border)' }}
            >
              Cancel
            </button>
          </>
        )}
        <a className="pdf-btn" href={guide.pdf_url} target="_blank" rel="noopener noreferrer">
          View PDF ↗
        </a>
      </div>
    </motion.div>
  );
}
