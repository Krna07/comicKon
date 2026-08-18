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
      className="w-full flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10"
        style={{ lineHeight: 0, background: '#0d0d0d' }}
      >
        {/* Skeleton */}
        {!loaded && !error && (
          <div className="w-full aspect-[595/842] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-950">
            <div className="w-10 h-10 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
            <span className="text-gray-600 text-xs tracking-widest uppercase">Loading...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full aspect-[595/842] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-950 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="w-full">
              <p className="hindi-text text-gray-400 text-sm font-semibold">चित्र लोड नहीं हो सका</p>
              <p className="text-gray-600 text-xs mt-2 break-all leading-relaxed">{src}</p>
            </div>
          </div>
        )}

        <img
          src={src}
          alt={`पृष्ठ ${panel.pageNumber}`}
          className={`w-full h-auto block transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); console.error('Image failed:', src); }}
        />

        {loaded && panel.dialogues?.map((d, i) => (
          <SpeechBubble key={i} text={d.text} top={d.top} left={d.left} type={d.type} tail={d.tail} />
        ))}
      </div>

      {/* Caption box — full width, auto height, wraps naturally */}
      {showCaption && panel.captionHindi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/80 border border-white/[0.08] shadow-lg"
        >
          <div className="px-6 py-5">
            <div className="text-orange-400/50 text-3xl font-serif leading-none mb-3 select-none">"</div>
            <p className="hindi-text text-gray-200 text-sm sm:text-base leading-[2] text-center w-full">
              {panel.captionHindi}
            </p>
            <div className="text-orange-400/50 text-3xl font-serif leading-none mt-3 text-right select-none">"</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ComicPage({ panels, pageNumber, showCaption }) {
  return (
    <article className="w-full flex flex-col gap-2">
      {/* Page divider */}
      <div className="flex items-center gap-4 px-1 mb-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        <span className="text-gray-600 text-[11px] font-bold tracking-[0.25em] uppercase select-none whitespace-nowrap px-3 py-1.5 border border-gray-800/60 rounded-full bg-white/[0.02]">
          पृष्ठ {pageNumber}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div className="flex flex-col gap-6">
        {panels.map((panel) => (
          <FullPagePanel key={panel.panelNumber} panel={panel} showCaption={showCaption} />
        ))}
      </div>
    </article>
  );
}
