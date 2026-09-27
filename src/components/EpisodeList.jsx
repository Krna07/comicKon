import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, ChevronRight, PenLine, Sun, Moon, Inbox, Smartphone, Download } from 'lucide-react';
import { fetchEpisodes } from '../api/comicApi';
import { useTheme } from '../hooks/useTheme';
import './EpisodeList.css';

const APK_URL = 'https://github.com/Krna07/comicKon/releases/download/v1.0.0/app-release.apk';

// True when running inside the Capacitor Android WebView
const IS_APP = window.Capacitor?.isNativePlatform?.() === true;

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
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchEpisodes()
      .then(r => setEpisodes(r.data))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <div className="home__blob home__blob--tr" />
      <div className="home__blob home__blob--bl" />

      <header className="home-header">
        <div className="home-header__inner">
          <div className="home-header__brand">
            <img
              src="/comickonLogo.png"
              alt="Comickon"
              className="home-header__logo"
            />
          </div>
          <div className="home-header__actions">
            <button
              type="button"
              className="home-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/admin" className="home-writer">
              <PenLine size={12} /> Writer
            </Link>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div className="home-hero__kicker"><span>Comic Series</span></div>
          <h2 className="hindi-text">धुआँ</h2>
          <p className="hindi-text">एक रहस्यमयी कहानी जो अँधेरे से जन्म लेती है</p>
        </section>

        {/* Download app banner — only shown in browser, hidden inside the APK */}
        {!IS_APP && (
          <motion.a
            href={APK_URL}
            className="home-apk-banner"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            aria-label="Download Comickon Android app"
          >
            <div className="home-apk-banner__icon" aria-hidden="true">
              <Smartphone size={22} />
            </div>
            <div className="home-apk-banner__copy">
              <span className="home-apk-banner__title">Get the App</span>
              <span className="home-apk-banner__sub hindi-text">Android के लिए डाउनलोड करें</span>
            </div>
            <div className="home-apk-banner__btn" aria-hidden="true">
              <Download size={15} />
              <span>APK</span>
            </div>
          </motion.a>
        )}

        <h3 className="home-list__head">All Episodes</h3>

        {loading ? (
          <div className="home-stack">
            {[1, 2, 3].map(i => <div key={i} className="home-skel" />)}
          </div>
        ) : episodes.length === 0 ? (
          <div className="home-empty">
            <Inbox size={22} />
            <p>No episodes yet</p>
            <span>Published stories will appear here.</span>
          </div>
        ) : (
          <div className="home-stack">
            {episodes.map((ep, idx) => {
              const cover = resolveImg(ep.coverImage);
              return (
                <motion.div
                  key={ep._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.35 }}
                >
                  <Link to={`/read/${ep._id}`} className="ep-row">
                    <div className={`ep-row__cover${cover ? '' : ' ep-row__cover--empty'}`}>
                      {cover
                        ? <img src={cover} alt="" />
                        : <BookOpen size={18} />}
                    </div>
                    <div className="ep-row__body">
                      <div className="ep-row__meta">
                        <span className="ep-row__num">Episode {ep.episodeNumber}</span>
                        {ep.episodeTitle && (
                          <span className="ep-row__sub hindi-text">· {ep.episodeTitle}</span>
                        )}
                      </div>
                      <h3 className="hindi-text">{ep.title}</h3>
                      {ep.description && (
                        <p className="hindi-text">{ep.description}</p>
                      )}
                      <div className="ep-row__pages">{ep.totalPages} pages</div>
                    </div>
                    <ChevronRight size={18} className="ep-row__go" />
                  </Link>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: episodes.length * 0.07 + 0.08, duration: 0.35 }}
              className="ep-row ep-row--soon"
            >
              <div className="ep-row__cover ep-row__cover--lock">
                <Lock size={16} />
              </div>
              <div className="ep-row__body">
                <div className="ep-row__meta">
                  <span className="ep-row__num">Episode {episodes.length + 1}</span>
                </div>
                <h3 className="hindi-text">जल्द आएगा...</h3>
                <p className="hindi-text">अगला अंक तैयार हो रहा है</p>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
