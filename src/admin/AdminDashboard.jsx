import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Edit3, LogOut, Save,
  Upload, X, Eye, RefreshCw, ImagePlus, FileText,
  LayoutGrid, CheckCircle, AlertCircle, GripVertical,
  TrendingUp, ArrowUpRight, Star, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// dnd-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  adminGetComic, adminUpdateMeta,
  adminAddPanel, adminUpdatePanel, adminDeletePanel,
  fetchAnalytics,
} from '../api/comicApi';

// ── Toast ──────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-auto border
              ${t.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100'
                : 'bg-red-50 text-red-600 border-red-200 shadow-red-100'}`}>
            {t.type === 'success'
              ? <CheckCircle size={15} className="text-emerald-500" />
              : <AlertCircle size={15} className="text-red-500" />}
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
    <motion.div whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-3 cursor-default">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
        <ArrowUpRight size={14} className="text-gray-200" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-gray-400 text-xs font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Sortable Panel Card (dnd-kit) ──────────────────────────────
function SortablePanelCard({ panel, index, onEdit, onDelete, isDragging: isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(panel.panelNumber) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PanelCardInner
        panel={panel}
        index={index}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isBeingDragged={isDragging || isOverlay}
      />
    </div>
  );
}

function PanelCardInner({ panel, index, onEdit, onDelete, dragHandleProps, isBeingDragged }) {
  const [imgErr, setImgErr] = useState(false);
  const isFirst = index === 0;

  return (
    <motion.div
      layout
      animate={{ scale: isBeingDragged ? 1.02 : 1 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex group transition-all duration-150
        ${isBeingDragged ? 'shadow-2xl shadow-orange-100 border-orange-300 ring-2 ring-orange-300' : 'border-gray-100 hover:border-orange-200'}`}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="flex flex-col items-center justify-center bg-gray-50 hover:bg-orange-50 border-r border-gray-100 px-3 cursor-grab active:cursor-grabbing transition-colors group/handle"
        title="Drag to reorder"
      >
        <GripVertical size={16} className="text-gray-300 group-hover/handle:text-orange-400 transition-colors" />
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-20 flex-shrink-0 bg-gray-50 overflow-hidden relative">
        {!imgErr
          ? <img src={panel.imageUrl} alt="" className="w-full h-full object-cover" onError={() => setImgErr(true)} />
          : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={18} className="text-gray-300" /></div>
        }
        {/* First page crown badge */}
        {isFirst && (
          <div className="absolute top-1 left-1 bg-yellow-400 text-white rounded-full p-0.5 shadow">
            <Crown size={9} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {isFirst && (
            <span className="bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Crown size={9} /> First Page
            </span>
          )}
          <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
            पृष्ठ {panel.pageNumber}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${panel.size === 'wide' ? 'bg-blue-50 text-blue-500'
              : panel.size === 'half' ? 'bg-purple-50 text-purple-500'
              : 'bg-green-50 text-green-500'}`}>
            {panel.size}
          </span>
        </div>
        <p className="hindi-text text-gray-600 text-xs leading-relaxed line-clamp-2">
          {panel.captionHindi || <span className="italic text-gray-300">No caption</span>}
        </p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex flex-col items-center justify-center gap-2 pr-3 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(panel)}
          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-xl transition-colors" title="Edit">
          <Edit3 size={13} />
        </button>
        <button onClick={() => onDelete(panel.panelNumber)}
          className="p-2 bg-red-50 hover:bg-red-100 text-red-400 rounded-xl transition-colors" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Panel Modal (Add / Edit) ───────────────────────────────────
function PanelModal({ panel, onClose, onSave, loading }) {
  const isEdit = !!panel;
  const fileRef = useRef();
  const [preview, setPreview] = useState(panel?.imageUrl || null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState(panel?.captionHindi || '');
  const [pageNumber, setPageNumber] = useState(panel?.pageNumber || '');
  const [size, setSize] = useState(panel?.size || 'wide');
  const [dragging, setDragging] = useState(false);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) { setFile(f); setPreview(URL.createObjectURL(f)); }
  }
  function handleSubmit() {
    const fd = new FormData();
    if (file) fd.append('image', file);
    fd.append('captionHindi', caption);
    fd.append('pageNumber', pageNumber);
    fd.append('size', size);
    onSave(fd, panel?.panelNumber);
  }

  const sizeOptions = [
    { val: 'wide',  label: 'Full Width', desc: 'पूरी',  icon: '▬', color: 'blue' },
    { val: 'half',  label: 'Half',       desc: 'आधा',   icon: '▪▪', color: 'purple' },
    { val: 'third', label: 'Third',      desc: 'तिहाई', icon: '▫▫▫', color: 'green' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-gray-200/80 border border-gray-100"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEdit ? 'bg-blue-50' : 'bg-orange-50'}`}>
              {isEdit ? <Edit3 size={16} className="text-blue-500" /> : <Plus size={16} className="text-orange-500" />}
            </div>
            <div>
              <h3 className="text-gray-800 font-bold text-base">{isEdit ? 'पेज अपडेट करें' : 'नया पेज जोड़ें'}</h3>
              <p className="text-gray-400 text-xs">{isEdit ? 'Edit page content' : 'Add a new comic page'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Drop zone */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">
              {isEdit ? 'Replace Image (optional)' : 'Page Image *'}
            </label>
            <div
              onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)} onClick={() => fileRef.current.click()}
              className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden
                ${dragging ? 'border-orange-400 bg-orange-50' : preview ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/20'}`}>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-56 object-contain bg-gray-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full text-sm font-medium">
                      <Upload size={14} /> Change Image
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <ImagePlus size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Drop image here or click to browse</p>
                  <p className="text-xs text-gray-300 mt-1">PNG, JPG, WebP · Max 20MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Page number + Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Page Number</label>
              <input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} placeholder="e.g. 7"
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Layout</label>
              <div className="flex gap-1.5">
                {sizeOptions.map(s => (
                  <button key={s.val} onClick={() => setSize(s.val)} title={s.label}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all
                      ${size === s.val
                        ? s.color === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-600'
                          : s.color === 'purple' ? 'border-purple-400 bg-purple-50 text-purple-600'
                          : 'border-green-400 bg-green-50 text-green-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block flex items-center gap-1.5">
              <FileText size={11} /> Caption (Hindi)
            </label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="इस पेज की कहानी यहाँ लिखें..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 px-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all resize-none hindi-text leading-relaxed placeholder:text-gray-300" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm transition-colors">
              Cancel
            </button>
            <motion.button onClick={handleSubmit} disabled={loading || (!isEdit && !file)} whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-all">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><Save size={14} /> {isEdit ? 'Update Page' : 'Add Page'}</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Meta Modal ─────────────────────────────────────────────────
function MetaModal({ comic, onClose, onSave, loading }) {
  const [title, setTitle] = useState(comic.title || '');
  const [description, setDescription] = useState(comic.description || '');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl shadow-gray-200 border border-gray-100"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <Edit3 size={16} className="text-violet-500" />
            </div>
            <div>
              <h3 className="text-gray-800 font-bold text-base">Comic Details</h3>
              <p className="text-gray-400 text-xs">Edit title & description</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white text-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all hindi-text" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white text-gray-800 px-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all resize-none hindi-text leading-relaxed" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm transition-colors">Cancel</button>
            <motion.button onClick={() => onSave({ title, description })} disabled={loading} whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-violet-100 flex items-center justify-center gap-2 transition-all">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Save reorder to backend ────────────────────────────────────
function saveReorderToBackend(orderedPanels, onError) {
  const order = orderedPanels.map((p, i) => ({
    panelNumber: p.panelNumber,
    newPanelNumber: i + 1,
    newPageNumber: i + 1,      // each panel = its own page number in order
  }));
  fetch('/api/admin/panels/reorder', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('dhuaa_admin_token')}`,
    },
    body: JSON.stringify({ order }),
  }).catch(() => onError('Reorder save failed'));
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toasts, success, error: toastError } = useToast();

  const [comic, setComic] = useState(null);
  const [panels, setPanels] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);   // id of panel being dragged

  const [showAddModal, setShowAddModal] = useState(false);
  const [editPanel, setEditPanel] = useState(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // dnd-kit sensors — pointer (mouse) + touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  useEffect(() => {
    if (!localStorage.getItem('dhuaa_admin_token')) { navigate('/admin'); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadComic(), loadStats()]);
    setLoading(false);
  }

  async function loadComic() {
    try {
      const res = await adminGetComic();
      setComic(res.data);
      setPanels([...res.data.panels].sort((a, b) => a.panelNumber - b.panelNumber));
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    }
  }

  async function loadStats() {
    try { const r = await fetchAnalytics(); setAnalytics(r.data); } catch { /* silent */ }
  }

  // ── DnD handlers ──────────────────────────────────────────────
  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPanels(prev => {
      const oldIndex = prev.findIndex(p => String(p.panelNumber) === active.id);
      const newIndex = prev.findIndex(p => String(p.panelNumber) === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Reassign panel + page numbers by new position
      const renumbered = reordered.map((p, i) => ({ ...p, panelNumber: i + 1, pageNumber: i + 1 }));
      saveReorderToBackend(renumbered, toastError);

      const isNowFirst = renumbered[0]?.panelNumber !== prev[0]?.panelNumber;
      if (isNowFirst) success(`पेज "${renumbered[0].captionHindi?.slice(0, 20) || '#1'}" अब पहला पेज है 👑`);

      return renumbered;
    });
  }

  // ── "Make First" quick action ─────────────────────────────────
  function makeFirst(panelNumber) {
    setPanels(prev => {
      const idx = prev.findIndex(p => p.panelNumber === panelNumber);
      if (idx === 0) return prev;
      const reordered = [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      const renumbered = reordered.map((p, i) => ({ ...p, panelNumber: i + 1, pageNumber: i + 1 }));
      saveReorderToBackend(renumbered, toastError);
      success('पेज को पहले स्थान पर ले जाया गया 👑');
      return renumbered;
    });
  }

  // ── CRUD handlers ─────────────────────────────────────────────
  async function handleAddPanel(formData) {
    setSaving(true);
    try { await adminAddPanel(formData); success('नया पेज जोड़ा गया ✓'); setShowAddModal(false); loadComic(); }
    catch (err) { toastError(err.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  }

  async function handleEditPanel(formData, panelNumber) {
    setSaving(true);
    try { await adminUpdatePanel(panelNumber, formData); success('पेज अपडेट हो गया ✓'); setEditPanel(null); loadComic(); }
    catch (err) { toastError(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(panelNumber) {
    setSaving(true);
    try { await adminDeletePanel(panelNumber); success('पेज हटा दिया गया ✓'); setDeleteConfirm(null); loadComic(); }
    catch (err) { toastError(err.response?.data?.message || 'Delete failed'); }
    finally { setSaving(false); }
  }

  async function handleSaveMeta(data) {
    setSaving(true);
    try { await adminUpdateMeta(data); success('Details saved ✓'); setShowMetaModal(false); loadComic(); }
    catch { toastError('Save failed'); }
    finally { setSaving(false); }
  }

  function logout() { localStorage.removeItem('dhuaa_admin_token'); navigate('/admin'); }

  // Active drag panel (for DragOverlay)
  const activePanelObj = activeDragId ? panels.find(p => String(p.panelNumber) === activeDragId) : null;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid #fed7aa', borderTopColor: '#f97316' }} />
        <p className="text-gray-400 text-sm font-medium">Loading your studio...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Toast toasts={toasts} />

      <div className="flex min-h-screen">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white border-r border-gray-100 shadow-sm">
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <BookOpen size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-gray-800 text-base leading-none hindi-text">धुआँ</h1>
                <p className="text-gray-400 text-xs mt-0.5">Comic Studio</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Manage</div>
            {[
              { icon: LayoutGrid, label: 'All Pages',      active: true,  onClick: undefined },
              { icon: TrendingUp, label: 'Analytics',      active: false, onClick: undefined },
              { icon: Edit3,      label: 'Comic Details',  active: false, onClick: () => setShowMetaModal(true) },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                  ${item.active ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <item.icon size={15} className={item.active ? 'text-orange-500' : ''} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="px-4 py-5 border-t border-gray-100 space-y-1">
            <a href="/" target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full">
              <Eye size={15} /> Preview Comic
            </a>
            <button onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-all w-full">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h2 className="font-black text-gray-800 text-lg">Writer's Dashboard</h2>
              <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">
                Welcome back, <span className="text-orange-500 font-semibold">Karan</span> 👋
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadAll} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <RefreshCw size={15} />
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-orange-100 transition-all">
                <Plus size={15} />
                <span className="hidden sm:inline">नया पेज</span>
                <span className="sm:hidden">Add</span>
              </motion.button>
              <button onClick={logout} className="md:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={15} />
              </button>
            </div>
          </header>

          <div className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-4xl">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon="📄" label="Total Pages"  value={panels.length}                          color="bg-orange-50" />
              <StatCard icon="👥" label="Readers"      value={analytics?.totalReaders ?? '—'}         color="bg-blue-50" />
              <StatCard icon="✅" label="Completion"   value={analytics ? `${analytics.completionRate}%` : '—'} color="bg-emerald-50" />
              <StatCard icon="⏱️" label="Avg. Time"    value={analytics?.avgTimeFormatted ?? '—'}     color="bg-violet-50" />
            </div>

            {/* Comic info */}
            {comic && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                  {comic.coverImage
                    ? <img src={comic.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={18} className="text-gray-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="hindi-text text-gray-800 font-bold text-lg leading-tight">{comic.title}</h3>
                      <p className="hindi-text text-gray-400 text-xs leading-relaxed mt-1 line-clamp-2">{comic.description}</p>
                    </div>
                    <button onClick={() => setShowMetaModal(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-xl transition-all font-medium">
                      <Edit3 size={11} /> Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Star size={10} /> {panels.length} pages
                    </span>
                    <span className="text-gray-300 text-xs">
                      Updated {new Date(comic.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pages list with DnD */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={16} className="text-orange-500" />
                  <h3 className="text-gray-800 font-bold">Comic Pages</h3>
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{panels.length}</span>
                </div>
                <p className="text-gray-400 text-xs hidden sm:block flex items-center gap-1">
                  <GripVertical size={11} className="inline" /> Drag to reorder · Right-click for options
                </p>
              </div>

              {/* Drag hint banner */}
              {panels.length > 1 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
                  <GripVertical size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-amber-700 text-xs font-medium">
                    <strong>Drag</strong> any page by its handle to reorder. First page gets a <Crown size={10} className="inline text-yellow-500" /> crown.
                  </p>
                </div>
              )}

              {panels.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <ImagePlus size={28} className="text-orange-300" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">No pages yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first comic page to get started</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center gap-2">
                    <Plus size={15} /> Add First Page
                  </motion.button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={panels.map(p => String(p.panelNumber))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2.5">
                      {panels.map((panel, idx) => (
                        <SortablePanelCard
                          key={String(panel.panelNumber)}
                          panel={panel}
                          index={idx}
                          onEdit={setEditPanel}
                          onDelete={setDeleteConfirm}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  {/* Ghost card while dragging */}
                  <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activePanelObj && (
                      <PanelCardInner
                        panel={activePanelObj}
                        index={panels.findIndex(p => String(p.panelNumber) === activeDragId)}
                        onEdit={() => {}} onDelete={() => {}}
                        dragHandleProps={{}}
                        isBeingDragged={true}
                      />
                    )}
                  </DragOverlay>
                </DndContext>
              )}

              {/* Add more CTA */}
              {panels.length > 0 && (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 w-full bg-orange-50 hover:bg-orange-100 border-2 border-dashed border-orange-200 hover:border-orange-300 text-orange-500 font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all">
                  <Plus size={16} /> अगला पेज जोड़ें
                </motion.button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && <PanelModal panel={null} onClose={() => setShowAddModal(false)} onSave={handleAddPanel} loading={saving} />}
      </AnimatePresence>
      <AnimatePresence>
        {editPanel && <PanelModal panel={editPanel} onClose={() => setEditPanel(null)} onSave={handleEditPanel} loading={saving} />}
      </AnimatePresence>
      <AnimatePresence>
        {showMetaModal && comic && <MetaModal comic={comic} onClose={() => setShowMetaModal(false)} onSave={handleSaveMeta} loading={saving} />}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl shadow-gray-200 border border-gray-100"
              onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-400 w-6 h-6" />
              </div>
              <h3 className="text-gray-800 font-bold text-base mb-1">Delete this page?</h3>
              <p className="text-gray-400 text-sm mb-6">पेज #{deleteConfirm} permanently हटा दिया जाएगा।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-2xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-2xl text-sm transition-colors shadow-lg shadow-red-100">
                  {saving ? '...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
