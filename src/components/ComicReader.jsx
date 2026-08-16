import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, BarChart2, X, RefreshCw, WifiOff,
  Eye, EyeOff, ChevronUp, PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComicPage from './ComicPage';
import ProgressBar from './ProgressBar';
import { useSessionTracker } from '../hooks/useSessionTracker';
import { fetchComic, fetchAnalytics } from '../api/comicApi';

export default function ComicReader() {
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCaption, setShowCaption] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef(null);
  const pageRefs = useRef([]);

  const totalPages = comic?.totalPages || 0;
  useSessionTracker(currentPage, totalPages);

  useEffect(() => { loadComic(); }, []);

  // Track visible page via IntersectionObserver
  useEffect(() => {
    if (!comic) return;
    const observers = [];
    pageRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setCurrentPage(i + 1); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [comic]);

  // Scroll-to-top button threshold
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setShowScrollTop(el.scrollTop > 500);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, [comic]);

  async function loadComic() {
    try {
      setLoading(true); setError(null);
      const res = await fetchComic();
      setComic(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'कॉमिक लोड नहीं हो सकी। सर्वर चेक करें।');
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const res = await fetchAnalytics();
      setAnalytics(res.data);
    } catch { setAnalytics(null); }
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // Each panel is its own full page — group by pageNumber
  const pages = comic
    ? (() => {
        const map = {};
        comic.panels.forEach(p => {
          if (!map[p.pageNumber]) map[p.pageNumber] = [];
          map[p.pageNumber].push(p);
        });
        return Object.keys(map)
          .sort((a, b) => +a - +b)
          .map(k => ({ pageNumber: +k, panels: map[k].sort((a, b) => a.panelNumber - b.panelNumber) }));
      })()
    : [];

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin" />
        </div>
        <h2 className="hindi-text text-yellow-400 text-2xl font-bold">धुआँ</h2>
        <p className="hindi-text text-gray-500 text-sm">कॉमिक लोड हो रही है...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center gap-6 px-4">
        <WifiOff className="text-red-500 w-12 h-12 opacity-60" />
        <h2 className="hindi-text text-red-400 text-lg font-bold">कनेक्शन विफल</h2>
        <p className="hindi-text text-gray-400 text-sm text-center max-w-xs">{error}</p>
        <button onClick={loadComic}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded transition-colors">
          <RefreshCw size={15} />
          <span className="hindi-text">पुनः प्रयास</span>
        </button>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#111]">

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-black border-b-2 border-yellow-500/40 z-30">
        <div className="flex items-center gap-2">
          <BookOpen className="text-yellow-400 w-5 h-5" />
          <h1 className="hindi-text text-white font-bold text-base sm:text-lg truncate max-w-[180px] sm:max-w-sm">
            {comic?.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCaption(v => !v)}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-2.5 py-1.5 rounded border border-gray-700 transition-all">
            {showCaption ? <Eye size={13} /> : <EyeOff size={13} />}
            <span className="hidden sm:inline hindi-text">{showCaption ? 'कैप्शन छुपाएँ' : 'कैप्शन दिखाएँ'}</span>
          </button>
          <button onClick={() => { setShowAnalytics(true); loadAnalytics(); }}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-2.5 py-1.5 rounded border border-gray-700 transition-all">
            <BarChart2 size={13} />
            <span className="hidden sm:inline">Stats</span>
          </button>
          {/* Writer's portal link */}
          <Link to="/admin"
            className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs px-2.5 py-1.5 rounded border border-yellow-500/30 hover:border-yellow-500/60 transition-all"
            title="Writer's Portal">
            <PenLine size={13} />
            <span className="hidden sm:inline font-medium">Writer</span>
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="flex-shrink-0 w-full bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>

      {/* Scrollable comic feed */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col items-center">

        {/* Cover card */}
        <div className="w-full max-w-2xl px-4 pt-8 pb-6 text-center">
          <div className="inline-block border-4 border-yellow-400 px-6 py-1 mb-3">
            <h2 className="hindi-text text-yellow-400 text-4xl sm:text-5xl font-black tracking-wide"
                style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000' }}>
              धुआँ
            </h2>
          </div>
          <p className="hindi-text text-gray-400 text-sm leading-relaxed max-w-md mx-auto mt-2">
            {comic?.description}
          </p>
        </div>

        {/* Pages */}
        <div className="w-full max-w-2xl px-2 sm:px-4 pb-20 flex flex-col gap-8">
          {pages.map((page, idx) => (
            <div key={page.pageNumber} ref={el => (pageRefs.current[idx] = el)}>
              <ComicPage
                panels={page.panels}
                pageNumber={page.pageNumber}
                showCaption={showCaption}
              />
            </div>
          ))}

          {/* End card */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-10"
          >
            <div className="inline-block border-2 border-yellow-500/40 px-8 py-6 bg-black/40">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="hindi-text text-yellow-400 text-xl font-bold mb-2">— समाप्त —</h3>
              <p className="hindi-text text-gray-500 text-sm mb-5">अगला अंक जल्द आएगा...</p>
              <button onClick={scrollToTop}
                className="hindi-text bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 transition-colors text-sm">
                फिर से पढ़ें ↑
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Scroll-to-top FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-5 z-40 bg-yellow-500 hover:bg-yellow-400 text-black p-3 shadow-lg transition-colors"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
            onClick={() => setShowAnalytics(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border-2 border-yellow-500/30 rounded p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="text-yellow-400 w-5 h-5" />
                  <h3 className="text-white font-bold">Reader Analytics</h3>
                </div>
                <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              {analytics ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'कुल पाठक', value: analytics.totalReaders, icon: '👥' },
                    { label: 'पूर्ण पाठक', value: analytics.completedReaders, icon: '✅' },
                    { label: 'समापन दर', value: `${analytics.completionRate}%`, icon: '📊' },
                    { label: 'औसत समय', value: analytics.avgTimeFormatted, icon: '⏱️' },
                    { label: 'आज के पाठक', value: analytics.recentReaders, icon: '🔥' },
                    { label: 'सर्वाधिक', value: `पृष्ठ ${analytics.mostReadPage}`, icon: '📖' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800/60 rounded p-3 border border-gray-700/50">
                      <div className="text-lg mb-1">{s.icon}</div>
                      <div className="text-white font-bold text-lg">{s.value}</div>
                      <div className="hindi-text text-gray-500 text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
