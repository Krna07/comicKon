import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://comickon.onrender.com';

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

export default function NovelReader({ episode, allEpisodes, scrollToTop, endCard }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const coverSrc = resolveImg(episode.coverImage);

  const paragraphs = (episode.novelContent || '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const nextEp = allEpisodes?.find(e => e.episodeNumber === episode.episodeNumber + 1);

  return (
    <div className="novel">
      {coverSrc && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="novel__cover"
        >
          <div className="novel__cover-frame">
            {!imgLoaded && (
              <div className="comic-skel" style={{ aspectRatio: '3 / 4' }}>
                <span className="comic-skel__spin" />
              </div>
            )}
            <img
              src={coverSrc}
              alt={episode.title}
              className={imgLoaded ? '' : 'opacity-0 absolute inset-0'}
              onLoad={() => setImgLoaded(true)}
            />
          </div>
        </motion.div>
      )}

      <div className="reader-hero">
        <div className="reader-hero__kicker">
          <span>
            Episode {episode.episodeNumber} · Novel
            {episode.episodeTitle ? ` · ${episode.episodeTitle}` : ''}
          </span>
        </div>
        <h2 className="hindi-text">{episode.title}</h2>
        {episode.description && (
          <p className="hindi-text">{episode.description}</p>
        )}
      </div>

      <div className="novel__ornament" aria-hidden="true">✦</div>

      <div className="novel__story">
        {paragraphs.length === 0 ? (
          <p className="hindi-text" style={{ textAlign: 'center', color: 'var(--home-dim)' }}>
            कहानी अभी लिखी जा रही है...
          </p>
        ) : (
          paragraphs.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: i < 4 ? i * 0.06 : 0 }}
              className="hindi-text"
            >
              {i === 0 && para.length > 0 ? (
                <>
                  <span className="novel__drop">{para[0]}</span>
                  {para.slice(1)}
                </>
              ) : para}
            </motion.p>
          ))
        )}
      </div>

      <div className="novel__ornament" aria-hidden="true">— ✦ —</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="novel__end"
      >
        {endCard || (
          <div className="read-card">
            <h3 className="hindi-text">— समाप्त —</h3>
            {nextEp ? (
              <>
                <p className="hindi-text">अगला अंक उपलब्ध है!</p>
                <Link to={`/read/${nextEp._id}`} className="reader-btn reader-btn--sm">
                  Episode {nextEp.episodeNumber} पढ़ें →
                </Link>
              </>
            ) : (
              <p className="hindi-text">
                यह अंक यहाँ खत्म होता है।<br />अगला अंक जल्द आएगा...
              </p>
            )}
            <div className="read-nav">
              <button type="button" onClick={scrollToTop} className="reader-btn reader-btn--ghost reader-btn--sm">
                <ChevronUp size={14} /> फिर से पढ़ें
              </button>
              <Link to="/" className="reader-btn reader-btn--ghost reader-btn--sm">सभी अंक</Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
