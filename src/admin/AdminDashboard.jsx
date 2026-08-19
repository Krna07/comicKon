import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, LogOut, Save,
  Upload, X, Eye, RefreshCw, ImagePlus, FileText,
  LayoutGrid, CheckCircle, AlertCircle, TrendingUp,
  ArrowUpRight, Star, SortAsc, Globe, Lock, ChevronRight, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminGetEpisodes, adminCreateEpisode, adminGetEpisode,
  adminUpdateEpisodeMeta, adminPublishEpisode, adminDeleteEpisode,
  adminAddPanel, adminUpdatePanel, adminDeletePanel,
  adminReorderPanels, fetchAnalytics,
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
              ${t.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {t.type === 'success' ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" /> : <AlertCircle size={15} className="text-red-500 flex-shrink-0" />}
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
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, success: m => add(m, 'success'), error: m => add(m, 'error') };
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2 bg-white`}>
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

// ── Panel Card ─────────────────────────────────────────────────
function PanelCard({ panel, index, localPage, onLocalPageChange, onEdit, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex group hover:border-orange-200 transition-all">
      {/* Order input */}
      <div className="flex flex-col items-center justify-center bg-gray-50 border-r border-gray-100 px-2.5 py-3 gap-1 min-w-[52px]">
        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Pos</span>
        <input type="number" min="1" value={localPage}
          onChange={e => onLocalPageChange(panel.panelNumber, e.target.value)}
          className="w-10 text-center text-sm font-black text-orange-600 bg-white border border-orange-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all" />
      </div>
      {/* Thumb */}
      <div className="w-16 h-16 flex-shrink-0 bg-gray-50 overflow-hidden self-center ml-1 rounded-lg">
        {!imgErr
          ? <img src={panel.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={16} className="text-gray-300" /></div>}
      </div>
      {/* Info */}
      <div className="flex-1 px-3 py-3 min-w-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${panel.size === 'wide' ? 'bg-blue-50 text-blue-500' : panel.size === 'half' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'}`}>
          {panel.size}
        </span>
        <p className="hindi-text text-gray-600 text-xs leading-relaxed line-clamp-2 mt-1">
          {panel.captionHindi || <span className="italic text-gray-300">No caption</span>}
        </p>
      </div>
      {/* Actions */}
      <div className="flex flex-col items-center justify-center gap-1.5 pr-3 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(panel)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-xl transition-colors"><Edit3 size={12} /></button>
        <button onClick={() => onDelete(panel.panelNumber)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 rounded-xl transition-colors"><Trash2 size={12} /></button>
      </div>
    </motion.div>
  );
}

