import React from 'react';

/**
 * Renders a comic speech/caption/thought bubble absolutely
 * positioned over a panel image.
 *
 * Props:
 *   text   – bubble text
 *   top    – % from top of panel
 *   left   – % from left of panel
 *   type   – 'speech' | 'caption' | 'thought'
 *   tail   – 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
 */
export default function SpeechBubble({ text, top, left, type = 'speech', tail = 'bottom-left' }) {
  if (!text) return null;

  // ── Caption box (rectangular, like narration boxes)
  if (type === 'caption') {
    return (
      <div
        className="absolute z-20 pointer-events-none"
        style={{ top: `${top}%`, left: `${left}%`, maxWidth: '55%' }}
      >
        <div
          className="
            bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-400
            text-amber-950 text-[10px] sm:text-xs leading-tight
            font-bold px-2.5 py-1.5 rounded-lg
            shadow-[2px_2px_0px_#f59e0b] ring-1 ring-white/60
          "
          style={{ fontFamily: "'Tiro Devanagari Hindi', serif" }}
        >
          {text}
        </div>
      </div>
    );
  }

  // ── Thought bubble (cloud shape)
  if (type === 'thought') {
    return (
      <div
        className="absolute z-20 pointer-events-none"
        style={{ top: `${top}%`, left: `${left}%`, maxWidth: '50%' }}
      >
        <div
          className="
            bg-white/95 backdrop-blur-xs border-2 border-sky-400 rounded-3xl
            text-slate-800 text-[10px] sm:text-xs leading-tight
            font-bold px-3 py-2
            shadow-[2px_2px_0px_#38bdf8] ring-1 ring-white/80
          "
          style={{ fontFamily: "'Tiro Devanagari Hindi', serif" }}
        >
          {text}
          {/* Thought dots */}
          <div className={`absolute flex gap-1 ${tail.includes('bottom') ? 'bottom-[-16px]' : 'top-[-16px]'} ${tail.includes('left') ? 'left-3' : 'right-3'}`}>
            <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-sky-400 shadow-xs" />
            <div className="w-2 h-2 rounded-full bg-white border-2 border-sky-400 shadow-xs" />
            <div className="w-1.5 h-1.5 rounded-full bg-white border-2 border-sky-400 shadow-xs" />
          </div>
        </div>
      </div>
    );
  }

  // ── Speech bubble (default)
  // Tail directions → CSS border tricks using vibrant theme colors
  const tailClass = {
    'bottom-left':  'before:bottom-[-13px] before:left-4 before:border-t-indigo-400 before:border-t-[13px] before:border-l-[10px] before:border-l-transparent before:border-r-[6px] before:border-r-transparent after:bottom-[-9px] after:left-[18px] after:border-t-white after:border-t-[10px] after:border-l-[7px] after:border-l-transparent after:border-r-[4px] after:border-r-transparent',
    'bottom-right': 'before:bottom-[-13px] before:right-4 before:border-t-indigo-400 before:border-t-[13px] before:border-r-[10px] before:border-r-transparent before:border-l-[6px] before:border-l-transparent after:bottom-[-9px] after:right-[18px] after:border-t-white after:border-t-[10px] after:border-r-[7px] after:border-r-transparent after:border-l-[4px] after:border-l-transparent',
    'top-left':     'before:top-[-13px] before:left-4 before:border-b-indigo-400 before:border-b-[13px] before:border-l-[10px] before:border-l-transparent before:border-r-[6px] before:border-r-transparent after:top-[-9px] after:left-[18px] after:border-b-white after:border-b-[10px] after:border-l-[7px] after:border-l-transparent after:border-r-[4px] after:border-r-transparent',
    'top-right':    'before:top-[-13px] before:right-4 before:border-b-indigo-400 before:border-b-[13px] before:border-r-[10px] before:border-r-transparent border-l-[6px] before:border-l-transparent after:top-[-9px] after:right-[18px] after:border-b-white after:border-b-[10px] after:border-r-[7px] after:border-r-transparent after:border-l-[4px] after:border-l-transparent',
  }[tail] || '';

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ top: `${top}%`, left: `${left}%`, maxWidth: '52%' }}
    >
      <div
        className={`
          relative
          bg-white/95 backdrop-blur-xs border-2 border-indigo-400 rounded-2xl
          text-slate-800 text-[10px] sm:text-xs leading-snug
          font-bold px-3 py-2
          shadow-[2px_2px_0px_#818cf8] ring-1 ring-white/80
          before:content-[''] before:absolute before:w-0 before:h-0
          after:content-[''] after:absolute after:w-0 after:h-0
          ${tailClass}
        `}
        style={{ fontFamily: "'Tiro Devanagari Hindi', serif" }}
      >
        {text}
      </div>
    </div>
  );
}