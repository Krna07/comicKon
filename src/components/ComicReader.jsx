import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BookOpen, BarChart2, X, RefreshCw, WifiOff, FileText, MoreHorizontal,
  Eye, EyeOff, ChevronUp, PenLine, Loader2, ArrowLeft, Lock, Star,
  Sun, Moon, User, Users, CheckCircle2, Percent, Clock, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComicPage   from './ComicPage';
import NovelReader from './NovelReader';
import ProgressBar from './ProgressBar';
import { useTheme } from '../hooks/useTheme';
import { useSessionTracker, getStoredReaderName, setStoredReaderName } from '../hooks/useSessionTracker';
import { fetchEpisodeById, fetchEpisodes, fetchAnalytics, submitRating } from '../api/comicApi';
import './ComicReader.css';

function getEpisodeMode(episode) {
  if (!episode) return 'comic';
  if (episode.type === 'novel') return 'novel';
  if (episode.type === 'comic') return 'comic';
  if (episode.novelContent?.trim() && !(episode.panels?.length)) return 'novel';
  return 'comic';
}

function ThemeToggle({ theme, toggleTheme, className = 'reader-icon-btn' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function ReaderShellHeader({ title, subtitle, theme, toggleTheme, backTo = '/', extra }) {
  return (
    <header className="reader-header reader-header--shell">
      <div className="reader-header__row">
        <div className="reader-header__brand">
          <Link to={backTo} className="reader-back" aria-label="Home">
            <ArrowLeft size={16} />
          </Link>
          <div className="reader-mark" aria-hidden="true">
            <BookOpen size={16} />
          </div>
          <div className="reader-header__copy">
            {subtitle && <span>{subtitle}</span>}
            <h1 className="hindi-text">{title}</h1>
          </div>
        </div>
        <div className="reader-header__actions">
          {extra}
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    </header>
  );
}

function ReaderHeader({
  episode,
  mode,
  readerName,
  showCaption,
  onToggleCaption,
  theme,
  toggleTheme,
  onOpenStats,
  currentPage,
  totalPages,
  readPercent,
}) {
  const isNovel = mode === 'novel';
  const MarkIcon = isNovel ? FileText : BookOpen;
  const [menuOpen, setMenuOpen] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  return (
    <header className={`reader-header reader-header--${mode}`}>
      <div className="reader-header__row">
        <div className="reader-header__brand">
          <Link to="/" className="reader-back" aria-label="Home">
            <ArrowLeft size={16} />
          </Link>
          <div className="reader-mark reader-mark--type" aria-hidden="true">
            <MarkIcon size={16} />
          </div>
          <div className="reader-header__copy">
            <div className="reader-header__kicker">
              <span className="reader-header__ep">Episode {episode?.episodeNumber}</span>
              <span className={`reader-header__type is-${mode}`}>
                {isNovel ? 'Novel' : 'Comic'}
              </span>
              {episode?.episodeTitle && (
                <span className="reader-header__part hindi-text">{episode.episodeTitle}</span>
              )}
            </div>
            <h1 className="hindi-text">{episode?.title || 'धुआँ'}</h1>
          </div>
        </div>

        <div ref={actionsRef} className={`reader-header__actions${menuOpen ? ' is-open' : ''}`}>
          <span className="reader-chip reader-chip--name reader-chip--desktop">
            <User size={12} /> {readerName}
          </span>

          {!isNovel && (
            <button
              type="button"
              onClick={onToggleCaption}
              className={`reader-chip reader-chip--desktop${showCaption ? ' is-on' : ''}`}
              aria-pressed={showCaption}
              title={showCaption ? 'कैप्शन छुपाएँ' : 'कैप्शन दिखाएँ'}
            >
              {showCaption ? <Eye size={13} /> : <EyeOff size={13} />}
              <span className="reader-chip__label">कैप्शन</span>
            </button>
          )}

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <button
            type="button"
            onClick={onOpenStats}
            className="reader-chip reader-chip--desktop"
          >
            <BarChart2 size={13} />
            <span className="reader-chip__label">Stats</span>
          </button>

          <Link to="/admin" className="reader-chip reader-chip--writer reader-chip--desktop">
            <PenLine size={13} />
            <span className="reader-chip__label">Writer</span>
          </Link>

          {!isNovel && (
            <button
              type="button"
              onClick={onToggleCaption}
              className={`reader-icon-btn reader-chip--mobile${showCaption ? ' is-on' : ''}`}
              aria-pressed={showCaption}
              aria-label="Toggle captions"
            >
              {showCaption ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          )}

          <button
            type="button"
            className="reader-icon-btn reader-chip--mobile reader-header__menu-btn"
            aria-expanded={menuOpen}
            aria-label="More options"
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div className="reader-header__menu">
              <span className="reader-header__menu-name hindi-text">
                <User size={13} /> {readerName}
              </span>
              <button type="button" className="reader-header__menu-item" onClick={() => { onOpenStats(); setMenuOpen(false); }}>
                <BarChart2 size={14} /> Stats
              </button>
              <Link to="/admin" className="reader-header__menu-item" onClick={() => setMenuOpen(false)}>
                <PenLine size={14} /> Writer
              </Link>
            </div>
          )}
        </div>
      </div>

      {isNovel
        ? <ProgressBar mode="novel" percent={readPercent} />
        : <ProgressBar mode="comic" currentPage={currentPage} totalPages={totalPages} />}
    </header>
  );
}

function NameGate({ onEnter, theme, toggleTheme }) {
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
    <div className="reader">
      <ReaderShellHeader
        title="धुआँ"
        subtitle="Reader"
        theme={theme}
        toggleTheme={toggleTheme}
        backTo="/"
      />
      <div className="reader-screen reader-screen--inline">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="reader-gate"
      >
        <div className="reader-screen__icon">
          <BookOpen size={28} />
        </div>

        <div>
          <h1 className="hindi-text">धुआँ</h1>
          <p className="hindi-text">
            पढ़ना शुरू करने से पहले,<br />अपना नाम बताइए
          </p>
        </div>

        <form onSubmit={submit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="आपका नाम..."
            maxLength={60}
            className="hindi-text"
          />
          <motion.button
            type="submit"
            disabled={!name.trim()}
            whileTap={{ scale: 0.97 }}
            className="reader-btn"
          >
            पढ़ना शुरू करें →
          </motion.button>
        </form>

        <p style={{ fontSize: '0.75rem' }}>
          आपका नाम केवल रेटिंग के साथ दिखाया जाएगा
        </p>
      </motion.div>
      </div>
    </div>
  );
}

function RatingCard({ sessionId, readerName, episodeTitle, onRated }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!selected) return;
    setSaving(true);
    try {
      await submitRating(sessionId, selected, readerName);
      setSubmitted(true);
      setTimeout(() => onRated(selected), 1200);
    } catch {
      onRated(selected);
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="read-card"
    >
      {submitted ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rate-thanks"
        >
          <CheckCircle2 size={36} className="rate-thanks__icon" />
          <p className="hindi-text" style={{ color: 'var(--page-fg)', fontWeight: 800, fontSize: '1.1rem' }}>
            शुक्रिया, {readerName}!
          </p>
          <p className="hindi-text">आपने {selected}/10 रेटिंग दी</p>
        </motion.div>
      ) : (
        <>
          <Star size={28} className="rate-thanks__icon" />
          <div>
            <p className="hindi-text" style={{ color: 'var(--page-fg)', fontWeight: 800 }}>
              इस अंक को रेटिंग दें
            </p>
            <p className="hindi-text" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {episodeTitle}
            </p>
          </div>

          <div className="rate-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <motion.button
                key={n}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(n)}
                className={
                  selected === n ? 'is-on' : selected && n < selected ? 'is-fill' : ''
                }
              >
                {n}
              </motion.button>
            ))}
          </div>

          {selected && (
            <p className="hindi-text" style={{ fontSize: '0.75rem' }}>
              {ratingLabel(selected)}
            </p>
          )}

          <motion.button
            type="button"
            onClick={submit}
            disabled={!selected || saving}
            whileTap={{ scale: 0.97 }}
            className="reader-btn reader-btn--sm"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> सहेज रहे हैं...</>
              : <><Star size={14} /> रेटिंग दें</>}
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

