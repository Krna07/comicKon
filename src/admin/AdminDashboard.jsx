import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, LogOut, Save, Upload, X,
  ImagePlus, FileText, CheckCircle, AlertCircle,
  Globe, Lock, ArrowLeft, RefreshCw, BarChart2, Loader2, Star, Sparkles,
  Clock, Inbox, Layers, Pencil, Users, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';
import {
  adminGetEpisodes, adminCreateEpisode, adminGetEpisode,
  adminUpdateEpisodeMeta, adminPublishEpisode, adminDeleteEpisode,
  adminAddPanel, adminUpdatePanel, adminDeletePanel,
  adminReorderPanels, adminUpdateNovelContent, fetchAnalytics, fetchRatings,
} from '../api/comicApi';

const inputCls =
  'w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all placeholder:text-gray-300';

const labelCls = 'text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block';

const cardCls =
  'bg-white/85 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm shadow-orange-100/50';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-200/80 transition-all py-3';

const overlayCls =
  'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4';

const modalCls =
  'bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden';

function Spinner({ light = false, size = 'w-4 h-4' }) {
  return (
    <span
      className={`${size} rounded-full border-2 animate-spin ${
        light ? 'border-white/30 border-t-white' : 'border-gray-300 border-t-orange-500'
      }`}
    />
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none max-w-[min(22rem,calc(100vw-2rem))]">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-auto border ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {t.type === 'success'
              ? <CheckCircle size={15} className="text-emerald-500 shrink-0" />
              : <AlertCircle size={15} className="text-red-500 shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return { toasts, success: m => add(m, 'success'), error: m => add(m, 'error') };
}

function StatCard({ icon: Icon, label, value, tone = 'orange' }) {
  return (
    <div className={`stat-tile stat-tile--${tone}`}>
      <span className="stat-tile__icon"><Icon size={15} /></span>
      <p className="stat-tile__value">{value ?? '—'}</p>
      <p className="stat-tile__label hindi-text">{label}</p>
    </div>
  );
}

function DropZone({ preview, emptyLabel, fileRef, onChange }) {
  return (
    <>
      <button type="button" onClick={() => fileRef.current?.click()} className="dash-drop">
        {preview ? (
          <div className="dash-drop__preview">
            <img src={preview} alt="" />
            <span className="dash-drop__change"><Upload size={14} /> Change</span>
          </div>
        ) : (
          <div className="dash-drop__empty">
            <ImagePlus size={24} />
            <p>{emptyLabel}</p>
          </div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </>
  );
}

function NovelEditor({ episode, onSaved, toastError }) {
  const fileRef = useRef();
  const [text, setText] = useState(episode.novelContent || '');
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(episode.coverImage || null);
  const [saving, setSaving] = useState(false);

  function handleCover(e) {
    const f = e.target.files[0];
    if (!f) return;
    setCover(f);
    setCoverPreview(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('novelContent', text);
      if (cover) fd.append('coverImage', cover);
      await adminUpdateNovelContent(episode._id, fd);
      onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="novel-ed">
      <div className="novel-ed__cover">
        <label>Cover image</label>
        <DropZone
          preview={coverPreview}
          emptyLabel="Upload cover"
          fileRef={fileRef}
          onChange={handleCover}
        />
      </div>

      <div className="novel-ed__write">
        <div className="novel-ed__bar">
          <label htmlFor="novel-story">
            <FileText size={12} /> Story text (Hindi)
          </label>
          <span>
            {text.length} chars · {text.split(/\n\n+/).filter(Boolean).length} paragraphs
          </span>
        </div>
        <textarea
          id="novel-story"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="यहाँ अपनी कहानी लिखें..."
          className="novel-ed__text hindi-text"
        />
        <div className="novel-ed__foot">
          <p>Blank lines start a new paragraph.</p>
          <motion.button
            type="button"
            onClick={save}
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            className="dash-btn"
          >
            {saving ? <><Spinner light /> Saving...</> : <><Save size={14} /> Save Novel</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function PanelCard({ panel, localPage, onLocalPageChange, onEdit, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="dash-panel"
    >
      <div className="dash-panel__page">
        <span>Page</span>
        <input
          type="number"
          min="1"
          value={localPage}
          onChange={e => onLocalPageChange(panel.panelNumber, e.target.value)}
          aria-label={`Page number for panel ${panel.panelNumber}`}
        />
      </div>
      <div className="dash-panel__thumb">
        {!imgErr
          ? <img src={panel.imageUrl} alt="" onError={() => setImgErr(true)} />
          : <ImagePlus size={16} />}
      </div>
      <div className="dash-panel__copy">
        <span className={`dash-chip dash-chip--${panel.size}`}>{panel.size}</span>
        <p className="hindi-text">
          {panel.captionHindi || <em>No caption</em>}
        </p>
      </div>
      <div className="dash-panel__actions">
        <button type="button" onClick={() => onEdit(panel)} aria-label="Edit panel">
          <Edit3 size={13} />
        </button>
        <button type="button" className="is-danger" onClick={() => onDelete(panel.panelNumber)} aria-label="Delete panel">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function PanelModal({ episodeId, panel, onClose, onSaved, toastError }) {
  const isEdit = !!panel;
  const fileRef = useRef();
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(panel?.imageUrl || null);
  const [caption, setCaption] = useState(panel?.captionHindi || '');
  const [size, setSize]       = useState(panel?.size || 'wide');
  const [page, setPage]       = useState(String(panel?.pageNumber || ''));
  const [saving, setSaving]   = useState(false);

  function pickFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!isEdit && !image) { toastError('Please select an image'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (image) fd.append('image', image);
      fd.append('captionHindi', caption);
      fd.append('size', size);
      if (page) fd.append('pageNumber', page);
      if (isEdit) {
        await adminUpdatePanel(episodeId, panel.panelNumber, fd);
      } else {
        await adminAddPanel(episodeId, fd);
      }
      onSaved();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save panel');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={overlayCls} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-modal-title"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="dash-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="dash-modal__head">
          <div className="dash-modal__head-copy">
            <div className="dash-modal__icon" aria-hidden="true">
              {isEdit ? <Edit3 size={16} /> : <ImagePlus size={16} />}
            </div>
            <div>
              <h3 id="panel-modal-title">{isEdit ? 'Edit Panel' : 'Add Panel'}</h3>
              <p>{isEdit ? 'Update image, size, or caption.' : 'Upload a page image and add a Hindi caption.'}</p>
            </div>
          </div>
          <button type="button" className="dash-modal__close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="dash-modal__body">
          <DropZone
            preview={preview}
            emptyLabel="Click to select image"
            fileRef={fileRef}
            onChange={pickFile}
          />

          <div className="dash-field">
            <label>Panel Size</label>
            <div className="dash-modal__picks dash-modal__picks--3" role="group" aria-label="Panel size">
              {[
                ['wide', 'Full width'],
                ['half', 'Half page'],
                ['third', 'One third'],
              ].map(([s, hint]) => (
                <button
                  type="button"
                  key={s}
                  className={`dash-pick${size === s ? ' is-on' : ''}`}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                >
                  <strong>{s}</strong>
                  <span>{hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="dash-field">
            <label htmlFor="panel-page">Page Number</label>
            <input
              id="panel-page"
              type="number"
              min="1"
              value={page}
              onChange={e => setPage(e.target.value)}
              placeholder="Auto"
              className={inputCls}
            />
          </div>

          <div className="dash-field">
            <label htmlFor="panel-caption">Caption (Hindi)</label>
            <textarea
              id="panel-caption"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              placeholder="कैप्शन यहाँ लिखें..."
              className={`${inputCls} resize-none hindi-text py-3`}
            />
          </div>

          <motion.button
            type="button"
            onClick={submit}
            disabled={saving || (!isEdit && !image)}
            whileTap={{ scale: 0.98 }}
            className="dash-btn dash-btn--block"
          >
            {saving
              ? <><Spinner light /> Saving...</>
              : <><Save size={14} /> {isEdit ? 'Update Panel' : 'Add Panel'}</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateEpisodeModal({ onClose, onCreated, toastError }) {
  const [title, setTitle]     = useState('');
  const [epNum, setEpNum]     = useState('');
  const [epTitle, setEpTitle] = useState('');
  const [desc, setDesc]       = useState('');
  const [type, setType]       = useState('comic');
  const [saving, setSaving]   = useState(false);

  async function submit() {
    if (!title.trim()) { toastError('Title is required'); return; }
    setSaving(true);
    try {
      await adminCreateEpisode({ title, episodeNumber: epNum, episodeTitle: epTitle, description: desc, type });
      onCreated();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create episode');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={overlayCls} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ep-title"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="dash-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="dash-modal__head">
          <div className="dash-modal__head-copy">
            <div className="dash-modal__icon" aria-hidden="true">
              <Plus size={16} />
            </div>
            <div>
              <h3 id="create-ep-title">New Episode</h3>
              <p>Pick a format, then fill in the story details.</p>
            </div>
          </div>
          <button type="button" className="dash-modal__close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="dash-modal__body">
          <div className="dash-modal__picks" role="group" aria-label="Episode type">
            <button
              type="button"
              className={`dash-pick${type === 'comic' ? ' is-on' : ''}`}
              onClick={() => setType('comic')}
              aria-pressed={type === 'comic'}
            >
              <span className="dash-pick__icon"><BookOpen size={14} /></span>
              <strong>Comic</strong>
              <span>Panels, captions &amp; speech bubbles</span>
            </button>
            <button
              type="button"
              className={`dash-pick${type === 'novel' ? ' is-on' : ''}`}
              onClick={() => setType('novel')}
              aria-pressed={type === 'novel'}
            >
              <span className="dash-pick__icon"><FileText size={14} /></span>
              <strong>Novel</strong>
              <span>Long-form Hindi story text</span>
            </button>
          </div>

          <div className="dash-field">
            <label htmlFor="create-ep-title-input">Title (Hindi) *</label>
            <input
              id="create-ep-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="धुआँ का जन्म"
              className={`${inputCls} hindi-text`}
              autoFocus
            />
          </div>

          <div className="dash-field-row">
            <div className="dash-field dash-field-num">
              <label htmlFor="create-ep-num">Episode #</label>
              <input
                id="create-ep-num"
                type="number"
                min="1"
                value={epNum}
                onChange={e => setEpNum(e.target.value)}
                placeholder="Auto"
                className={inputCls}
              />
            </div>
            <div className="dash-field dash-field-grow">
              <label htmlFor="create-ep-sub">Subtitle</label>
              <input
                id="create-ep-sub"
                value={epTitle}
                onChange={e => setEpTitle(e.target.value)}
                placeholder="Episode subtitle"
                className={`${inputCls} hindi-text`}
              />
            </div>
          </div>

          <div className="dash-field">
            <label htmlFor="create-ep-desc">Description</label>
            <textarea
              id="create-ep-desc"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="A short blurb for readers..."
              className={`${inputCls} resize-none hindi-text py-3`}
            />
          </div>

          <motion.button
            type="button"
            onClick={submit}
            disabled={saving || !title.trim()}
            whileTap={{ scale: 0.98 }}
            className="dash-btn dash-btn--block"
          >
            {saving ? <><Spinner light /> Creating...</> : <><Plus size={14} /> Create Episode</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [view, setView]               = useState('list');
  const [episodes, setEpisodes]       = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [analytics, setAnalytics]     = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [ratings, setRatings]         = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const [episode, setEpisode]     = useState(null);
  const [loadingEp, setLoadingEp] = useState(false);
  const [epTab, setEpTab]         = useState('panels');

  const [metaForm, setMetaForm]     = useState({});
  const [savingMeta, setSavingMeta] = useState(false);

  const [localPages, setLocalPages]     = useState({});
  const [savingOrder, setSavingOrder]   = useState(false);
  const [panelModal, setPanelModal]     = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  async function loadList() {
    setLoadingList(true);
    try {
      const r = await adminGetEpisodes();
      setEpisodes(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load episodes');
    } finally { setLoadingList(false); }
  }

  useEffect(() => { loadList(); }, []);

  async function loadAnalytics() {
    try { const r = await fetchAnalytics(); setAnalytics(r.data); }
    catch { setAnalytics(null); }
  }

  async function loadRatings() {
    setLoadingRatings(true);
    try { const r = await fetchRatings(); setRatings(r.data); }
    catch { toast.error('Failed to load ratings'); }
    finally { setLoadingRatings(false); }
  }

  async function openEpisode(id) {
    setLoadingEp(true);
    setView('episode');
    setEpTab('panels');
    try {
      const r = await adminGetEpisode(id);
      setEpisode(r.data);
      setMetaForm({
        title:         r.data.title,
        episodeNumber: r.data.episodeNumber,
        episodeTitle:  r.data.episodeTitle,
        description:   r.data.description,
      });
      const pages = {};
      r.data.panels.forEach(p => { pages[p.panelNumber] = p.pageNumber; });
      setLocalPages(pages);
    } catch (err) {
      toast.error('Failed to load episode');
      setView('list');
    } finally { setLoadingEp(false); }
  }

  async function refreshEpisode() {
    if (!episode) return;
    try {
      const r = await adminGetEpisode(episode._id);
      setEpisode(r.data);
      const pages = {};
      r.data.panels.forEach(p => { pages[p.panelNumber] = p.pageNumber; });
      setLocalPages(pages);
    } catch { toast.error('Refresh failed'); }
  }

  async function saveMeta() {
    setSavingMeta(true);
    try {
      await adminUpdateEpisodeMeta(episode._id, metaForm);
      await refreshEpisode();
      await loadList();
      toast.success('Meta saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSavingMeta(false); }
  }

  async function togglePublish(ep) {
    try {
      await adminPublishEpisode(ep._id, !ep.published);
      toast.success(ep.published ? 'Unpublished' : 'Published ✓');
      loadList();
      if (episode?._id === ep._id) refreshEpisode();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }

  async function doDelete() {
    if (!confirmDel) return;
    try {
      if (confirmDel.type === 'episode') {
        await adminDeleteEpisode(confirmDel.id);
        toast.success('Episode deleted');
        setView('list');
        loadList();
      } else {
        await adminDeletePanel(episode._id, confirmDel.id);
        toast.success('Panel deleted');
        refreshEpisode();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setConfirmDel(null); }
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      const pages = Object.entries(localPages).map(([panelNumber, pageNumber]) => ({
        panelNumber: Number(panelNumber),
        pageNumber:  Number(pageNumber),
      }));
      await adminReorderPanels(episode._id, pages);
      toast.success('Order saved');
      refreshEpisode();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reorder failed');
    } finally { setSavingOrder(false); }
  }

  function handleLocalPage(panelNumber, val) {
    setLocalPages(p => ({ ...p, [panelNumber]: val }));
  }

  function logout() {
    localStorage.removeItem('dhuaa_admin_token');
    navigate('/admin');
  }

  const sortedPanels = episode
    ? [...episode.panels].sort((a, b) => a.pageNumber - b.pageNumber || a.panelNumber - b.panelNumber)
    : [];

  const ratingsAvg = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  const subtitle =
    view === 'list' ? 'Episode Manager'
      : view === 'ratings' ? 'Reader Ratings'
      : (episode?.title || 'Loading...');

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 text-gray-800 w-full">
      <div className="pointer-events-none absolute -top-24 -right-20 w-full h-96 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-yellow-100/60 blur-2xl" />

      <Toast toasts={toast.toasts} />

      <header className="dash-header">
        <div className="dash-header__inner">
          <div className="dash-header__brand">
            {view !== 'list' && (
              <button
                type="button"
                className="dash-header__back"
                onClick={() => setView('list')}
                aria-label="Back to episodes"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="dash-header__mark" aria-hidden="true">
              <span className="dash-header__mark-glow" />
              <BookOpen size={18} />
            </div>
            <div className="dash-header__copy">
              <div className="dash-header__kicker">
                <span><Sparkles size={10} /> Writer's portal</span>
              </div>
              <h1 className="dash-header__title hindi-text">धुआँ Admin</h1>
              <p className="dash-header__sub">{subtitle}</p>
            </div>
          </div>

          <nav className="dash-header__actions" aria-label="Admin actions">
            <button
              type="button"
              className="dash-header__btn"
              onClick={() => { setShowAnalytics(true); loadAnalytics(); }}
              aria-label="Stats"
            >
              <BarChart2 size={14} />
              <span>Stats</span>
            </button>
            <button
              type="button"
              className={`dash-header__btn${view === 'ratings' ? ' is-active' : ''}`}
              onClick={() => { setView('ratings'); loadRatings(); }}
              aria-label="Ratings"
              aria-current={view === 'ratings' ? 'page' : undefined}
            >
              <Star size={14} />
              <span>Ratings</span>
            </button>
            <span className="dash-header__divider" aria-hidden="true" />
            <button
              type="button"
              className="dash-header__logout"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="dash-main">

        {view === 'list' && (
          <section className="dash-section">
            <div className="dash-toolbar">
              <div>
                <h2>Episodes</h2>
                <p>{loadingList ? 'Loading…' : `${episodes.length} ${episodes.length === 1 ? 'episode' : 'episodes'}`}</p>
              </div>
              <button type="button" className="dash-btn" onClick={() => setShowCreate(true)}>
                <Plus size={15} strokeWidth={2.5} />
                New Episode
              </button>
            </div>

            {loadingList ? (
              <div className="dash-stack">
                {[1, 2, 3].map(i => <div key={i} className="dash-skel dash-skel--ep" />)}
              </div>
            ) : episodes.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty__icon"><Inbox size={22} /></span>
                <p>No episodes yet</p>
                <span>Create your first episode to get started.</span>
                <button type="button" onClick={() => setShowCreate(true)} className={btnPrimary}>
                  <Plus size={14} /> New Episode
                </button>
              </div>
            ) : (
              <div className="dash-stack">
                {episodes.map(ep => (
                  <motion.article key={ep._id} layout className="ep-card">
                    <div className={`ep-card__mark${ep.type === 'novel' ? ' is-novel' : ''}`}>
                      {ep.type === 'novel' ? <FileText size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div className="ep-card__body">
                      <div className="ep-card__meta">
                        <span className="ep-card__num">Ep {ep.episodeNumber}</span>
                        <span className={ep.published ? 'dash-badge dash-badge--live' : 'dash-badge dash-badge--draft'}>
                          {ep.published ? 'Live' : 'Draft'}
                        </span>
                        <span className="ep-card__type">{ep.type === 'novel' ? 'Novel' : 'Comic'}</span>
                      </div>
                      <h3 className="hindi-text">{ep.title}</h3>
                      <p>{ep.totalPages} pages{ep.episodeTitle ? ` · ${ep.episodeTitle}` : ''}</p>
                    </div>
                    <div className="ep-card__actions">
                      <button type="button" className="ep-card__edit" onClick={() => openEpisode(ep._id)}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className={`ep-card__icon${ep.published ? '' : ' is-publish'}`}
                        onClick={() => togglePublish(ep)}
                        aria-label={ep.published ? 'Unpublish' : 'Publish'}
                      >
                        {ep.published ? <Lock size={13} /> : <Globe size={13} />}
                      </button>
                      <button
                        type="button"
                        className="ep-card__icon is-danger"
                        onClick={() => setConfirmDel({ type: 'episode', id: ep._id, label: ep.title })}
                        aria-label="Delete episode"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'episode' && (
          <section className="dash-section">
            {loadingEp ? (
              <div className="dash-empty">
                <Loader2 size={28} className="dash-spin" />
                <p>Loading episode...</p>
              </div>
            ) : episode && (
              <>
                <article className="ep-card ep-card--hero">
                  <div className={`ep-card__mark${episode.type === 'novel' ? ' is-novel' : ''}`}>
                    {episode.type === 'novel' ? <FileText size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div className="ep-card__body">
                    <div className="ep-card__meta">
                      <span className="ep-card__num">Episode {episode.episodeNumber}</span>
                      <span className={episode.published ? 'dash-badge dash-badge--live' : 'dash-badge dash-badge--draft'}>
                        {episode.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="hindi-text">{episode.title}</h3>
                    <p>{episode.totalPages} pages · {episode.panels?.length || 0} panels</p>
                  </div>
                  <div className="ep-card__actions">
                    <button
                      type="button"
                      className={`ep-card__status${episode.published ? ' is-live' : ''}`}
                      onClick={() => togglePublish(episode)}
                    >
                      {episode.published ? <><Globe size={13} /> Live</> : <><Lock size={13} /> Draft</>}
                    </button>
                    <button
                      type="button"
                      className="ep-card__icon is-danger"
                      onClick={() => setConfirmDel({ type: 'episode', id: episode._id, label: episode.title })}
                      aria-label="Delete episode"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>

                <nav className="dash-tabs" aria-label="Episode sections">
                  {(episode.type === 'novel'
                    ? [['panels', 'Panels', Layers], ['novel', 'Novel', FileText], ['meta', 'Meta', Pencil]]
                    : [['panels', 'Panels', Layers], ['meta', 'Meta', Pencil]]
                  ).map(([id, label, Icon]) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setEpTab(id)}
                      className={`dash-tabs__btn${epTab === id ? ' is-on' : ''}`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </nav>

                {epTab === 'panels' && (
                  <div className="dash-stack">
                    <div className="dash-toolbar dash-toolbar--sub">
                      <div>
                        <h2>Panels</h2>
                        <p>{sortedPanels.length} {sortedPanels.length === 1 ? 'panel' : 'panels'}</p>
                      </div>
                      <div className="dash-toolbar__btns">
                        <button
                          type="button"
                          onClick={saveOrder}
                          disabled={savingOrder}
                          className="dash-ghost"
                        >
                          {savingOrder ? <Spinner size="w-3.5 h-3.5" /> : <RefreshCw size={12} />}
                          Save Order
                        </button>
                        <button
                          type="button"
                          onClick={() => setPanelModal('add')}
                          className={`${btnPrimary} dash-toolbar__primary`}
                        >
                          <Plus size={12} /> Add Panel
                        </button>
                      </div>
                    </div>

                    {sortedPanels.length === 0 ? (
                      <div className="dash-empty">
                        <span className="dash-empty__icon"><ImagePlus size={22} /></span>
                        <p>No panels yet</p>
                        <span>Add your first panel image.</span>
                        <button type="button" onClick={() => setPanelModal('add')} className={btnPrimary}>
                          <Plus size={13} /> Add Panel
                        </button>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {sortedPanels.map(panel => (
                          <PanelCard
                            key={panel.panelNumber}
                            panel={panel}
                            localPage={localPages[panel.panelNumber] ?? panel.pageNumber}
                            onLocalPageChange={handleLocalPage}
                            onEdit={p => setPanelModal(p)}
                            onDelete={pNum => setConfirmDel({ type: 'panel', id: pNum, label: `Panel #${pNum}` })}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                )}

                {epTab === 'novel' && (
                  <NovelEditor
                    episode={episode}
                    onSaved={() => { toast.success('Novel saved'); refreshEpisode(); }}
                    toastError={toast.error}
                  />
                )}

                {epTab === 'meta' && (
                  <div className="dash-form">
                    <h3>Episode Details</h3>
                    <div className="dash-form__row">
                      <div className="dash-form__grow">
                        <label className={labelCls}>Title *</label>
                        <input
                          value={metaForm.title || ''}
                          onChange={e => setMetaForm(f => ({ ...f, title: e.target.value }))}
                          className={`${inputCls} hindi-text`}
                        />
                      </div>
                      <div className="dash-form__num">
                        <label className={labelCls}>Ep #</label>
                        <input
                          type="number"
                          value={metaForm.episodeNumber || ''}
                          onChange={e => setMetaForm(f => ({ ...f, episodeNumber: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Episode Subtitle</label>
                      <input
                        value={metaForm.episodeTitle || ''}
                        onChange={e => setMetaForm(f => ({ ...f, episodeTitle: e.target.value }))}
                        className={`${inputCls} hindi-text`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <textarea
                        value={metaForm.description || ''}
                        onChange={e => setMetaForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        className={`${inputCls} resize-none hindi-text py-3`}
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={saveMeta}
                      disabled={savingMeta}
                      whileTap={{ scale: 0.98 }}
                      className={`${btnPrimary} dash-form__save`}
                    >
                      {savingMeta
                        ? <><Spinner light /> Saving...</>
                        : <><Save size={14} /> Save Changes</>}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {view === 'ratings' && (
          <section className="dash-section">
            <div className="dash-toolbar">
              <div>
                <h2>Reader Ratings</h2>
                <p>{ratings.length} rating{ratings.length !== 1 ? 's' : ''} received</p>
              </div>
              <button
                type="button"
                onClick={loadRatings}
                disabled={loadingRatings}
                className="dash-ghost"
              >
                <RefreshCw size={12} className={loadingRatings ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {ratings.length > 0 && ratingsAvg && (
              <div className="rate-avg">
                <div className="rate-avg__mark"><Star size={20} fill="currentColor" /></div>
                <div className="rate-avg__copy">
                  <p className="rate-avg__score">
                    {ratingsAvg}<span> / 10</span>
                  </p>
                  <p>Average from {ratings.length} reader{ratings.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="rate-avg__stars" aria-hidden="true">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(Number(ratingsAvg)) ? 'is-on' : ''}
                      fill={i < Math.round(Number(ratingsAvg)) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
            )}

            {loadingRatings ? (
              <div className="dash-stack">
                {[1, 2, 3].map(i => <div key={i} className="dash-skel dash-skel--row" />)}
              </div>
            ) : ratings.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty__icon"><Star size={22} /></span>
                <p>No ratings yet</p>
                <span>Readers will rate episodes after finishing them.</span>
              </div>
            ) : (
              <div className="dash-stack">
                {ratings.map((r, i) => (
                  <motion.article
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rate-card"
                  >
                    <div className={`rate-card__score${r.rating >= 8 ? ' is-high' : r.rating >= 5 ? ' is-mid' : ' is-low'}`}>
                      {r.rating}
                      <span>/10</span>
                    </div>
                    <div className="rate-card__body">
                      <h3 className="hindi-text">{r.name || 'Anonymous'}</h3>
                      <div className="rate-card__meta">
                        {r.completed && <span className="dash-badge dash-badge--live">Completed</span>}
                        <span><Clock size={11} /> {r.readTime}</span>
                        {r.ratedAt && (
                          <span>
                            {new Date(r.ratedAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rate-card__stars" aria-label={`Rated ${r.rating} out of 10`}>
                      {[...Array(10)].map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          className={j < r.rating ? 'is-on' : ''}
                          fill={j < r.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreateEpisodeModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); toast.success('Episode created'); loadList(); }}
            toastError={toast.error}
          />
        )}

        {panelModal && episode && (
          <PanelModal
            episodeId={episode._id}
            panel={panelModal === 'add' ? null : panelModal}
            onClose={() => setPanelModal(null)}
            onSaved={() => { setPanelModal(null); toast.success('Panel saved'); refreshEpisode(); }}
            toastError={toast.error}
          />
        )}

        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={overlayCls}
            onClick={() => setConfirmDel(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="dash-modal dash-modal--danger"
              onClick={e => e.stopPropagation()}
            >
              <div className="dash-modal__head">
                <div className="dash-modal__head-copy">
                  <div className="dash-modal__icon" aria-hidden="true">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <h3 id="delete-title">
                      Delete {confirmDel.type === 'episode' ? 'episode' : 'panel'}?
                    </h3>
                    <p>This cannot be undone.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal__close"
                  onClick={() => setConfirmDel(null)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="dash-modal__body">
                <div className="dash-confirm">
                  <p>
                    You are about to permanently remove
                    {confirmDel.type === 'episode' ? ' this episode and all of its panels' : ' this panel'}.
                  </p>
                  <p className="dash-confirm__name hindi-text">“{confirmDel.label}”</p>
                  <p className="dash-confirm__warn">This action cannot be undone.</p>
                  <div className="dash-confirm__actions">
                    <button type="button" className="dash-ghost" onClick={() => setConfirmDel(null)}>
                      Cancel
                    </button>
                    <button type="button" className="dash-btn dash-btn--danger" onClick={doDelete}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={overlayCls}
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="stats-title"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="dash-modal dash-modal--stats"
              onClick={e => e.stopPropagation()}
            >
              <div className="dash-modal__head">
                <div className="dash-modal__head-copy">
                  <div className="dash-modal__icon" aria-hidden="true">
                    <BarChart2 size={16} />
                  </div>
                  <div>
                    <h3 id="stats-title">Reader Stats</h3>
                    <p>How people are reading धुआँ</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-modal__close"
                  onClick={() => setShowAnalytics(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="dash-modal__body">
                {analytics ? (
                  <>
                    {analytics.avgRating != null && (
                      <div className="rate-avg rate-avg--compact">
                        <div className="rate-avg__mark"><Star size={18} fill="currentColor" /></div>
                        <div className="rate-avg__copy">
                          <p className="rate-avg__score">
                            {analytics.avgRating}<span> / 10</span>
                          </p>
                          <p>{analytics.totalRatings} rating{analytics.totalRatings !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    )}
                    <div className="stat-grid">
                      {[
                        { label: 'कुल पाठक', value: analytics.totalReaders, icon: Users, tone: 'blue' },
                        { label: 'पूर्ण पाठक', value: analytics.completedReaders, icon: CheckCircle, tone: 'green' },
                        { label: 'समापन दर', value: `${analytics.completionRate}%`, icon: TrendingUp, tone: 'purple' },
                        { label: 'औसत समय', value: analytics.avgTimeFormatted, icon: Clock, tone: 'amber' },
                        { label: 'आज के पाठक', value: analytics.recentReaders, icon: Sparkles, tone: 'red' },
                        { label: 'सर्वाधिक पृष्ठ', value: `पृष्ठ ${analytics.mostReadPage}`, icon: BookOpen, tone: 'gray' },
                      ].map(s => (
                        <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="dash-empty" style={{ border: 0, background: 'transparent', padding: '2.5rem 1rem' }}>
                    <Loader2 size={22} className="dash-spin" />
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
