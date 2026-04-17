import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GuideCard from './GuideCard';
import type { Guide, Subject } from '../types';
import { SEMESTER_PERIOD_LABEL } from '../types';

interface IssueTabProps {
  issueNumber: number;
  guides: Guide[];
  subjects: Subject[];
  search: string;
  canManageGuides: boolean;
  token: string | null;
  onRemove: (id: number) => void;
}

export default function IssueTab({
  issueNumber, guides, subjects, search, canManageGuides, token, onRemove,
}: IssueTabProps) {
  const [open, setOpen] = useState(false);
  const hasActiveSearch = search.trim().length > 0;

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return guides;
    const q = search.trim().toLowerCase();
    return guides.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      g.subject_level.toLowerCase().includes(q)
    );
  }, [guides, search]);

  const bySubjectLevel = useMemo(() => {
    const idx: Record<string, Record<string, Guide[]>> = {};
    for (const g of filteredGuides) {
      if (!idx[g.subject]) idx[g.subject] = {};
      if (!idx[g.subject][g.subject_level]) idx[g.subject][g.subject_level] = [];
      idx[g.subject][g.subject_level].push(g);
    }
    return idx;
  }, [filteredGuides]);

  return (
    <div className={`issue-tab${open ? ' open' : ''}`}>
      <button
        className="issue-tab-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="issue-tab-title">{SEMESTER_PERIOD_LABEL[issueNumber] ?? `Issue ${issueNumber}`}</span>
        <motion.span
          className="issue-tab-arrow"
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          ▶
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="issue-tab-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <AnimatePresence>
              {subjects.map(subj => {
                const subjectLevels = bySubjectLevel[subj.name] ?? {};
                const visibleLevels = subj.levels.filter(level =>
                  !hasActiveSearch || (subjectLevels[level]?.length ?? 0) > 0
                );
                if (hasActiveSearch && visibleLevels.length === 0) return null;
                return (
                  <div key={subj.name} className="subject-group">
                    <h3 className="subject-heading">{subj.name}</h3>
                    {visibleLevels.map(level => {
                      const levelGuides = subjectLevels[level] ?? [];
                      return (
                        <div key={level} className="level-group">
                          <div className="level-label">{level}</div>
                          {!hasActiveSearch && levelGuides.length === 0 ? (
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'var(--c-text3)',
                              padding: '0.3rem 0.5rem',
                              fontStyle: 'italic',
                            }}>No guide available</div>
                          ) : (
                            <AnimatePresence>
                              {levelGuides.map((g, cardIdx) => (
                                <GuideCard
                                  key={g.id}
                                  guide={g}
                                  idx={cardIdx}
                                  canManageGuides={canManageGuides}
                                  token={token}
                                  onRemove={onRemove}
                                />
                              ))}
                            </AnimatePresence>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
