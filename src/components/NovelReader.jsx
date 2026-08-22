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

  // Split on blank lines → paragraphs
  const paragraphs = (episode.novelContent || '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">

      {/* Cover image */}
      {coverSrc && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full px-4 sm:px-6 pt-8"
        >
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10"
            style={{ lineHeight: 0 }}>
            {!imgLoaded && (
              <div className="w-full aspect-[3/4] bg-gray-900 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
              </div>
            )}
            <img
              src={coverSrc}
              alt={episode.title}
              className={`w-full h-auto block transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          </div>
        </motion.div>
      )}

      {/* Episode badge + title */}
      <div className="w-full px-5 pt-10 pb-6 text-center">
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/30" />
          <span className="text-orange-500/60 text-[10px] tracking-[0.3em] uppercase font-bold whitespace-nowrap">
            Episode {episode.episodeNumber} · Novel
            {episode.episodeTitle ? ` · ${episode.episodeTitle}` : ''}
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/30" />
        </div>
        <h2
          className="hindi-text text-white font-black leading-tight mb-4"
          style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: '0 0 50px rgba(249,115,22,0.25)' }}
        >
          {episode.title}
        </h2>
        {episode.description && (
          <p className="hindi-text text-gray-500 text-sm leading-relaxed px-2">{episode.description}</p>
        )}
      </div>

      {/* Ornament */}
      <div className="w-full px-5 sm:px-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          <span className="text-orange-500/40 text-lg select-none">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>
      </div>

      {/* Story text */}
      <div className="w-full px-5 sm:px-8 pb-8">
        {paragraphs.length === 0 ? (
          <p className="hindi-text text-gray-600 text-center italic py-10">कहानी अभी लिखी जा रही है...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {paragraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.45, delay: i < 4 ? i * 0.08 : 0 }}
                className="hindi-text text-gray-200 text-base sm:text-lg leading-[2.3] text-justify"
                style={{ fontFamily: "'Tiro Devanagari Hindi', serif" }}
              >
                {/* Drop-cap on first paragraph */}
                {i === 0 && para.length > 0 ? (
                  <>
                    <span
                      className="float-left text-orange-400 font-black mr-1 mt-1 select-none"
                      style={{ fontSize: '3.2rem', lineHeight: '0.85', fontFamily: "'Tiro Devanagari Hindi', serif" }}
                    >
                      {para[0]}
                    </span>
                    {para.slice(1)}
                  </>
                ) : para}
              </motion.p>
            ))}
          </div>
        )}

        {/* Closing ornament */}
        <div className="flex items-center gap-3 mt-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
          <span className="text-orange-500/25 text-base select-none">— ✦ —</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        </div>
      </div>

      {/* End card — injected from parent (includes rating) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full px-4 sm:px-6 pb-20"
      >
        {endCard || (
          // Fallback if used standalone (no endCard prop)
          <div className="w-full bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-white/[0.08] rounded-3xl px-8 py-10 flex flex-col items-center gap-6 backdrop-blur-sm">
            <div className="text-4xl">📜</div>
            <div className="text-center w-full">
              <h3 className="hindi-text text-white text-xl font-black mb-3">— समाप्त —</h3>
              {allEpisodes.find(e => e.episodeNumber === episode.episodeNumber + 1) ? (
                <>
                  <p className="hindi-text text-gray-400 text-sm mb-5">अगला अंक उपलब्ध है!</p>
                  <Link to={`/read/${allEpisodes.find(e => e.episodeNumber === episode.episodeNumber + 1)._id}`}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                    Episode {episode.episodeNumber + 1} पढ़ें →
                  </Link>
                </>
              ) : (
                <p className="hindi-text text-gray-500 text-sm leading-[2]">
                  यह अंक यहाँ खत्म होता है।<br />अगला अंक जल्द आएगा...
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={scrollToTop}
                className="hindi-text flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
                <ChevronUp size={14} /> फिर से पढ़ें
              </button>
              <Link to="/"
                className="hindi-text flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-bold px-6 py-3 rounded-xl transition-all text-sm">
                सभी अंक
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
