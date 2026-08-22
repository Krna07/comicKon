import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, LogOut, Save, Upload, X,
  ImagePlus, FileText, CheckCircle, AlertCircle, ArrowUpRight,
  Globe, Lock, ArrowLeft, RefreshCw, BarChart2, Loader2, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminGetEpisodes, adminCreateEpisode, adminGetEpisode,
  adminUpdateEpisodeMeta, adminPublishEpisode, adminDeleteEpisode,
  adminAddPanel, adminUpdatePanel, adminDeletePanel,
  adminReorderPanels, adminUpdateNovelContent, fetchAnalytics, fetchRatings,
} from '../api/comicApi';

// ── Toast ──────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-auto border
              ${t.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'}`}>
            {t.type === 'success'
              ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
              : <AlertCircle size={15} className="text-red-500 flex-shrink-0" />}
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

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2 bg-white">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${color}`}>{icon}</div>
        <ArrowUpRight size={13} className="text-gray-200" />
      </div>
      <div>
        <p className="text-xl font-black text-gray-800">{value}</p>
        <p className="text-gray-400 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Novel Editor ───────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <div>
        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Cover Image</label>
        <div onClick={() => fileRef.current.click()}
          className="relative border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden border-gray-200 hover:border-orange-300 transition-all">
          {coverPreview
            ? <div className="relative">
                <img src={coverPreview} alt="" className="w-full max-h-48 object-contain bg-gray-50" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center">
                  <span className="text-white text-sm font-medium flex items-center gap-2"><Upload size={14}/> Change</span>
                </div>
              </div>
            : <div className="flex flex-col items-center py-8">
                <ImagePlus size={22} className="text-gray-400 mb-2"/>
                <p className="text-sm text-gray-500">Click to upload cover image</p>
              </div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCover}/>
      </div>
      <div>
        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <FileText size={11}/> Story Text (Hindi)
          <span className="text-gray-400 normal-case font-normal ml-1">— blank lines = new paragraph</span>
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={14}
          placeholder="यहाँ अपनी कहानी लिखें..."
          className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all resize-y hindi-text leading-relaxed"
        />
        <p className="text-gray-400 text-xs mt-1">{text.length} chars · {text.split(/\n\n+/).filter(Boolean).length} paragraphs</p>
      </div>
      <motion.button onClick={save} disabled={saving} whileTap={{ scale: 0.98 }}
        className="self-end flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 transition-all">
        {saving
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
          : <><Save size={14}/> Save Novel</>}
      </motion.button>
    </div>
  );
}

