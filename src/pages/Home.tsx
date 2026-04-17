import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useTheme } from '../hooks/useTheme';

const skylineDataUrlCache = new Map<string, string>();
const MAX_SKYLINE_CACHE_ENTRIES = 4;

function toSkylineCacheKey(source: string) {
  try {
    const url = new URL(source, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return source;
  }
}

function setSkylineCache(key: string, value: string) {
  if (skylineDataUrlCache.has(key)) skylineDataUrlCache.delete(key);
  skylineDataUrlCache.set(key, value);
  if (skylineDataUrlCache.size <= MAX_SKYLINE_CACHE_ENTRIES) return;
  const oldestKey = skylineDataUrlCache.keys().next().value;
  if (oldestKey) skylineDataUrlCache.delete(oldestKey);
}

/* Canvas-based background removal for the skyline image */
function removeSkylineBg(imgEl: HTMLImageElement) {
  if (imgEl.dataset.bgProcessed === '1') return;
  if (!imgEl || !imgEl.complete || !imgEl.naturalWidth) return;
  if (imgEl.src.startsWith('data:image/')) {
    imgEl.dataset.bgProcessed = '1';
    return;
  }

  const srcKey = toSkylineCacheKey(
    imgEl.dataset.srcKey || imgEl.getAttribute('src')?.trim() || imgEl.currentSrc
  );
  if (!srcKey) return;
  if (!imgEl.dataset.srcKey) imgEl.dataset.srcKey = srcKey;
  const cached = skylineDataUrlCache.get(srcKey);
  if (cached) {
    imgEl.dataset.bgProcessed = '1';
    imgEl.src = cached;
    return;
  }

  const testC = document.createElement('canvas');
  testC.width = 1;
  testC.height = 1;
  testC.getContext('2d')!.drawImage(imgEl, 0, 0, 1, 1);
  if (testC.getContext('2d')!.getImageData(0, 0, 1, 1).data[3] < 240) return;

  const run = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    ctx.drawImage(imgEl, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    const px = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    const pts = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1), px(Math.floor(w / 2), 0)];
    const bgR = pts.reduce((s, c) => s + c[0], 0) / pts.length;
    const bgG = pts.reduce((s, c) => s + c[1], 0) / pts.length;
    const bgB = pts.reduce((s, c) => s + c[2], 0) / pts.length;

    const THRESH = 42, FEATHER = 22;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.sqrt(
        Math.pow(d[i] - bgR, 2) + Math.pow(d[i + 1] - bgG, 2) + Math.pow(d[i + 2] - bgB, 2)
      );
      if (dist < THRESH) {
        d[i + 3] = 0;
      } else if (dist < THRESH + FEATHER) {
        d[i + 3] = Math.round(((dist - THRESH) / FEATHER) * d[i + 3]);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const processed = canvas.toDataURL('image/png');
    setSkylineCache(srcKey, processed);
    imgEl.dataset.bgProcessed = '1';
    imgEl.src = processed;
  };

  if ('requestIdleCallback' in window) {
    (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void })
      .requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 0);
  }
}

const revealVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function Home() {
  const { theme, toggle } = useTheme();
  const skylineRef = useRef<HTMLDivElement>(null);
  const skylineDarkRef = useRef<HTMLImageElement>(null);
  const skylineLightRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wrap = skylineRef.current;
    if (!wrap) return;
    const PARALLAX_FACTOR = 0.1;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (wrap) wrap.style.transform = `translateY(${-window.scrollY * PARALLAX_FACTOR}px)`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const activeSkyline = theme === 'dark' ? skylineDarkRef.current : skylineLightRef.current;
    if (activeSkyline) removeSkylineBg(activeSkyline);
  }, [theme]);

  return (
    <>
      <Nav theme={theme} onToggle={toggle} />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-blob blob-1" aria-hidden="true" />
        <div className="hero-blob blob-2" aria-hidden="true" />
        <div className="hero-blob blob-3" aria-hidden="true" />
        <div className="hero-grid-overlay" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />

        <div className="pa-glow-orb" aria-hidden="true" style={{
          width: '220px', height: '220px',
          background: 'var(--c-accent-glow)',
          top: '8%', left: '18%',
          animationDelay: '0s', animationDuration: '10s',
        }} />
        <div className="pa-glow-orb" aria-hidden="true" style={{
          width: '170px', height: '170px',
          background: 'var(--c-blue-bg)',
          bottom: '28%', right: '14%',
          animationDelay: '3.5s', animationDuration: '12s',
        }} />

        <div className="hero-skyline-wrap" ref={skylineRef} aria-hidden="true">
          <img
            ref={skylineDarkRef}
            className="hero-skyline-img skyline-dark"
            src="/images/hero/shanghai-skyline-dark.png"
            alt="" role="presentation" draggable={false}
            decoding="async"
            onLoad={e => { if (theme === 'dark') removeSkylineBg(e.currentTarget); }}
          />
          <img
            ref={skylineLightRef}
            className="hero-skyline-img skyline-light"
            src="/images/hero/shanghai-skyline-light.png"
            alt="" role="presentation" draggable={false}
            decoding="async"
            onLoad={e => { if (theme !== 'dark') removeSkylineBg(e.currentTarget); }}
          />
        </div>

        <motion.div
          className="hero-content"
          variants={revealVariants}
          initial="hidden"
          animate="visible"
          custom={0.05}
        >
          <h1 className="hero-title">
            <span className="grad-text">SHSID</span><br />Peer Advisor
          </h1>
          <div className="hero-accent-bar" aria-hidden="true" />
          <p className="hero-tagline">Official SHSID G10 PA Site</p>
          <p className="hero-subtitle">
            Curated academic study guides — written by students, for students.
          </p>
          <div className="hero-actions">
            <Link to="/guides" className="btn btn-primary btn-lg pa-lift">
              Browse Resources →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <motion.div
          className="cta-content"
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 0px -40px 0px' }}
          custom={0}
        >
          <p className="cta-kicker">Ready to learn?</p>
          <h2 className="cta-title">Find your next guide</h2>
          <p className="cta-sub">
            Browse the full library of peer-written academic guides across all subjects and levels.
          </p>
          <Link to="/guides" className="btn btn-primary btn-lg">
            Browse All Resources →
          </Link>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
