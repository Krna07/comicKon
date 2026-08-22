import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BookOpen, BarChart2, X, RefreshCw, WifiOff,
  Eye, EyeOff, ChevronUp, PenLine, Loader2, ArrowLeft, Lock, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComicPage   from './ComicPage';
import NovelReader from './NovelReader';
import ProgressBar from './ProgressBar';
import { useSessionTracker, getStoredReaderName, setStoredReaderName } from '../hooks/useSessionTracker';
import { fetchEpisodeById, fetchEpisodes, fetchAnalytics, submitRating } from '../api/comicApi';

// ── Name Gate ─────────────────────────────────────────────────────
function NameGate({ onEnter }) {
  const [name, setName] = useState('');
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStoredReaderName(trimmed);
    onEnter(trimmed);
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <BookOpen className="text-orange-400 w-7 h-7" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="hindi-text text-white font-black text-3xl mb-2">धुआँ</h1>
          <p className="hindi-text text-gray-500 text-sm leading-relaxed">
            पढ़ना शुरू करने से पहले,<br />अपना नाम बताइए
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="w-full flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="आपका नाम..."
            maxLength={60}
            className="w-full bg-white/[0.06] border border-white/10 focus:border-orange-500/60 text-white placeholder-gray-600 px-5 py-4 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all hindi-text text-center"
          />
          <motion.button
            type="submit"
            disabled={!name.trim()}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-30 text-white font-black py-4 rounded-2xl text-base shadow-xl shadow-orange-500/20 transition-all"
          >
            पढ़ना शुरू करें →
          </motion.button>
        </form>

        <p className="text-gray-700 text-xs text-center">
          आपका नाम केवल रेटिंग के साथ दिखाया जाएगा
        </p>
      </motion.div>
    </div>
  );
}

// ── Rating Card ───────────────────────────────────────────────────
function RatingCard({ sessionId, readerName, episodeTitle, onRated }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);

  async function submit() {
    if (!selected) return;
    setSaving(true);
    try {
      await submitRating(sessionId, selected, readerName);
      setSubmitted(true);
      setTimeout(() => onRated(selected), 1200);
    } catch {
      // silently fail — non-critical
      onRated(selected);
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full bg-gradient-to-b from-gray-900/90 to-gray-900/50 border border-white/[0.08] rounded-3xl px-6 py-8 flex flex-col items-center gap-5 backdrop-blur-sm"
    >
      {submitted ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 py-4">
          <div className="text-4xl">🙏</div>
          <p className="hindi-text text-white font-bold text-lg text-center">
            शुक्रिया, {readerName}!
          </p>
          <p className="hindi-text text-gray-500 text-sm text-center">
            आपने {selected}/10 रेटिंग दी
          </p>
        </motion.div>
      ) : (
        <>
          <div className="text-3xl">⭐</div>
          <div className="text-center">
            <p className="hindi-text text-white font-bold text-base">इस अंक को रेटिंग दें</p>
            <p className="hindi-text text-gray-600 text-xs mt-1">{episodeTitle}</p>
          </div>

          {/* 1–10 grid */}
          <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(n)}
                className={`aspect-square rounded-2xl text-sm font-black transition-all border
                  ${selected === n
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                    : selected && n <= selected
                      ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                      : 'bg-white/[0.05] border-white/[0.08] text-gray-500 hover:border-orange-500/40 hover:text-gray-300'}`}
              >
                {n}
              </motion.button>
            ))}
          </div>

          {selected && (
            <p className="hindi-text text-gray-400 text-xs">
              {ratingLabel(selected)}
            </p>
          )}

          <motion.button
            onClick={submit}
            disabled={!selected || saving}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-30 text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-lg shadow-orange-500/20 transition-all"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> सहेज रहे हैं...</>
              : <><Star size={14}/> रेटिंग दें</>}
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

function ratingLabel(n) {
  if (n <= 2)  return '😕 काफी निराशाजनक';
  if (n <= 4)  return '😐 ठीक-ठाक';
  if (n <= 6)  return '🙂 अच्छा';
  if (n <= 8)  return '😊 बहुत अच्छा';
  return '🤩 शानदार!';
}

