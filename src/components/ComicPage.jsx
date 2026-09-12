import { useState } from 'react';
import { motion } from 'framer-motion';
import SpeechBubble from './SpeechBubble';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://comickon.onrender.com';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

function FullPagePanel({ panel, showCaption }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  const src = resolveImageUrl(panel.imageUrl);

  return (
    <motion.div
      className="comic-page__panel"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="comic-panel" style={{ lineHeight: 0 }}>
        {!loaded && !error && (
          <div className="comic-skel">
            <span className="comic-skel__spin" />
            <em>Loading...</em>
          </div>
        )}

        {error && (
          <div className="comic-err">
            <p className="hindi-text" style={{ fontWeight: 700, color: 'var(--home-muted)' }}>
              चित्र लोड नहीं हो सका
            </p>
            <p>{src}</p>
          </div>
        )}

        <img
          src={src}
          alt={`पृष्ठ ${panel.pageNumber}`}
          className={loaded ? '' : 'comic-panel__img--hide'}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); console.error('Image failed:', src); }}
        />

        {loaded && panel.dialogues?.map((d, i) => (
          <SpeechBubble key={i} text={d.text} top={d.top} left={d.left} type={d.type} tail={d.tail} />
        ))}
      </div>

      {showCaption && panel.captionHindi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="comic-caption"
        >
          <p className="hindi-text">{panel.captionHindi}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ComicPage({ panels, pageNumber, showCaption }) {
  return (
    <article className="comic-page">
      <div className="comic-page__div">
        <span className="hindi-text">पृष्ठ {pageNumber}</span>
      </div>

      <div className="comic-page__stack">
        {panels.map((panel) => (
          <FullPagePanel key={panel.panelNumber} panel={panel} showCaption={showCaption} />
        ))}
      </div>
    </article>
  );
}
