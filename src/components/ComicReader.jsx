import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, BarChart2, X, RefreshCw, WifiOff,
  Eye, EyeOff, ChevronUp, PenLine, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComicPage from './ComicPage';
import ProgressBar from './ProgressBar';
import { useSessionTracker } from '../hooks/useSessionTracker';
import { fetchComic, fetchAnalytics } from '../api/comicApi';

export default function ComicReader() {
  const [comic,         setComic]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showCaption,   setShowCaption]   = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics,     setAnalytics]     = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef(null);
  const pageRefs  = useRef([]);
  const totalPages = comic?.totalPages || 0;
  useSessionTracker(currentPage, totalPages);

  useEffect(() => { loadComic(); }, []);

  useEffect(() => {
    if (!comic) return;
    const obs = [];
    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setCurrentPage(i + 1); },
        { threshold: 0.25 }
      );
      o.observe(el); obs.push(o);
    });
    return () => obs.forEach(o => o.disconnect());
  }, [comic]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setShowScrollTop(el.scrollTop > 600);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, [comic]);

  async function loadComic() {
    try {
      setLoading(true); setError(null);
      const res = await fetchComic();
      setComic(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'कॉमिक लोड नहीं हो सकी।');
    } finally { setLoading(false); }
  }

  async function loadAnalytics() {
    try { const r = await fetchAnalytics(); setAnalytics(r.data); }
    catch { setAnalytics(null); }
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const pages = comic ? (() => {
    const map = {};
    comic.panels.forEach(p => {
      if (!map[p.pageNumber]) map[p.pageNumber] = [];
      map[p.pageNumber].push(p);
    });
    return Object.keys(map).sort((a, b) => +a - +b)
      .map(k => ({ pageNumber: +k, panels: map[k].sort((a, b) => a.panelNumber - b.panelNumber) }));
  })() : [];

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border border-orange-500/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-orange-400 animate-spin" />
        <div className="absolute inset-3 rounded-full border-b-2 border-orange-600/50 animate-spin"
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <div className="text-center px-4">
        <h2 className="hindi-text text-white text-3xl font-black tracking-wide">धुआँ</h2>
        <p className="text-gray-600 text-xs mt-2 tracking-widest uppercase">Loading Story...</p>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 px-6">
      <WifiOff className="text-red-500/60 w-14 h-14 flex-shrink-0" />
      <div className="text-center w-full max-w-xs">
        <h2 className="hindi-text text-white text-lg font-bold mb-3">कनेक्शन विफल</h2>
        <p className="hindi-text text-gray-500 text-sm leading-relaxed break-words">{error}</p>
      </div>
      <button onClick={loadComic}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
        <RefreshCw size={15} /> पुनः प्रयास
      </button>
    </div>
  );

  // ── Main ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#080808]">

      {/* ── Header ── */}
      <header className="flex-shrink-0 z-30 bg-[#080808]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* Title — shrinks, never clips mid-letter */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <BookOpen className="text-orange-400 w-4 h-4" />
            </div>
            <h1 className="hindi-text text-white font-bold text-sm sm:text-base leading-snug line-clamp-1">
              {comic?.title || 'धुआँ'}
            </h1>
          </div>

          {/* Controls — fixed, never shrink */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCaption(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all font-medium whitespace-nowrap
                ${showCaption
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                  : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
            >
              {showCaption ? <Eye size={13} /> : <EyeOff size={13} />}
              <span className="hidden sm:inline">{showCaption ? 'कैप्शन' : 'कैप्शन'}</span>
            </button>

            <button
              onClick={() => { setShowAnalytics(true); loadAnalytics(); }}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-200 text-xs px-3 py-2 rounded-xl transition-all font-medium whitespace-nowrap"
            >
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Stats</span>
            </button>

            <Link to="/admin"
              className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/50 text-orange-400 text-xs px-3 py-2 rounded-xl transition-all font-medium whitespace-nowrap"
            >
              <PenLine size={13} />
              <span className="hidden sm:inline">Writer</span>
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentPage={currentPage} totalPages={totalPages} />
        </div>
      </header>

      {/* ── Feed ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col items-center">

          {/* Hero */}
          <div className="w-full px-5 pt-12 pb-10 text-center">
            <div className="flex items-center gap-3 mb-8 px-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/40" />
              <span className="text-orange-500/60 text-[10px] tracking-[0.3em] uppercase font-bold whitespace-nowrap">Episode 1</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/40" />
            </div>

            <h2
              className="hindi-text text-white font-black leading-tight mb-5"
              style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', textShadow: '0 0 60px rgba(249,115,22,0.3)' }}
            >
              धुआँ
            </h2>

            {/* Description — wraps naturally, no max-w constraint that clips */}
            <p className="hindi-text text-gray-500 text-sm sm:text-base leading-relaxed px-2">
              {comic?.description}
            </p>

            {/* Meta pills */}
            <div className="flex items-center justify-center gap-2 mt-7 flex-wrap px-2">
              <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-4 py-1.5 bg-white/[0.02] whitespace-nowrap">
                📄 {totalPages} Pages
              </span>
              <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-4 py-1.5 bg-white/[0.02] whitespace-nowrap">
                🌙 Hindi
              </span>
              <span className="text-xs text-orange-500/70 border border-orange-500/20 rounded-full px-4 py-1.5 bg-orange-500/5 whitespace-nowrap">
                ✦ Free to Read
              </span>
            </div>
          </div>

          {/* Pages */}
          <div className="w-full px-4 sm:px-6 pb-24 flex flex-col gap-12">
            {pages.map((page, idx) => (
              <div key={page.pageNumber} ref={el => (pageRefs.current[idx] = el)}>
                <ComicPage panels={page.panels} pageNumber={page.pageNumber} showCaption={showCaption} />
              </div>
            ))}

            {/* End card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full py-12"
            >
              <div className="w-full bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-white/[0.08] rounded-3xl px-8 py-10 flex flex-col items-center gap-6 backdrop-blur-sm">
                <div className="text-4xl">📖</div>
                <div className="text-center w-full">
                  <h3 className="hindi-text text-white text-xl font-black mb-3">— समाप्त —</h3>
                  <p className="hindi-text text-gray-500 text-sm leading-[2] w-full">
                    यह अंक यहाँ खत्म होता है।{'\n'}अगला अंक जल्द आएगा...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500/40" />
                  <span className="text-orange-500/50 text-xs">🔥</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-500/40" />
                </div>
                <button onClick={scrollToTop}
                  className="hindi-text flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20 whitespace-nowrap">
                  <ChevronUp size={15} /> फिर से पढ़ें
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={scrollToTop}
            className="fixed bottom-7 right-5 z-40 w-11 h-11 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 transition-colors"
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <BarChart2 size={15} className="text-orange-400" />
                  </div>
                  <h3 className="text-white font-bold text-base">Reader Stats</h3>
                </div>
                <button onClick={() => setShowAnalytics(false)}
                  className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-gray-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0">
                  <X size={15} />
                </button>
              </div>

              {/* Grid */}
              <div className="p-5">
                {analytics ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'कुल पाठक',    value: analytics.totalReaders,             icon: '👥' },
                      { label: 'पूर्ण पाठक',  value: analytics.completedReaders,         icon: '✅' },
                      { label: 'समापन दर',    value: `${analytics.completionRate}%`,     icon: '📊' },
                      { label: 'औसत समय',    value: analytics.avgTimeFormatted,          icon: '⏱️' },
                      { label: 'आज के पाठक', value: analytics.recentReaders,            icon: '🔥' },
                      { label: 'सर्वाधिक',    value: `पृ॰ ${analytics.mostReadPage}`,   icon: '📖' },
                    ].map(s => (
                      <div key={s.label}
                        className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-2xl p-4 transition-colors min-w-0">
                        <div className="text-xl mb-2 leading-none">{s.icon}</div>
                        {/* value uses break-words so long strings wrap */}
                        <div className="text-white font-black text-lg leading-tight break-words">{s.value}</div>
                        <div className="hindi-text text-gray-600 text-xs mt-2 leading-snug">{s.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 size={22} className="text-orange-400 animate-spin" />
                    <p className="text-gray-600 text-sm">Loading stats...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