// ── Main ComicReader ──────────────────────────────────────────────
export default function ComicReader() {
  const { id } = useParams();

  const [comic,         setComic]         = useState(null);
  const [allEpisodes,   setAllEpisodes]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showCaption,   setShowCaption]   = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics,     setAnalytics]     = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userRating,    setUserRating]    = useState(null);

  // Name gate — persisted in localStorage across page loads
  const [readerName, setReaderName] = useState(() => getStoredReaderName());

  const scrollRef = useRef(null);
  const pageRefs  = useRef([]);
  const totalPages = comic?.totalPages || 0;
  const { sessionId } = useSessionTracker(currentPage, totalPages, readerName);

  useEffect(() => { loadComic(); }, [id]);

  useEffect(() => {
    if (!comic || comic.type === 'novel') return;
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
      const [comicRes, epRes] = await Promise.all([
        fetchEpisodeById(id),
        fetchEpisodes().catch(() => ({ data: [] }))
      ]);
      setComic(comicRes.data);
      setAllEpisodes(epRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'कॉमिक लोड नहीं हो सकी।');
    } finally { setLoading(false); }
  }

  async function loadAnalytics() {
    try { const r = await fetchAnalytics(); setAnalytics(r.data); }
    catch { setAnalytics(null); }
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const pages = (comic && comic.type !== 'novel') ? (() => {
    const map = {};
    comic.panels.forEach(p => {
      if (!map[p.pageNumber]) map[p.pageNumber] = [];
      map[p.pageNumber].push(p);
    });
    return Object.keys(map).sort((a, b) => +a - +b)
      .map(k => ({ pageNumber: +k, panels: map[k].sort((a, b) => a.panelNumber - b.panelNumber) }));
  })() : [];

  // ── Name gate ────────────────────────────────────────────────
  if (!readerName && !loading && !error) {
    return <NameGate onEnter={name => setReaderName(name)} />;
  }

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
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
        <RefreshCw size={15} /> पुनः प्रयास
      </button>
    </div>
  );

  const isNovel = comic?.type === 'novel';

  // ── End-of-episode card (shared between comic & novel) ───────
  function EndCard() {
    const nextEp = allEpisodes.find(e => e.episodeNumber === (comic?.episodeNumber || 0) + 1);
    return (
      <div className="w-full flex flex-col gap-4">
        {/* Rating — only if not yet rated */}
        {!userRating && (
          <RatingCard
            sessionId={sessionId}
            readerName={readerName}
            episodeTitle={comic?.title}
            onRated={r => setUserRating(r)}
          />
        )}
        {userRating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-3xl px-6 py-5 flex items-center justify-center gap-3">
            <span className="text-2xl">⭐</span>
            <p className="hindi-text text-gray-400 text-sm">
              आपने <span className="text-orange-400 font-bold">{userRating}/10</span> रेटिंग दी — शुक्रिया {readerName}!
            </p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="w-full bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-white/[0.08] rounded-3xl px-8 py-10 flex flex-col items-center gap-6 backdrop-blur-sm">
          <div className="text-4xl">📖</div>
          <div className="text-center w-full">
            <h3 className="hindi-text text-white text-xl font-black mb-3">— समाप्त —</h3>
            {nextEp ? (
              <>
                <p className="hindi-text text-gray-400 text-sm mb-5">अगला अंक उपलब्ध है!</p>
                <Link to={`/read/${nextEp._id}`}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                  Episode {nextEp.episodeNumber} पढ़ें →
                </Link>
              </>
            ) : (
              <>
                <p className="hindi-text text-gray-500 text-sm leading-[2]">
                  यह अंक यहाँ खत्म होता है।<br />अगला अंक जल्द आएगा...
                </p>
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <Lock size={12} className="text-gray-700" />
                  <span className="hindi-text text-gray-700 text-xs">
                    Episode {(comic?.episodeNumber || 1) + 1} · जल्द आएगा
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500/40" />
            <span className="text-orange-500/50 text-xs">🔥</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-500/40" />
          </div>
          <div className="flex gap-3">
            <button onClick={scrollToTop}
              className="hindi-text flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap">
              <ChevronUp size={15} /> फिर से पढ़ें
            </button>
            <Link to="/"
              className="hindi-text flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap">
              सभी अंक
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#080808]">

      {/* ── Shared Header ── */}
      <header className="flex-shrink-0 z-30 bg-[#080808]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* Left: back + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/"
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft className="text-gray-400 w-4 h-4" />
            </Link>
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <BookOpen className="text-orange-400 w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-orange-500/60 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                Episode {comic?.episodeNumber}
                {isNovel && <span className="text-violet-400/60">· Novel</span>}
              </div>
              <h1 className="hindi-text text-white font-bold text-sm leading-none truncate">
                {comic?.title || 'धुआँ'}
              </h1>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reader name chip */}
            <span className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-gray-500 whitespace-nowrap">
              👤 {readerName}
            </span>

            {!isNovel && (
              <button onClick={() => setShowCaption(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all font-medium whitespace-nowrap
                  ${showCaption
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>
                {showCaption ? <Eye size={13} /> : <EyeOff size={13} />}
                <span className="hidden sm:inline">कैप्शन</span>
              </button>
            )}

            <button onClick={() => { setShowAnalytics(true); loadAnalytics(); }}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-200 text-xs px-3 py-2 rounded-xl transition-all font-medium whitespace-nowrap">
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Stats</span>
            </button>

            <Link to="/admin"
              className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/50 text-orange-400 text-xs px-3 py-2 rounded-xl transition-all font-medium whitespace-nowrap">
              <PenLine size={13} />
              <span className="hidden sm:inline">Writer</span>
            </Link>
          </div>
        </div>

        {!isNovel && (
          <div className="max-w-2xl mx-auto">
            <ProgressBar currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </header>

      {/* ── Scrollable feed ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col items-center">

        {/* ══ NOVEL MODE ══ */}
        {isNovel && (
          <NovelReader
            episode={comic}
            allEpisodes={allEpisodes}
            scrollToTop={scrollToTop}
            endCard={<EndCard />}
          />
        )}

        {/* ══ COMIC MODE ══ */}
        {!isNovel && (
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Hero */}
            <div className="w-full px-5 pt-12 pb-10 text-center">
              <div className="flex items-center gap-3 mb-8 px-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/40" />
                <span className="text-orange-500/60 text-[10px] tracking-[0.3em] uppercase font-bold whitespace-nowrap">
                  Episode {comic?.episodeNumber}
                  {comic?.episodeTitle ? ` · ${comic.episodeTitle}` : ''}
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/40" />
              </div>
              <h2
                className="hindi-text text-white font-black leading-tight mb-5"
                style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', textShadow: '0 0 60px rgba(249,115,22,0.3)' }}
              >
                {comic?.title}
              </h2>
              <p className="hindi-text text-gray-500 text-sm sm:text-base leading-relaxed px-2">
                {comic?.description}
              </p>
              <div className="flex items-center justify-center gap-2 mt-7 flex-wrap px-2">
                <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-4 py-1.5 bg-white/[0.02] whitespace-nowrap">
                  📄 {totalPages} Pages
                </span>
                <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-4 py-1.5 bg-white/[0.02] whitespace-nowrap">
                  🌙 Hindi
                </span>
                <span className="text-xs text-orange-500/70 border border-orange-500/20 rounded-full px-4 py-1.5 bg-orange-500/5 whitespace-nowrap">
                  🎨 Comic
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

              {/* End card with rating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-full py-6"
              >
                <EndCard />
              </motion.div>
            </div>
          </div>
        )}
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
            onClick={() => setShowAnalytics(false)}>
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
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
              <div className="p-5">
                {analytics ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'कुल पाठक',    value: analytics.totalReaders,           icon: '👥' },
                      { label: 'पूर्ण पाठक',  value: analytics.completedReaders,       icon: '✅' },
                      { label: 'समापन दर',    value: `${analytics.completionRate}%`,   icon: '📊' },
                      { label: 'औसत समय',    value: analytics.avgTimeFormatted,        icon: '⏱️' },
                      { label: 'आज के पाठक', value: analytics.recentReaders,          icon: '🔥' },
                      { label: 'औसत रेटिंग', value: analytics.avgRating ? `${analytics.avgRating}/10` : '—', icon: '⭐' },
                    ].map(s => (
                      <div key={s.label}
                        className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-2xl p-4 transition-colors min-w-0">
                        <div className="text-xl mb-2 leading-none">{s.icon}</div>
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
