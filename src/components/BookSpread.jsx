import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

function ComicPanel({ panel, showCaption, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Panel image */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border-4 border-amber-400/80 bg-gradient-to-b from-sky-50 to-indigo-50/50 shadow-md hover:shadow-xl transition-shadow duration-300">
        {/* Panel number badge */}
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md tracking-wider border border-white/40">
          #{panel.panelNumber}
        </div>

        {/* Loading skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-100/70 backdrop-blur-xs">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-rose-500 rounded-full animate-spin shadow-sm" />
          </div>
        )}

        {/* Error fallback */}
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 text-amber-900/60 gap-2 p-4 text-center">
            <div className="p-3 bg-white/80 rounded-full shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-bold hindi-text text-amber-900">चित्र उपलब्ध नहीं</span>
            <span className="text-xs font-medium text-amber-700/60">Panel {panel.panelNumber}</span>
          </div>
        )}

        <img
          src={panel.imageUrl}
          alt={`Panel ${panel.panelNumber}`}
          className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      </div>

      {/* Caption */}
      <AnimatePresence>
        {showCaption && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mt-3 px-4 py-3 rounded-xl bg-white/95 backdrop-blur-md border-2 border-amber-200/80 shadow-md ring-2 ring-amber-400/20"
          >
            <p className="hindi-text text-sm font-semibold leading-relaxed text-slate-800 text-center">
              {panel.captionHindi}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookSpread({
  leftPanel,
  rightPanel,
  pageNumber,
  direction,
  showCaption,
  onToggleCaption,
  isMobile
}) {
  const variants = {
    enter: (dir) => ({
      opacity: 0,
      x: dir === 'next' ? 80 : -80,
      scale: 0.96
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    exit: (dir) => ({
      opacity: 0,
      x: dir === 'next' ? -80 : 80,
      scale: 0.96
    })
  };

  return (
    <div className="relative w-full h-full flex flex-col p-2 sm:p-4 rounded-3xl bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-50/70 border border-white/60 shadow-lg">
      {/* Caption toggle button */}
      <button
        onClick={onToggleCaption}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 hover:bg-white text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-full border-2 border-indigo-200 shadow-md hover:shadow-lg transition-all active:scale-95"
        title={showCaption ? 'कैप्शन छुपाएँ' : 'कैप्शन दिखाएँ'}
      >
        {showCaption ? <Eye size={14} className="text-indigo-600" /> : <EyeOff size={14} className="text-indigo-400" />}
        <span className="hindi-text hidden sm:inline">
          {showCaption ? 'कैप्शन' : 'कैप्शन'}
        </span>
      </button>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={pageNumber}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 w-full"
        >
          {isMobile ? (
            /* Mobile: stacked single panels */
            <div className="flex flex-col gap-4 h-full">
              {leftPanel && (
                <ComicPanel panel={leftPanel} showCaption={showCaption} index={0} />
              )}
              {rightPanel && (
                <ComicPanel panel={rightPanel} showCaption={showCaption} index={1} />
              )}
            </div>
          ) : (
            /* Desktop: side-by-side book spread */
            <div className="flex gap-4 h-full">
              {/* Divider spine */}
              <div className="flex gap-4 flex-1 relative">
                {/* Left panel */}
                <div className="flex-1">
                  {leftPanel ? (
                    <ComicPanel panel={leftPanel} showCaption={showCaption} index={0} />
                  ) : (
                    <div className="h-full rounded-2xl border-3 border-dashed border-amber-300/80 bg-amber-50/50 flex items-center justify-center text-amber-700 font-bold">
                      <span className="hindi-text text-sm tracking-wide">अंत</span>
                    </div>
                  )}
                </div>

                {/* Book spine */}
                <div className="w-1 bg-gradient-to-b from-amber-300 via-rose-300 to-indigo-300 self-stretch rounded-full shadow-inner opacity-70" />

                {/* Right panel */}
                <div className="flex-1">
                  {rightPanel ? (
                    <ComicPanel panel={rightPanel} showCaption={showCaption} index={1} />
                  ) : (
                    <div className="h-full rounded-2xl border-3 border-dashed border-indigo-300/80 bg-indigo-50/50 flex items-center justify-center text-indigo-700 font-bold">
                      <span className="hindi-text text-sm tracking-wide">— समाप्त —</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}