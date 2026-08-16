import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SpeechBubble from './SpeechBubble';

function FullPagePanel({ panel, showCaption }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <motion.div
      className="w-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Full-page image with speech bubbles */}
      <div
        className="relative w-full border-4 border-amber-400 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
        style={{ lineHeight: 0 }}
      >
        {/* Skeleton loader */}
        {!loaded && !error && (
          <div className="w-full aspect-[595/842] bg-sky-100/70 flex items-center justify-center animate-pulse backdrop-blur-xs">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-rose-500 rounded-full animate-spin shadow-sm" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="w-full aspect-[595/842] bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center justify-center text-amber-900/60 gap-3 p-4 text-center">
            <div className="p-3.5 bg-white/80 rounded-full shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
            <span className="hindi-text text-sm font-bold text-amber-900">चित्र उपलब्ध नहीं</span>
            <span className="text-xs font-medium text-amber-700/60">Page {panel.pageNumber}</span>
          </div>
        )}

        {/* Comic page image */}
        <img
          src={panel.imageUrl}
          alt={`Page ${panel.pageNumber}`}
          className={`w-full h-auto block transition-all duration-500 ${loaded ? 'opacity-100 scale-100' : 'hidden scale-105'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />

        {/* Optional speech bubbles overlaid */}
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
      </div>

      {/* Narrative caption below the page */}
      {showCaption && panel.captionHindi && (
        <div className="mt-3 w-full rounded-xl bg-white/95 backdrop-blur-md border-2 border-amber-200/80 shadow-md ring-2 ring-amber-400/20 px-5 py-3.5">
          <p
            className="text-slate-800 text-sm md:text-base leading-relaxed font-bold text-center"
            style={{ fontFamily: "'Tiro Devanagari Hindi', serif" }}
          >
            {panel.captionHindi}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function ComicPage({ panels, pageNumber, showCaption }) {
  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-50/70 border border-white/60 p-3 sm:p-5 shadow-xl">
      {/* Page label */}
      <div className="mb-4 flex items-center justify-center">
        <span
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-md tracking-wider border border-white/40 uppercase"
          style={{ fontFamily: 'monospace' }}
        >
          ✦ पृष्ठ {pageNumber} ✦
        </span>
      </div>

      {/* Panels — for wide pages it's just one full-width image per page */}
      <div className="flex flex-col gap-4">
        {panels.map((panel) => (
          <FullPagePanel
            key={panel.panelNumber}
            panel={panel}
            showCaption={showCaption}
          />
        ))}
      </div>
    </div>
  );
}