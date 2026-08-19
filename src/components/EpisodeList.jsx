import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, ChevronRight, PenLine } from 'lucide-react';
import { fetchEpisodes } from '../api/comicApi';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://comickon.onrender.com';

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

export default function EpisodeList() {
  const [episodes, setEpisodes] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchEpisodes()
      .then(r => setEpisodes(r.data))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center">

      {/* ── Header ── */}
      <header className="w-full max-w-2xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <BookOpen className="text-orange-400 w-4 h-4" />
          </div>
          <h1 className="hindi-text text-white font-black text-lg">धुआँ</h1>
        </div>
        <Link to="/admin"
          className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 text-xs px-3 py-1.5 rounded-xl transition-all font-medium">
          <PenLine size={12} /> Writer
        </Link>
      </header>

      {/* ── Hero banner ── */}
      <div className="w-full max-w-2xl px-5 pt-8 pb-10 text-center">
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/30" />
          <span className="text-orange-500/50 text-[10px] tracking-[0.3em] uppercase font-bold whitespace-nowrap">Comic Series</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/30" />
        </div>
        <h2 className="hindi-text text-white font-black mb-3"
          style={{ fontSize: 'clamp(2.8rem, 12vw, 5.5rem)', textShadow: '0 0 60px rgba(249,115,22,0.25)' }}>
          धुआँ
        </h2>
        <p className="hindi-text text-gray-500 text-sm leading-relaxed">
          एक रहस्यमयी कहानी जो अँधेरे से जन्म लेती है
        </p>
      </div>

      {/* ── Episode grid ── */}
      <div className="w-full max-w-2xl px-4 pb-20">
        <h3 className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-5">
          All Episodes
        </h3>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {episodes.map((ep, idx) => (
              <motion.div key={ep._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}>
                <Link to={`/read/${ep._id}`}
                  className="flex items-center gap-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-orange-500/30 rounded-2xl p-4 transition-all group">

                  {/* Cover */}
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border border-white/[0.08]">
                    {resolveImg(ep.coverImage)
                      ? <img src={resolveImg(ep.coverImage)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-orange-500/70 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        Episode {ep.episodeNumber}
                      </span>
                      {ep.episodeTitle && (
                        <span className="hindi-text text-gray-600 text-xs">· {ep.episodeTitle}</span>
                      )}
                    </div>
                    <h4 className="hindi-text text-white font-bold text-base leading-tight truncate">{ep.title}</h4>
                    <p className="hindi-text text-gray-600 text-xs mt-1 leading-relaxed line-clamp-2">{ep.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-700 text-[10px]">📄 {ep.totalPages} pages</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={18} className="text-gray-700 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
                </Link>
              </motion.div>
            ))}

            {/* Coming soon card for next episode */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: episodes.length * 0.08 + 0.1, duration: 0.4 }}
              className="flex items-center gap-4 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl p-4"
            >
              <div className="w-16 h-20 rounded-xl bg-white/[0.04] flex-shrink-0 flex items-center justify-center">
                <Lock size={18} className="text-gray-700" />
              </div>
              <div className="flex-1">
                <span className="text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                  Episode {episodes.length + 1}
                </span>
                <p className="hindi-text text-gray-700 text-sm font-semibold mt-0.5">जल्द आएगा...</p>
                <p className="hindi-text text-gray-800 text-xs mt-1">अगला अंक तैयार हो रहा है</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