// ── Panel Modal ────────────────────────────────────────────────
function PanelModal({ panel, onClose, onSave, loading }) {
  const isEdit = !!panel;
  const fileRef = useRef();
  const [preview, setPreview] = useState(panel?.imageUrl || null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState(panel?.captionHindi || '');
  const [pageNumber, setPageNumber] = useState(panel?.pageNumber || '');
  const [size, setSize] = useState(panel?.size || 'wide');
  const [drag, setDrag] = useState(false);

  function handleFile(e) { const f = e.target.files[0]; if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); }
  function handleDrop(e) { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) { setFile(f); setPreview(URL.createObjectURL(f)); } }
  function submit() { const fd = new FormData(); if (file) fd.append('image', file); fd.append('captionHindi', caption); fd.append('pageNumber', pageNumber); fd.append('size', size); onSave(fd, panel?.panelNumber); }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEdit ? 'bg-blue-50' : 'bg-orange-50'}`}>
              {isEdit ? <Edit3 size={15} className="text-blue-500" /> : <Plus size={15} className="text-orange-500" />}
            </div>
            <h3 className="text-gray-800 font-bold">{isEdit ? 'पेज अपडेट' : 'नया पेज जोड़ें'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X size={15} /></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {/* Drop zone */}
          <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden
              ${drag ? 'border-orange-400 bg-orange-50' : preview ? 'border-orange-200' : 'border-gray-200 hover:border-orange-300'}`}>
            {preview
              ? <div className="relative"><img src={preview} alt="" className="w-full max-h-48 object-contain bg-gray-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center"><span className="text-white text-sm font-medium flex items-center gap-2"><Upload size={14} /> Change</span></div></div>
              : <div className="flex flex-col items-center py-10"><div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-2"><ImagePlus size={20} className="text-gray-400" /></div>
                  <p className="text-sm text-gray-500 font-medium">Drop image or click</p><p className="text-xs text-gray-300 mt-1">PNG, JPG, WebP · 20MB max</p></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Position</label>
              <input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} placeholder="e.g. 3"
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Layout</label>
              <div className="flex gap-1.5">
                {[{ v: 'wide', i: '▬', c: 'blue' }, { v: 'half', i: '▪▪', c: 'purple' }, { v: 'third', i: '▫▫▫', c: 'green' }].map(s => (
                  <button key={s.v} onClick={() => setSize(s.v)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all
                      ${size === s.v ? s.c === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-600' : s.c === 'purple' ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-green-400 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'}`}>
                    {s.i}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block flex items-center gap-1"><FileText size={11} /> Caption</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="इस पेज की कहानी..." rows={3}
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-3 rounded-xl text-sm focus:outline-none transition-all resize-none hindi-text leading-relaxed" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm transition-colors">Cancel</button>
            <motion.button onClick={submit} disabled={loading || (!isEdit && !file)} whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save size={14} /> {isEdit ? 'Update' : 'Add Page'}</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Create Episode Modal ───────────────────────────────────────
function CreateEpisodeModal({ onClose, onSave, loading, nextEpNum }) {
  const [title, setTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [epNum, setEpNum] = useState(String(nextEpNum));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center"><Plus size={15} className="text-orange-500" /></div>
            <h3 className="text-gray-800 font-bold">नया Episode बनाएँ</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X size={15} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Episode No.</label>
              <input type="number" min="1" value={epNum} onChange={e => setEpNum(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Sub-title</label>
              <input value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} placeholder="e.g. धुआँ का जन्म"
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all hindi-text" />
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Comic title..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all hindi-text" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all resize-none hindi-text" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm transition-colors">Cancel</button>
            <motion.button onClick={() => onSave({ title, episodeTitle, description, episodeNumber: epNum })} disabled={loading || !title} whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-40 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Create</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { id: urlEpisodeId } = useParams();   // /admin/dashboard/:id
  const { toasts, success, error: toastError } = useToast();

  // ── Episode list view ──
  const [episodes,     setEpisodes]     = useState([]);
  const [analytics,    setAnalytics]    = useState(null);
  const [listLoading,  setListLoading]  = useState(true);

  // ── Episode editor view ──
  const [activeEp,     setActiveEp]     = useState(null);   // full episode with panels
  const [panels,       setPanels]       = useState([]);
  const [epLoading,    setEpLoading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [localPages,   setLocalPages]   = useState({});
  const [orderDirty,   setOrderDirty]   = useState(false);
  const [applyingSave, setApplyingSave] = useState(false);

  // ── Modals ──
  const [showCreate,      setShowCreate]      = useState(false);
  const [showAddPanel,    setShowAddPanel]    = useState(false);
  const [editPanel,       setEditPanel]       = useState(null);
  const [deleteEpConfirm, setDeleteEpConfirm] = useState(null);
  const [deletePanelNum,  setDeletePanelNum]  = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('dhuaa_admin_token')) { navigate('/admin'); return; }
    loadList();
  }, []);

  // If URL has an episode id, open it directly
  useEffect(() => {
    if (urlEpisodeId) openEpisode(urlEpisodeId);
  }, [urlEpisodeId]);

  async function loadList() {
    setListLoading(true);
    try {
      const [epRes, statsRes] = await Promise.all([
        adminGetEpisodes(),
        fetchAnalytics().catch(() => ({ data: null }))
      ]);
      setEpisodes(epRes.data);
      setAnalytics(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally { setListLoading(false); }
  }

  async function openEpisode(id) {
    setEpLoading(true);
    setActiveEp(null);
    try {
      const res = await adminGetEpisode(id);
      const sorted = [...res.data.panels].sort((a, b) => a.pageNumber - b.pageNumber);
      setActiveEp(res.data);
      setPanels(sorted);
      const init = {};
      sorted.forEach(p => { init[p.panelNumber] = String(p.pageNumber); });
      setLocalPages(init);
      setOrderDirty(false);
    } catch (err) { toastError('Failed to load episode'); }
    finally { setEpLoading(false); }
  }

  function closeEpisode() { setActiveEp(null); setPanels([]); navigate('/admin/dashboard'); }

  // ── Episode actions ──
  async function handleCreateEpisode(data) {
    setSaving(true);
    try { const r = await adminCreateEpisode(data); success('Episode बनाया गया ✓'); setShowCreate(false); await loadList(); openEpisode(r.data.episode._id); }
    catch (err) { toastError(err.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  }

  async function togglePublish(ep) {
    try {
      await adminPublishEpisode(ep._id, !ep.published);
      success(ep.published ? 'Unpublished' : 'Published! Readers can see it now ✓');
      loadList();
      if (activeEp?._id === ep._id) setActiveEp(p => ({ ...p, published: !p.published }));
    } catch { toastError('Failed'); }
  }

  async function handleDeleteEpisode(id) {
    setSaving(true);
    try { await adminDeleteEpisode(id); success('Episode deleted'); setDeleteEpConfirm(null); closeEpisode(); loadList(); }
    catch { toastError('Delete failed'); }
    finally { setSaving(false); }
  }

  // ── Panel actions ──
  function handleLocalPageChange(panelNumber, value) {
    setLocalPages(p => ({ ...p, [panelNumber]: value }));
    setOrderDirty(true);
  }

  async function applyOrder() {
    const entries = panels.map(p => ({ panelNumber: p.panelNumber, pageNumber: parseInt(localPages[p.panelNumber]) || p.pageNumber }));
    const dupes = entries.length !== new Set(entries.map(e => e.pageNumber)).size;
    if (dupes) { toastError('हर पेज का नंबर अलग होना चाहिए'); return; }
    setApplyingSave(true);
    try { await adminReorderPanels(activeEp._id, entries); success('क्रम सेव ✓'); openEpisode(activeEp._id); }
    catch { toastError('Order save failed'); }
    finally { setApplyingSave(false); }
  }

  async function handleAddPanel(formData) {
    setSaving(true);
    try { await adminAddPanel(activeEp._id, formData); success('पेज जोड़ा गया ✓'); setShowAddPanel(false); openEpisode(activeEp._id); }
    catch (err) { toastError(err.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  }

  async function handleEditPanel(formData, panelNumber) {
    setSaving(true);
    try { await adminUpdatePanel(activeEp._id, panelNumber, formData); success('पेज अपडेट ✓'); setEditPanel(null); openEpisode(activeEp._id); }
    catch (err) { toastError(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  }

  async function handleDeletePanel(panelNumber) {
    setSaving(true);
    try { await adminDeletePanel(activeEp._id, panelNumber); success('पेज हटाया ✓'); setDeletePanelNum(null); openEpisode(activeEp._id); }
    catch { toastError('Delete failed'); }
    finally { setSaving(false); }
  }

  const displayPanels = [...panels].sort((a, b) => {
    const pa = parseInt(localPages[a.panelNumber]) || a.pageNumber;
    const pb = parseInt(localPages[b.panelNumber]) || b.pageNumber;
    return pa - pb;
  });

  function logout() { localStorage.removeItem('dhuaa_admin_token'); navigate('/admin'); }

  // ════════════════════════════════════════════════════
  // RENDER — Episode Editor View
  // ════════════════════════════════════════════════════
  if (epLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #fed7aa', borderTopColor: '#f97316' }} />
    </div>
  );

  if (activeEp) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Toast toasts={toasts} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={closeEpisode} className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <p className="text-gray-400 text-xs">Episode {activeEp.episodeNumber}</p>
            <h2 className="hindi-text font-black text-gray-800 text-base truncate">{activeEp.title}</h2>
          </div>
          {/* Publish toggle */}
          <button onClick={() => togglePublish(activeEp)}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all
              ${activeEp.published
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
            {activeEp.published ? <><Globe size={11} /> Published</> : <><Lock size={11} /> Draft</>}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/read/${activeEp._id}`} target="_blank"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-xl transition-all font-medium">
            <Eye size={12} /> Preview
          </a>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md shadow-orange-100 transition-all">
            <Plus size={13} /> Add Page
          </motion.button>
          <button onClick={logout} className="md:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><LogOut size={14} /></button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Order controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className="text-orange-500" />
            <h3 className="font-bold text-gray-800">Pages</h3>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{panels.length}</span>
          </div>
          {orderDirty && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={applyOrder} disabled={applyingSave}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-orange-100 transition-all">
              {applyingSave ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><SortAsc size={13} /> Apply Order</>}
            </motion.button>
          )}
        </div>

        {panels.length > 1 && (
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <SortAsc size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-xs leading-relaxed">Change the <strong>Pos</strong> number on each card. Lower = first. Click <strong>Apply Order</strong> to save.</p>
          </div>
        )}

        {panels.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center"><ImagePlus size={24} className="text-orange-300" /></div>
            <div><p className="text-gray-600 font-semibold">No pages yet</p><p className="text-gray-400 text-sm mt-1">Add your first comic page</p></div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddPanel(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center gap-2">
              <Plus size={14} /> Add First Page
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence>
              {displayPanels.map((panel, idx) => (
                <PanelCard key={panel.panelNumber} panel={panel} index={idx}
                  localPage={localPages[panel.panelNumber] ?? String(panel.pageNumber)}
                  onLocalPageChange={handleLocalPageChange} onEdit={setEditPanel} onDelete={setDeletePanelNum} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {panels.length > 0 && (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setShowAddPanel(true)}
            className="w-full bg-orange-50 hover:bg-orange-100 border-2 border-dashed border-orange-200 hover:border-orange-300 text-orange-500 font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
            <Plus size={15} /> अगला पेज जोड़ें
          </motion.button>
        )}

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-700 text-sm font-semibold">Delete Episode</p>
            <p className="text-gray-400 text-xs mt-0.5">Permanently delete this episode and all its pages</p>
          </div>
          <button onClick={() => setDeleteEpConfirm(activeEp._id)}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {/* Panel modals */}
      <AnimatePresence>
        {showAddPanel && <PanelModal panel={null} onClose={() => setShowAddPanel(false)} onSave={handleAddPanel} loading={saving} />}
      </AnimatePresence>
      <AnimatePresence>
        {editPanel && <PanelModal panel={editPanel} onClose={() => setEditPanel(null)} onSave={handleEditPanel} loading={saving} />}
      </AnimatePresence>

      {/* Delete panel confirm */}
      <AnimatePresence>
        {deletePanelNum && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" onClick={() => setDeletePanelNum(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Trash2 className="text-red-400 w-5 h-5" /></div>
              <h3 className="text-gray-800 font-bold mb-1">Delete this page?</h3>
              <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletePanelNum(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-2xl text-sm">Cancel</button>
                <button onClick={() => handleDeletePanel(deletePanelNum)} disabled={saving}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-2xl text-sm shadow-lg shadow-red-100">
                  {saving ? '...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete episode confirm */}
      <AnimatePresence>
        {deleteEpConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" onClick={() => setDeleteEpConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl border border-red-100" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Trash2 className="text-red-400 w-5 h-5" /></div>
              <h3 className="text-gray-800 font-bold mb-1">पूरा Episode हटाएँ?</h3>
              <p className="text-gray-400 text-sm mb-5">All pages will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteEpConfirm(null)} className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-2xl text-sm">Cancel</button>
                <button onClick={() => handleDeleteEpisode(deleteEpConfirm)} disabled={saving}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-2xl text-sm">
                  {saving ? '...' : 'Delete All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDER — Episode List View (main dashboard)
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Toast toasts={toasts} />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-white border-r border-gray-100 shadow-sm">
          <div className="px-5 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-gray-800 text-sm hindi-text">धुआँ</h1>
                <p className="text-gray-400 text-xs">Comic Studio</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Manage</div>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-orange-50 text-orange-600 w-full text-left">
              <LayoutGrid size={14} className="text-orange-500" /> Episodes
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 w-full text-left">
              <TrendingUp size={14} /> Analytics
            </button>
          </nav>
          <div className="px-3 py-4 border-t border-gray-100 space-y-1">
            <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all w-full">
              <Eye size={14} /> View Site
            </a>
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-all w-full">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h2 className="font-black text-gray-800 text-lg">Writer's Dashboard</h2>
              <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">Welcome back, <span className="text-orange-500 font-semibold">Karan</span> 👋</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadList} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><RefreshCw size={14} /></button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-orange-100">
                <Plus size={14} /> <span className="hidden sm:inline">New Episode</span><span className="sm:hidden">New</span>
              </motion.button>
              <button onClick={logout} className="md:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={14} /></button>
            </div>
          </header>

          <div className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-4xl">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon="📺" label="Episodes"   value={episodes.length}                                    color="bg-orange-50" />
              <StatCard icon="👥" label="Readers"    value={analytics?.totalReaders ?? '—'}                    color="bg-blue-50" />
              <StatCard icon="✅" label="Completion" value={analytics ? `${analytics.completionRate}%` : '—'}  color="bg-emerald-50" />
              <StatCard icon="⏱️" label="Avg. Time"  value={analytics?.avgTimeFormatted ?? '—'}                color="bg-violet-50" />
            </div>

            {/* Episodes list */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-gray-800 font-bold">All Episodes</h3>
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{episodes.length}</span>
              </div>

              {listLoading ? (
                <div className="flex flex-col gap-2">
                  {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : episodes.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-4">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center"><BookOpen size={24} className="text-orange-300" /></div>
                  <div className="text-center"><p className="text-gray-600 font-semibold">No episodes yet</p><p className="text-gray-400 text-sm mt-1">Create your first episode</p></div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center gap-2">
                    <Plus size={14} /> Create Episode 1
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {episodes.map((ep, idx) => (
                    <motion.div key={ep._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-orange-200 transition-all group">
                      {/* Cover */}
                      <div className="w-14 h-18 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100" style={{ height: 72 }}>
                        {ep.coverImage
                          ? <img src={ep.coverImage} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">📖</div>}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-orange-500/70 text-[10px] font-bold uppercase tracking-wider">Ep {ep.episodeNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1
                            ${ep.published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {ep.published ? <><Globe size={8} /> Published</> : <><Lock size={8} /> Draft</>}
                          </span>
                        </div>
                        <h4 className="hindi-text text-gray-800 font-bold text-sm truncate">{ep.title}</h4>
                        <p className="text-gray-400 text-xs mt-0.5">{ep.totalPages} pages</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => togglePublish(ep)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all
                            ${ep.published ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`}>
                          {ep.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => openEpisode(ep._id)}
                          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                          Edit <ChevronRight size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create episode modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateEpisodeModal
            onClose={() => setShowCreate(false)}
            onSave={handleCreateEpisode}
            loading={saving}
            nextEpNum={episodes.length + 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