function ratingLabel(n) {
  if (n <= 2)  return 'काफी निराशाजनक';
  if (n <= 4)  return 'ठीक-ठाक';
  if (n <= 6)  return 'अच्छा';
  if (n <= 8)  return 'बहुत अच्छा';
  return 'शानदार!';
}

const STAT_ITEMS = (a) => [
  { label: 'कुल पाठक',    value: a.totalReaders,         Icon: Users,        tone: 'blue' },
  { label: 'पूर्ण पाठक',  value: a.completedReaders,     Icon: CheckCircle2, tone: 'green' },
  { label: 'समापन दर',    value: `${a.completionRate}%`, Icon: Percent,      tone: 'purple' },
  { label: 'औसत समय',    value: a.avgTimeFormatted,      Icon: Clock,        tone: 'amber' },
  { label: 'आज के पाठक', value: a.recentReaders,         Icon: Flame,        tone: 'orange' },
  { label: 'औसत रेटिंग', value: a.avgRating ? `${a.avgRating}/10` : '—', Icon: Star, tone: 'red' },
];

export default function ComicReader() {
  const { id } = useParams();
  const { theme, toggleTheme } = useTheme();

  const [comic,         setComic]         = useState(null);
  const [allEpisodes,   setAllEpisodes]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showCaption,   setShowCaption]   = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics,     setAnalytics]     = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [readPercent,   setReadPercent]   = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userRating,    setUserRating]    = useState(null);
  const [readerName,    setReaderName]    = useState(() => getStoredReaderName());

  const scrollRef = useRef(null);
  const pageRefs  = useRef([]);
  const totalPages = comic?.totalPages || 0;
  const episodeMode = comic ? getEpisodeMode(comic) : 'comic';
  const isNovel = episodeMode === 'novel';
  const { sessionId } = useSessionTracker(currentPage, totalPages, readerName);

  useEffect(() => { loadComic(); }, [id]);

  useEffect(() => {
    setCurrentPage(1);
    setReadPercent(0);
    setUserRating(null);
    setShowScrollTop(false);
  }, [id]);

  useEffect(() => {
    if (!comic || isNovel) return;
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
  }, [comic, isNovel]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => {
      const max = el.scrollHeight - el.clientHeight;
      setShowScrollTop(el.scrollTop > 600);
      setReadPercent(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    };
    el.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => el.removeEventListener('scroll', fn);
  }, [comic, isNovel]);

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

  if (!readerName && !loading && !error) {
    return <NameGate onEnter={name => setReaderName(name)} theme={theme} toggleTheme={toggleTheme} />;
  }

  if (loading) return (
    <div className="reader">
      <div className="reader__blob reader__blob--tr" aria-hidden="true" />
      <div className="reader__blob reader__blob--bl" aria-hidden="true" />
      <ReaderShellHeader
        title="धुआँ"
        subtitle="Loading..."
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="reader-screen reader-screen--inline">
        <div className="reader-spin"><span /><i /></div>
        <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--home-muted)' }}>
          Loading Story...
        </p>
      </div>
    </div>
  );

  if (error) return (
    <div className="reader">
      <ReaderShellHeader
        title="धुआँ"
        subtitle="Error"
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="reader-screen reader-screen--inline">
        <WifiOff size={52} style={{ color: '#ef4444', opacity: 0.7 }} />
        <div style={{ maxWidth: '18rem', textAlign: 'center' }}>
          <h2 className="hindi-text">कनेक्शन विफल</h2>
          <p className="hindi-text">{error}</p>
        </div>
        <button type="button" onClick={loadComic} className="reader-btn reader-btn--sm">
          <RefreshCw size={15} /> पुनः प्रयास
        </button>
      </div>
    </div>
  );

  const mode = episodeMode;

  const pages = (!isNovel && comic?.panels?.length) ? (() => {
    const map = {};
    comic.panels.forEach(p => {
      if (!map[p.pageNumber]) map[p.pageNumber] = [];
      map[p.pageNumber].push(p);
    });
    return Object.keys(map).sort((a, b) => +a - +b)
      .map(k => ({ pageNumber: +k, panels: map[k].sort((a, b) => a.panelNumber - b.panelNumber) }));
  })() : [];

  function EndCard() {
    const nextEp = allEpisodes.find(e => e.episodeNumber === (comic?.episodeNumber || 0) + 1);
    return (
      <div className="read-end">
        {!userRating && (
          <RatingCard
            sessionId={sessionId}
            readerName={readerName}
            episodeTitle={comic?.title}
            onRated={r => setUserRating(r)}
          />
        )}
        {userRating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="read-card__thanks">
            <Star size={18} className="rate-thanks__icon" />
            <p className="hindi-text" style={{ margin: 0 }}>
              आपने <strong>{userRating}/10</strong> रेटिंग दी — शुक्रिया {readerName}!
            </p>
          </motion.div>
        )}

        <div className="read-card">
          <BookOpen size={28} className="rate-thanks__icon" />
          <h3 className="hindi-text">— समाप्त —</h3>
          {nextEp ? (
            <>
              <p className="hindi-text">अगला अंक उपलब्ध है!</p>
              <Link to={`/read/${nextEp._id}`} className="reader-btn reader-btn--sm">
                Episode {nextEp.episodeNumber} पढ़ें →
              </Link>
            </>
          ) : (
            <>
              <p className="hindi-text">
                यह अंक यहाँ खत्म होता है।<br />अगला अंक जल्द आएगा...
              </p>
              <span className="reader-pill">
                <Lock size={11} /> Episode {(comic?.episodeNumber || 1) + 1} · जल्द आएगा
              </span>
            </>
          )}
          <div className="read-nav">
            <button type="button" onClick={scrollToTop} className="reader-btn reader-btn--ghost reader-btn--sm hindi-text">
              <ChevronUp size={15} /> फिर से पढ़ें
            </button>
            <Link to="/" className="reader-btn reader-btn--ghost reader-btn--sm hindi-text">
              सभी अंक
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reader">
      <div className="reader__blob reader__blob--tr" aria-hidden="true" />
      <div className="reader__blob reader__blob--bl" aria-hidden="true" />

      <ReaderHeader
        episode={comic}
        mode={mode}
        readerName={readerName}
        showCaption={showCaption}
        onToggleCaption={() => setShowCaption(v => !v)}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenStats={() => { setShowAnalytics(true); loadAnalytics(); }}
        currentPage={currentPage}
        totalPages={totalPages}
        readPercent={readPercent}
      />

      <main ref={scrollRef} className="reader-main">
        {isNovel && (
          <NovelReader
            episode={comic}
            allEpisodes={allEpisodes}
            scrollToTop={scrollToTop}
            endCard={<EndCard />}
          />
        )}

        {!isNovel && (
          <div className="reader-body">
            <div className="reader-hero">
              <div className="reader-hero__kicker">
                <span>
                  Episode {comic?.episodeNumber}
                  {comic?.episodeTitle ? ` · ${comic.episodeTitle}` : ''}
                </span>
              </div>
              <h2 className="hindi-text">{comic?.title}</h2>
              {comic?.description && (
                <p className="hindi-text">{comic.description}</p>
              )}
              <div className="reader-hero__pills">
                <span className="reader-pill">{totalPages} Pages</span>
                <span className="reader-pill">Hindi</span>
                <span className="reader-pill is-accent">Comic</span>
              </div>
            </div>

            <div className="reader-feed">
              {pages.map((page, idx) => (
                <div key={page.pageNumber} ref={el => (pageRefs.current[idx] = el)}>
                  <ComicPage panels={page.panels} pageNumber={page.pageNumber} showCaption={showCaption} />
                </div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <EndCard />
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={scrollToTop}
            className="reader-fab"
            aria-label="Scroll to top"
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="reader-overlay"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="reader-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="reader-modal__head">
                <div className="reader-modal__head-title">
                  <BarChart2 size={16} />
                  <h3>Reader Stats</h3>
                </div>
                <button
                  type="button"
                  className="reader-modal__close"
                  onClick={() => setShowAnalytics(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="reader-modal__body">
                {analytics ? (
                  <div className="stat-grid">
                    {STAT_ITEMS(analytics).map(s => (
                      <div key={s.label} className={`stat-mini stat-mini--${s.tone}`}>
                        <s.Icon size={15} />
                        <strong>{s.value}</strong>
                        <span className="hindi-text">{s.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reader-modal__loading">
                    <Loader2 size={22} className="animate-spin" />
                    <p>Loading stats...</p>
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
