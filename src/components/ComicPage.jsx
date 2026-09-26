import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeechBubble from './SpeechBubble';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://comickon.onrender.com';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

/* ── Tap-to-zoom modal ───────────────────────────────────────── */
function ZoomModal({ src, alt, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="zoom-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="panel-zoom-overlay"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label="Zoomed panel"
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="panel-zoom-frame"
          onClick={e => e.stopPropagation()}
        >
          <img src={src} alt={alt} className="panel-zoom-img" />
          <button
            type="button"
            className="panel-zoom-close"
            onClick={onClose}
            aria-label="Close zoom"
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Single panel with skeleton, error state, speech bubbles ─── */
function FullPagePanel({ panel, showCaption, pageIndex }) {
  const [loaded,   setLoaded]   = useState(false);
  const [error,    setError]    = useState(false);
  const [zoomed,   setZoomed]   = useState(false);

  const src = resolveImageUrl(panel.imageUrl);

  const openZoom  = useCallback(() => setZoomed(true),  []);
  const closeZoom = useCallback(() => setZoomed(false), []);

  return (
    <>
      <motion.div
        className="comic-page__panel"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: pageIndex < 3 ? pageIndex * 0.06 : 0,
        }}
      >
        {/* Panel image block */}
        <div className="comic-panel">

          {/* ── Skeleton (shown while loading) */}
          <AnimatePresence>
            {!loaded && !error && (
              <motion.div
                key="skel"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="comic-skel"
                aria-hidden="true"
              >
                <span className="comic-skel__spin" />
                <span className="comic-skel__label hindi-text">लोड हो रहा है…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error state */}
          {error && (
            <div className="comic-err" role="img" aria-label="Image failed to load">
              <span className="comic-err__icon" aria-hidden="true">🖼️</span>
              <p className="hindi-text">चित्र लोड नहीं हो सका</p>
              <p className="comic-err__url">{src}</p>
            </div>
          )}

          {/* ── Actual image — tappable to zoom */}
          <img
            src={src}
            alt={`पृष्ठ ${panel.pageNumber} — पैनल ${panel.panelNumber}`}
            className={loaded ? 'comic-panel__img' : 'comic-panel__img comic-panel__img--hide'}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); console.error('Image failed:', src); }}
            onClick={loaded ? openZoom : undefined}
            style={loaded ? { cursor: 'zoom-in' } : undefined}
            draggable="false"
          />

          {/* ── Speech bubbles (rendered after image is visible) */}
          {loaded && panel.dialogues?.map((d, i) => (
            <SpeechBubble
              key={i}
              text={d.text}
              top={d.top}
              left={d.left}
              type={d.type}
              tail={d.tail}
            />
          ))}

          {/* ── Tap-to-zoom hint badge (shown briefly after first load) */}
          {loaded && (
            <AnimatePresence>
              <motion.span
                key="zoom-hint"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="comic-panel__zoom-hint"
                aria-hidden="true"
                onClick={openZoom}
              >
                🔍
              </motion.span>
            </AnimatePresence>
          )}
        </div>

        {/* ── Hindi caption */}
        {showCaption && panel.captionHindi && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="comic-caption"
          >
            <p className="hindi-text">{panel.captionHindi}</p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Zoom modal (portal-less, rendered inline) */}
      {zoomed && (
        <ZoomModal
          src={src}
          alt={`पृष्ठ ${panel.pageNumber} — पैनल ${panel.panelNumber}`}
          onClose={closeZoom}
        />
      )}
    </>
  );
}

/* ── Page (group of panels sharing the same pageNumber) ──────── */
export default function ComicPage({ panels, pageNumber, showCaption }) {
  return (
    <article className="comic-page" aria-label={`पृष्ठ ${pageNumber}`}>
      {/* Page label divider */}
      <div className="comic-page__div" aria-hidden="true">
        <span className="hindi-text">पृष्ठ {pageNumber}</span>
      </div>

      <div className="comic-page__stack">
        {panels.map((panel, idx) => (
          <FullPagePanel
            key={panel.panelNumber}
            panel={panel}
            showCaption={showCaption}
            pageIndex={idx}
          />
        ))}
      </div>
    </article>
  );
}