// ── Panel Card ─────────────────────────────────────────────────
function PanelCard({ panel, localPage, onLocalPageChange, onEdit, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex group hover:border-orange-200 transition-all">
      <div className="flex flex-col items-center justify-center bg-gray-50 border-r border-gray-100 px-2.5 py-3 gap-1 min-w-[52px]">
        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Page</span>
        <input type="number" min="1" value={localPage}
          onChange={e => onLocalPageChange(panel.panelNumber, e.target.value)}
          className="w-11 text-center text-sm font-black text-orange-600 bg-white border border-orange-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"/>
      </div>
      <div className="w-16 h-16 flex-shrink-0 bg-gray-50 overflow-hidden self-center ml-1 rounded-lg">
        {!imgErr
          ? <img src={panel.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" onError={() => setImgErr(true)}/>
          : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={16} className="text-gray-300"/></div>}
      </div>
      <div className="flex-1 px-3 py-3 min-w-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${panel.size === 'wide' ? 'bg-blue-50 text-blue-500' : panel.size === 'half' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'}`}>
          {panel.size}
        </span>
        <p className="hindi-text text-gray-600 text-xs leading-relaxed line-clamp-2 mt-1">
          {panel.captionHindi || <span className="italic text-gray-300">No caption</span>}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-1.5 pr-3 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(panel)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-xl"><Edit3 size={12}/></button>
        <button onClick={() => onDelete(panel.panelNumber)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 rounded-xl"><Trash2 size={12}/></button>
      </div>
    </motion.div>
  );
}

// ── Panel Modal (add / edit) ────────────────────────────────────
function PanelModal({ episodeId, panel, onClose, onSaved, toastError }) {
  const isEdit = !!panel;
  const fileRef = useRef();
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(panel?.imageUrl || null);
  const [caption, setCaption]   = useState(panel?.captionHindi || '');
  const [size, setSize]         = useState(panel?.size || 'wide');
  const [page, setPage]         = useState(String(panel?.pageNumber || ''));
  const [saving, setSaving]     = useState(false);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{isEdit ? 'Edit Panel' : 'Add Panel'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15}/></button>
        </div>
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Image */}
          <div onClick={() => fileRef.current.click()}
            className="border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden border-gray-200 hover:border-orange-300 transition-all">
            {preview
              ? <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-48 object-contain bg-gray-50" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center">
                    <span className="text-white text-sm font-medium flex items-center gap-2"><Upload size={14}/> Change</span>
                  </div>
                </div>
              : <div className="flex flex-col items-center py-10">
                  <ImagePlus size={24} className="text-gray-400 mb-2"/>
                  <p className="text-sm text-gray-500">Click to select image</p>
                </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile}/>

          {/* Size */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Panel Size</label>
            <div className="flex gap-2">
              {['wide', 'half', 'third'].map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all
                    ${size === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Page number */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Page Number</label>
            <input type="number" min="1" value={page} onChange={e => setPage(e.target.value)} placeholder="Auto"
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all"/>
          </div>

          {/* Caption */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Caption (Hindi)</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3}
              placeholder="कैप्शन यहाँ लिखें..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all resize-none hindi-text"/>
          </div>

          <motion.button onClick={submit} disabled={saving} whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 transition-all">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
              : <><Save size={14}/> {isEdit ? 'Update Panel' : 'Add Panel'}</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Create Episode Modal ────────────────────────────────────────
function CreateEpisodeModal({ onClose, onCreated, toastError }) {
  const [title, setTitle]       = useState('');
  const [epNum, setEpNum]       = useState('');
  const [epTitle, setEpTitle]   = useState('');
  const [desc, setDesc]         = useState('');
  const [type, setType]         = useState('comic');
  const [saving, setSaving]     = useState(false);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">New Episode</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={15}/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Type */}
          <div className="flex gap-2">
            {['comic', 'novel'].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                  ${type === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                {t === 'comic' ? '🎨 Comic' : '📖 Novel'}
              </button>
            ))}
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (Hindi) *"
            className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all hindi-text"/>

          <div className="flex gap-3">
            <input type="number" value={epNum} onChange={e => setEpNum(e.target.value)} placeholder="Ep # (auto)"
              className="w-28 bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all"/>
            <input value={epTitle} onChange={e => setEpTitle(e.target.value)} placeholder="Episode subtitle"
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all hindi-text"/>
          </div>

          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Description..."
            className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all resize-none hindi-text"/>

          <motion.button onClick={submit} disabled={saving} whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 transition-all">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Creating...</>
              : <><Plus size={14}/> Create Episode</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main AdminDashboard ────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast    = useToast();

  // ── State ──────────────────────────────────────────────────
  const [view, setView]             = useState('list');       // 'list' | 'episode' | 'ratings'
  const [episodes, setEpisodes]     = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [analytics, setAnalytics]   = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [ratings, setRatings]       = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // episode detail
  const [episode, setEpisode]       = useState(null);
  const [loadingEp, setLoadingEp]   = useState(false);
  const [epTab, setEpTab]           = useState('panels');     // 'panels' | 'meta' | 'novel'

  // meta edit form
  const [metaForm, setMetaForm]     = useState({});
  const [savingMeta, setSavingMeta] = useState(false);

  // panels
  const [localPages, setLocalPages] = useState({});
  const [savingOrder, setSavingOrder] = useState(false);
  const [panelModal, setPanelModal] = useState(null);         // null | 'add' | panel-obj

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);         // { type:'episode'|'panel', id, label }

  // ── Load list ──────────────────────────────────────────────
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

  // ── Load analytics ─────────────────────────────────────────
  async function loadAnalytics() {
    try { const r = await fetchAnalytics(); setAnalytics(r.data); }
    catch { setAnalytics(null); }
  }

  // ── Load ratings ───────────────────────────────────────────
  async function loadRatings() {
    setLoadingRatings(true);
    try { const r = await fetchRatings(); setRatings(r.data); }
    catch { toast.error('Failed to load ratings'); }
    finally { setLoadingRatings(false); }
  }

  // ── Open episode ───────────────────────────────────────────
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

  // ── Meta save ──────────────────────────────────────────────
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

  // ── Publish toggle ─────────────────────────────────────────
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

  // ── Delete ─────────────────────────────────────────────────
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

  // ── Reorder panels ─────────────────────────────────────────
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

  // ── Logout ─────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('dhuaa_admin_token');
    navigate('/admin');
  }

  // ── Sorted panels ──────────────────────────────────────────
  const sortedPanels = episode
    ? [...episode.panels].sort((a, b) => a.pageNumber - b.pageNumber || a.panelNumber - b.panelNumber)
    : [];

  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toast toasts={toast.toasts} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <button onClick={() => setView('list')}
                className="mr-1 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <ArrowLeft size={15}/>
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <BookOpen className="text-orange-500 w-4 h-4"/>
            </div>
            <div>
              <h1 className="font-black text-gray-800 text-sm leading-none">धुआँ Admin</h1>
              <p className="text-gray-400 text-[10px] mt-0.5">
                {view === 'list' ? 'Episode Manager' : view === 'ratings' ? 'Reader Ratings' : (episode?.title || 'Loading...')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowAnalytics(true); loadAnalytics(); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors">
              <BarChart2 size={13}/> Stats
            </button>
            <button onClick={() => { setView('ratings'); loadRatings(); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium transition-colors border border-amber-100">
              <Star size={13}/> Ratings
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 font-medium transition-colors">
              <LogOut size={13}/> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ════ LIST VIEW ════ */}
        {view === 'list' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-700 text-sm uppercase tracking-widest">Episodes</h2>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-orange-100 transition-colors">
                <Plus size={13}/> New Episode
              </button>
            </div>

            {loadingList ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
              </div>
            ) : episodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="text-5xl">📭</div>
                <div>
                  <p className="font-bold text-gray-700">No episodes yet</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first episode to get started.</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
                  <Plus size={14}/> New Episode
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {episodes.map(ep => (
                  <motion.div key={ep._id} layout
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                        {ep.type === 'novel' ? '📖' : '🎨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                            Ep {ep.episodeNumber}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${ep.published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {ep.published ? '● Live' : '○ Draft'}
                          </span>
                        </div>
                        <p className="hindi-text font-bold text-gray-800 text-sm truncate">{ep.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{ep.totalPages} pages</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button onClick={() => openEpisode(ep._id)}
                          className="text-xs px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-semibold transition-colors">
                          Edit
                        </button>
                        <div className="flex gap-1.5">
                          <button onClick={() => togglePublish(ep)}
                            className={`p-1.5 rounded-lg transition-colors
                              ${ep.published ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'}`}>
                            {ep.published ? <Lock size={12}/> : <Globe size={12}/>}
                          </button>
                          <button onClick={() => setConfirmDel({ type: 'episode', id: ep._id, label: ep.title })}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-colors">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ EPISODE DETAIL VIEW ════ */}
        {view === 'episode' && (
          <div className="flex flex-col gap-5">
            {loadingEp ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={28} className="text-orange-400 animate-spin"/>
                <p className="text-gray-400 text-sm">Loading episode...</p>
              </div>
            ) : episode && (
              <>
                {/* Episode header strip */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">Episode {episode.episodeNumber}</span>
                    <p className="hindi-text font-black text-gray-800 text-base truncate">{episode.title}</p>
                    <p className="text-gray-400 text-xs">{episode.totalPages} pages · {episode.panels?.length || 0} panels</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => togglePublish(episode)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold border transition-all
                        ${episode.published
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                      {episode.published ? <><Globe size={12}/> Live</> : <><Lock size={12}/> Draft</>}
                    </button>
                    <button onClick={() => setConfirmDel({ type: 'episode', id: episode._id, label: episode.title })}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
                  {(episode.type === 'novel'
                    ? [['panels', '🎨 Panels'], ['novel', '📖 Novel'], ['meta', '✏️ Meta']]
                    : [['panels', '🎨 Panels'], ['meta', '✏️ Meta']]
                  ).map(([id, label]) => (
                    <button key={id} onClick={() => setEpTab(id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                        ${epTab === id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Panels tab ── */}
                {epTab === 'panels' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                        {sortedPanels.length} Panels
                      </p>
                      <div className="flex gap-2">
                        <button onClick={saveOrder} disabled={savingOrder}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold disabled:opacity-40 transition-colors">
                          {savingOrder ? <div className="w-3.5 h-3.5 border border-gray-400 border-t-gray-700 rounded-full animate-spin"/> : <RefreshCw size={12}/>}
                          Save Order
                        </button>
                        <button onClick={() => setPanelModal('add')}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-lg shadow-orange-100">
                          <Plus size={12}/> Add Panel
                        </button>
                      </div>
                    </div>

                    {sortedPanels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl">🖼️</div>
                        <div>
                          <p className="font-bold text-gray-600">No panels yet</p>
                          <p className="text-gray-400 text-sm mt-1">Add your first panel image.</p>
                        </div>
                        <button onClick={() => setPanelModal('add')}
                          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                          <Plus size={13}/> Add Panel
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

                {/* ── Novel tab ── */}
                {epTab === 'novel' && (
                  <NovelEditor
                    episode={episode}
                    onSaved={() => { toast.success('Novel saved'); refreshEpisode(); }}
                    toastError={toast.error}
                  />
                )}

                {/* ── Meta tab ── */}
                {epTab === 'meta' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-gray-700 text-sm">Episode Details</h3>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1 block">Title *</label>
                        <input value={metaForm.title || ''} onChange={e => setMetaForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all hindi-text"/>
                      </div>
                      <div className="w-24">
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1 block">Ep #</label>
                        <input type="number" value={metaForm.episodeNumber || ''} onChange={e => setMetaForm(f => ({ ...f, episodeNumber: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1 block">Episode Subtitle</label>
                      <input value={metaForm.episodeTitle || ''} onChange={e => setMetaForm(f => ({ ...f, episodeTitle: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all hindi-text"/>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1 block">Description</label>
                      <textarea value={metaForm.description || ''} onChange={e => setMetaForm(f => ({ ...f, description: e.target.value }))} rows={4}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all resize-none hindi-text"/>
                    </div>
                    <motion.button onClick={saveMeta} disabled={savingMeta} whileTap={{ scale: 0.98 }}
                      className="self-end flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 transition-all">
                      {savingMeta
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                        : <><Save size={14}/> Save Changes</>}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* ════ RATINGS VIEW ════ */}
        {view === 'ratings' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-gray-700 text-sm uppercase tracking-widest">Reader Ratings</h2>
                <p className="text-gray-400 text-xs mt-0.5">{ratings.length} rating{ratings.length !== 1 ? 's' : ''} received</p>
              </div>
              <button onClick={loadRatings} disabled={loadingRatings}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors disabled:opacity-40">
                <RefreshCw size={12} className={loadingRatings ? 'animate-spin' : ''}/> Refresh
              </button>
            </div>

            {/* Average banner */}
            {ratings.length > 0 && (() => {
              const avg = (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1);
              return (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-2xl flex-shrink-0">⭐</div>
                  <div>
                    <p className="font-black text-gray-800 text-2xl leading-none">{avg}<span className="text-gray-400 text-base font-normal">/10</span></p>
                    <p className="text-gray-500 text-xs mt-0.5">Average from {ratings.length} reader{ratings.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="ml-auto flex gap-1 flex-wrap justify-end">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-2 h-6 rounded-full transition-all ${i < Math.round(avg) ? 'bg-amber-400' : 'bg-gray-200'}`}/>
                    ))}
                  </div>
                </div>
              );
            })()}

            {loadingRatings ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
              </div>
            ) : ratings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl">⭐</div>
                <div>
                  <p className="font-bold text-gray-600">No ratings yet</p>
                  <p className="text-gray-400 text-sm mt-1">Readers will rate episodes after finishing them.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ratings.map((r, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                    {/* Rating badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-lg border
                      ${r.rating >= 8 ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : r.rating >= 5 ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {r.rating}
                      <span className="text-[9px] font-semibold text-current opacity-60">/10</span>
                    </div>
                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate hindi-text">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {r.completed && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">✓ Completed</span>
                        )}
                        <span className="text-gray-400 text-[10px]">⏱ {r.readTime}</span>
                        {r.ratedAt && (
                          <span className="text-gray-400 text-[10px]">
                            {new Date(r.ratedAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Star bar */}
                    <div className="flex-shrink-0 flex gap-0.5">
                      {[...Array(10)].map((_, j) => (
                        <div key={j} className={`w-1.5 h-4 rounded-full ${j < r.rating ? 'bg-amber-400' : 'bg-gray-100'}`}/>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setConfirmDel(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4"
              onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                <Trash2 size={20} className="text-red-400"/>
              </div>
              <div className="text-center">
                <h3 className="font-black text-gray-800">Delete {confirmDel.type}?</h3>
                <p className="text-gray-500 text-sm mt-1 hindi-text">"{confirmDel.label}"</p>
                <p className="text-red-400 text-xs mt-2">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={doDelete}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAnalytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
            onClick={() => setShowAnalytics(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <BarChart2 size={15} className="text-orange-500"/>
                  </div>
                  <h3 className="font-bold text-gray-800">Reader Stats</h3>
                </div>
                <button onClick={() => setShowAnalytics(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
                  <X size={15}/>
                </button>
              </div>
              <div className="p-5">
                {analytics ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'कुल पाठक',    value: analytics.totalReaders,           icon: '👥', color: 'bg-blue-50 text-blue-500' },
                      { label: 'पूर्ण पाठक',  value: analytics.completedReaders,       icon: '✅', color: 'bg-emerald-50 text-emerald-500' },
                      { label: 'समापन दर',    value: `${analytics.completionRate}%`,   icon: '📊', color: 'bg-purple-50 text-purple-500' },
                      { label: 'औसत समय',    value: analytics.avgTimeFormatted,        icon: '⏱️', color: 'bg-amber-50 text-amber-500' },
                      { label: 'आज के पाठक', value: analytics.recentReaders,          icon: '🔥', color: 'bg-red-50 text-red-500' },
                      { label: 'सर्वाधिक पृष्ठ', value: `पृ॰ ${analytics.mostReadPage}`, icon: '📖', color: 'bg-gray-50 text-gray-500' },
                    ].map(s => (
                      <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color}/>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 size={22} className="text-orange-400 animate-spin"/>
                    <p className="text-gray-400 text-sm">Loading stats...</p>
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
