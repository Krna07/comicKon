import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Save,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  RefreshCw,
  ImagePlus,
  FileText,
  LayoutGrid,
  CheckCircle,
  AlertCircle,
  GripVertical,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Star,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import {
  adminGetComic,
  adminUpdateMeta,
  adminAddPanel,
  adminUpdatePanel,
  adminDeletePanel,
  fetchAnalytics,
} from '../api/comicApi';


// ============================================================
// TOAST
// ============================================================

function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{
              opacity: 0,
              x: 80,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: 80,
              scale: 0.9,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
            }}
            className={`
              flex items-center gap-3
              px-4 py-3.5
              rounded-2xl
              text-sm font-bold
              shadow-2xl
              pointer-events-auto
              border
              backdrop-blur-xl
              ${
                t.type === 'success'
                  ? `
                    bg-emerald-50/95
                    text-emerald-700
                    border-emerald-200
                    shadow-emerald-100
                  `
                  : `
                    bg-red-50/95
                    text-red-600
                    border-red-200
                    shadow-red-100
                  `
              }
            `}
          >
            <div
              className={`
                w-7 h-7
                rounded-xl
                flex items-center justify-center
                ${
                  t.type === 'success'
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                }
              `}
            >
              {t.type === 'success' ? (
                <CheckCircle
                  size={15}
                  className="text-emerald-500"
                />
              ) : (
                <AlertCircle
                  size={15}
                  className="text-red-500"
                />
              )}
            </div>

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
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((toast) => toast.id !== id)
      );
    }, 3000);
  };

  return {
    toasts,
    success: (message) => add(message, 'success'),
    error: (message) => add(message, 'error'),
  };
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
  theme = 'orange',
  sub,
}) {
  const themes = {
    orange: {
      background:
        'from-orange-50 via-white to-amber-50',
      icon:
        'from-orange-500 to-amber-500',
      text: 'text-orange-600',
      border: 'border-orange-100',
      shadow: 'hover:shadow-orange-100',
    },

    blue: {
      background:
        'from-blue-50 via-white to-cyan-50',
      icon:
        'from-blue-500 to-cyan-500',
      text: 'text-blue-600',
      border: 'border-blue-100',
      shadow: 'hover:shadow-blue-100',
    },

    emerald: {
      background:
        'from-emerald-50 via-white to-teal-50',
      icon:
        'from-emerald-500 to-teal-500',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      shadow: 'hover:shadow-emerald-100',
    },

    violet: {
      background:
        'from-violet-50 via-white to-purple-50',
      icon:
        'from-violet-500 to-purple-500',
      text: 'text-violet-600',
      border: 'border-violet-100',
      shadow: 'hover:shadow-violet-100',
    },
  };

  const selected = themes[theme];

  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.015,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`
        relative
        overflow-hidden
        bg-gradient-to-br
        ${selected.background}
        rounded-3xl
        border
        ${selected.border}
        p-5
        shadow-sm
        ${selected.shadow}
        hover:shadow-xl
        transition-all
        duration-300
        group
      `}
    >
      {/* Decorative glow */}
      <div
        className="
          absolute
          -right-8
          -top-8
          w-28
          h-28
          rounded-full
          bg-white/80
          blur-2xl
          pointer-events-none
        "
      />

      {/* Top accent */}
      <div
        className={`
          absolute
          top-0
          left-5
          right-5
          h-1
          rounded-b-full
          bg-gradient-to-r
          ${selected.icon}
          opacity-80
        `}
      />

      <div className="relative flex items-center justify-between mb-5">
        <div
          className={`
            w-12
            h-12
            rounded-2xl
            bg-gradient-to-br
            ${selected.icon}
            flex
            items-center
            justify-center
            text-white
            text-xl
            shadow-lg
            group-hover:scale-110
            transition-transform
            duration-300
          `}
        >
          {icon}
        </div>

        <div
          className="
            w-8
            h-8
            rounded-full
            bg-white/80
            flex
            items-center
            justify-center
          "
        >
          <ArrowUpRight
            size={15}
            className={`${selected.text} opacity-60`}
          />
        </div>
      </div>

      <div className="relative">
        <p className="text-3xl font-black text-gray-900 tracking-tight">
          {value}
        </p>

        <p
          className={`
            text-xs
            font-black
            mt-1
            ${selected.text}
          `}
        >
          {label}
        </p>

        {sub && (
          <p className="text-gray-400 text-xs mt-1">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}


// ============================================================
// PANEL CARD
// ============================================================

function PanelCard({
  panel,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      whileHover={{
        y: -2,
        scale: 1.005,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
      className="
        relative
        overflow-hidden
        bg-white
        rounded-3xl
        border
        border-gray-200
        shadow-sm
        hover:shadow-xl
        hover:shadow-orange-100/50
        hover:border-orange-200
        flex
        group
        transition-all
        duration-300
      "
    >
      {/* Left accent */}
      <div
        className="
          absolute
          left-0
          top-0
          bottom-0
          w-1
          bg-gradient-to-b
          from-orange-400
          via-amber-400
          to-orange-500
          opacity-0
          group-hover:opacity-100
          transition-opacity
        "
      />

      {/* Drag / order controls */}
      <div
        className="
          flex
          flex-col
          items-center
          justify-between
          bg-gradient-to-b
          from-gray-50
          to-orange-50/40
          border-r
          border-gray-100
          px-2.5
          py-3
          gap-1
        "
      >
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="
            p-1.5
            text-gray-300
            hover:text-orange-500
            disabled:opacity-20
            transition-all
            rounded-lg
            hover:bg-orange-50
          "
        >
          <ChevronUp size={14} />
        </button>

        <GripVertical
          size={15}
          className="
            text-gray-200
            group-hover:text-orange-300
            transition-colors
          "
        />

        <button
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="
            p-1.5
            text-gray-300
            hover:text-orange-500
            disabled:opacity-20
            transition-all
            rounded-lg
            hover:bg-orange-50
          "
        >
          <ChevronDown size={14} />
        </button>
      </div>


      {/* Thumbnail */}
      <div
        className="
          w-24
          h-24
          flex-shrink-0
          bg-gradient-to-br
          from-gray-50
          to-orange-50
          overflow-hidden
          p-1.5
        "
      >
        <div
          className="
            w-full
            h-full
            rounded-2xl
            overflow-hidden
            bg-gray-100
            ring-1
            ring-gray-200
            group-hover:ring-orange-200
            transition-all
          "
        >
          {!imgErr ? (
            <img
              src={panel.imageUrl}
              alt=""
              className="
                w-full
                h-full
                object-cover
                group-hover:scale-105
                transition-transform
                duration-500
              "
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImagePlus
                size={20}
                className="text-gray-300"
              />
            </div>
          )}
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">

          <span
            className="
              bg-gradient-to-r
              from-orange-100
              to-amber-100
              text-orange-600
              text-xs
              font-black
              px-2.5
              py-1
              rounded-full
              border
              border-orange-200
            "
          >
            पृष्ठ {panel.pageNumber}
          </span>

          <span className="text-gray-300 text-xs">
            •
          </span>

          <span className="text-gray-400 text-xs font-semibold">
            #{panel.panelNumber}
          </span>

          <span
            className={`
              text-xs
              px-2.5
              py-1
              rounded-full
              font-bold
              border
              ${
                panel.size === 'wide'
                  ? 'bg-blue-50 text-blue-500 border-blue-100'
                  : panel.size === 'half'
                  ? 'bg-purple-50 text-purple-500 border-purple-100'
                  : 'bg-green-50 text-green-500 border-green-100'
              }
            `}
          >
            {panel.size}
          </span>
        </div>

        <p
          className="
            hindi-text
            text-gray-600
            text-xs
            leading-relaxed
            line-clamp-2
          "
        >
          {panel.captionHindi || (
            <span className="italic text-gray-300">
              No caption added
            </span>
          )}
        </p>
      </div>


      {/* Actions */}
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          gap-2
          pr-3
          pl-2
          opacity-0
          group-hover:opacity-100
          transition-opacity
        "
      >
        <button
          onClick={() => onEdit(panel)}
          className="
            p-2.5
            bg-blue-50
            hover:bg-blue-100
            text-blue-500
            rounded-xl
            transition-all
            hover:scale-110
            border
            border-blue-100
          "
        >
          <Edit3 size={13} />
        </button>

        <button
          onClick={() => onDelete(panel.panelNumber)}
          className="
            p-2.5
            bg-red-50
            hover:bg-red-100
            text-red-400
            hover:text-red-500
            rounded-xl
            transition-all
            hover:scale-110
            border
            border-red-100
          "
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}


// ============================================================
// PANEL MODAL
// ============================================================

function PanelModal({
  panel,
  onClose,
  onSave,
  loading,
}) {
  const isEdit = !!panel;

  const fileRef = useRef();

  const [preview, setPreview] = useState(
    panel?.imageUrl || null
  );

  const [file, setFile] = useState(null);

  const [caption, setCaption] = useState(
    panel?.captionHindi || ''
  );

  const [pageNumber, setPageNumber] = useState(
    panel?.pageNumber || ''
  );

  const [size, setSize] = useState(
    panel?.size || 'wide'
  );

  const [dragging, setDragging] = useState(false);


  function handleFile(e) {
    const f = e.target.files?.[0];

    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }


  function handleDrop(e) {
    e.preventDefault();

    setDragging(false);

    const f = e.dataTransfer.files?.[0];

    if (
      f &&
      f.type &&
      f.type.startsWith('image/')
    ) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }


  function handleSubmit() {
    const fd = new FormData();

    if (file) {
      fd.append('image', file);
    }

    fd.append('captionHindi', caption);
    fd.append('pageNumber', pageNumber);
    fd.append('size', size);

    onSave(
      fd,
      panel?.panelNumber
    );
  }


  const sizeOptions = [
    {
      val: 'wide',
      label: 'Full Width',
      desc: 'पूरी चौड़ाई',
      icon: '▬',
      active:
        'border-blue-400 bg-blue-50 text-blue-600 shadow-blue-100',
    },

    {
      val: 'half',
      label: 'Half',
      desc: 'आधा',
      icon: '▪▪',
      active:
        'border-purple-400 bg-purple-50 text-purple-600 shadow-purple-100',
    },

    {
      val: 'third',
      label: 'One Third',
      desc: 'एक तिहाई',
      icon: '▫▫▫',
      active:
        'border-green-400 bg-green-50 text-green-600 shadow-green-100',
    },
  ];


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/30
        backdrop-blur-md
        px-4
      "
      onClick={onClose}
    >

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 40,
          scale: 0.96,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 26,
        }}
        className="
          bg-white
          rounded-[30px]
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          shadow-[0_30px_100px_rgba(15,23,42,0.18)]
          border
          border-orange-100
          relative
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* Top gradient */}
        <div
          className="
            absolute
            top-0
            left-0
            right-0
            h-1.5
            bg-gradient-to-r
            from-orange-400
            via-amber-400
            to-violet-400
          "
        />


        {/* Header */}
        <div
          className="
            flex
            items-center
            justify-between
            px-6
            py-5
            border-b
            border-gray-100
            bg-gradient-to-r
            from-orange-50/80
            via-white
            to-amber-50/50
          "
        >

          <div className="flex items-center gap-3">

            <div
              className={`
                w-11
                h-11
                rounded-2xl
                flex
                items-center
                justify-center
                shadow-sm
                ${
                  isEdit
                    ? 'bg-blue-100 text-blue-500'
                    : 'bg-orange-100 text-orange-500'
                }
              `}
            >
              {isEdit ? (
                <Edit3 size={17} />
              ) : (
                <Plus size={18} />
              )}
            </div>

            <div>
              <h3 className="text-gray-900 font-black text-base">
                {isEdit
                  ? 'पेज अपडेट करें'
                  : 'नया पेज जोड़ें'}
              </h3>

              <p className="text-gray-400 text-xs mt-0.5">
                {isEdit
                  ? 'Edit page content'
                  : 'Add a new comic page'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="
              p-2.5
              text-gray-400
              hover:text-gray-700
              hover:bg-white
              rounded-xl
              transition-all
              border
              border-transparent
              hover:border-gray-200
            "
          >
            <X size={16} />
          </button>
        </div>


        <div className="p-6 flex flex-col gap-5">

          {/* IMAGE UPLOAD */}
          <div>
            <label
              className="
                text-gray-500
                text-xs
                font-black
                uppercase
                tracking-wide
                mb-2
                block
              "
            >
              {isEdit
                ? 'Replace Image (optional)'
                : 'Page Image *'}
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`
                relative
                border-2
                border-dashed
                rounded-3xl
                cursor-pointer
                transition-all
                overflow-hidden
                ${
                  dragging
                    ? `
                      border-orange-400
                      bg-orange-50
                      scale-[1.01]
                    `
                    : preview
                    ? `
                      border-orange-200
                      bg-orange-50/30
                    `
                    : `
                      border-gray-200
                      hover:border-orange-300
                      hover:bg-orange-50/20
                    `
                }
              `}
            >

              {preview ? (
                <div className="relative">

                  <img
                    src={preview}
                    alt=""
                    className="
                      w-full
                      max-h-60
                      object-contain
                      bg-gray-50
                    "
                  />

                  <div
                    className="
                      absolute
                      inset-0
                      bg-black/50
                      opacity-0
                      hover:opacity-100
                      transition-opacity
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-white
                        bg-black/60
                        px-5
                        py-2.5
                        rounded-full
                        text-sm
                        font-bold
                        backdrop-blur-sm
                      "
                    >
                      <Upload size={14} />
                      Change Image
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-12
                    text-gray-300
                  "
                >

                  <div
                    className="
                      w-16
                      h-16
                      bg-gradient-to-br
                      from-orange-50
                      to-amber-50
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      mb-4
                      border
                      border-orange-100
                    "
                  >
                    <ImagePlus
                      size={24}
                      className="text-orange-300"
                    />
                  </div>

                  <p className="text-sm font-bold text-gray-500">
                    Drop image here or click to browse
                  </p>

                  <p className="text-xs text-gray-300 mt-1">
                    PNG, JPG, WebP · Max 20MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>


          {/* PAGE NUMBER + SIZE */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label
                className="
                  text-gray-500
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  mb-2
                  block
                "
              >
                Page Number
              </label>

              <input
                type="number"
                min="1"
                value={pageNumber}
                onChange={(e) =>
                  setPageNumber(e.target.value)
                }
                placeholder="e.g. 7"
                className="
                  w-full
                  bg-gray-50
                  border
                  border-gray-200
                  focus:border-orange-400
                  focus:bg-white
                  text-gray-800
                  px-3
                  py-3
                  rounded-2xl
                  text-sm
                  focus:outline-none
                  focus:ring-4
                  focus:ring-orange-400/10
                  transition-all
                "
              />
            </div>


            <div>
              <label
                className="
                  text-gray-500
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  mb-2
                  block
                "
              >
                Layout Size
              </label>

              <div className="flex gap-1.5">

                {sizeOptions.map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSize(s.val)}
                    title={s.label}
                    className={`
                      flex-1
                      py-3
                      rounded-2xl
                      border
                      text-xs
                      font-black
                      transition-all
                      ${
                        size === s.val
                          ? `${s.active} shadow-sm`
                          : `
                            border-gray-200
                            text-gray-400
                            hover:border-gray-300
                            hover:bg-gray-50
                          `
                      }
                    `}
                  >
                    {s.icon}
                  </button>
                ))}

              </div>

              <p className="text-xs text-gray-400 mt-1.5 text-center">
                {
                  sizeOptions.find(
                    (s) => s.val === size
                  )?.label
                }
              </p>
            </div>
          </div>


          {/* CAPTION */}
          <div>

            <label
              className="
                text-gray-500
                text-xs
                font-black
                uppercase
                tracking-wide
                mb-2
                block
                flex
                items-center
                gap-1.5
              "
            >
              <FileText size={11} />
              Caption (Hindi)
            </label>

            <textarea
              value={caption}
              onChange={(e) =>
                setCaption(e.target.value)
              }
              placeholder="इस पेज की कहानी यहाँ लिखें..."
              rows={4}
              className="
                w-full
                bg-gray-50
                border
                border-gray-200
                focus:border-orange-400
                focus:bg-white
                text-gray-800
                px-4
                py-3
                rounded-2xl
                text-sm
                focus:outline-none
                focus:ring-4
                focus:ring-orange-400/10
                transition-all
                resize-none
                hindi-text
                leading-relaxed
                placeholder:text-gray-300
              "
            />
          </div>


          {/* BUTTONS */}
          <div className="flex gap-3 pt-1">

            <button
              onClick={onClose}
              className="
                flex-1
                bg-gray-100
                hover:bg-gray-200
                text-gray-600
                font-bold
                py-3.5
                rounded-2xl
                text-sm
                transition-all
                border
                border-gray-200
              "
            >
              Cancel
            </button>

            <motion.button
              onClick={handleSubmit}
              disabled={
                loading ||
                (!isEdit && !file)
              }
              whileTap={{
                scale: 0.98,
              }}
              className="
                flex-1
                bg-gradient-to-r
                from-orange-500
                via-orange-500
                to-amber-500
                hover:from-orange-600
                hover:via-orange-600
                hover:to-amber-600
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-white
                font-black
                py-3.5
                rounded-2xl
                text-sm
                transition-all
                shadow-lg
                shadow-orange-200
                hover:shadow-xl
                hover:shadow-orange-300
                flex
                items-center
                justify-center
                gap-2
                ring-1
                ring-orange-400/20
              "
            >
              {loading ? (
                <>
                  <div
                    className="
                      w-4
                      h-4
                      border-2
                      border-white/30
                      border-t-white
                      rounded-full
                      animate-spin
                    "
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />

                  {isEdit
                    ? 'Update Page'
                    : 'Add Page'}
                </>
              )}
            </motion.button>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


// ============================================================
// META MODAL
// ============================================================

function MetaModal({
  comic,
  onClose,
  onSave,
  loading,
}) {
  const [title, setTitle] = useState(
    comic.title || ''
  );

  const [description, setDescription] =
    useState(comic.description || '');


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/30
        backdrop-blur-md
        px-4
      "
      onClick={onClose}
    >

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 40,
          scale: 0.96,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 26,
        }}
        className="
          bg-white
          rounded-[30px]
          w-full
          max-w-md
          shadow-[0_30px_100px_rgba(15,23,42,0.18)]
          border
          border-violet-100
          relative
          overflow-hidden
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* Top gradient */}
        <div
          className="
            absolute
            top-0
            left-0
            right-0
            h-1.5
            bg-gradient-to-r
            from-violet-500
            via-purple-500
            to-orange-400
          "
        />

        {/* Header */}
        <div
          className="
            flex
            items-center
            justify-between
            px-6
            py-5
            border-b
            border-gray-100
            bg-gradient-to-r
            from-violet-50/80
            via-white
            to-purple-50/50
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-11
                h-11
                bg-gradient-to-br
                from-violet-500
                to-purple-500
                rounded-2xl
                flex
                items-center
                justify-center
                text-white
                shadow-lg
                shadow-violet-200
              "
            >
              <Edit3 size={17} />
            </div>

            <div>
              <h3 className="text-gray-900 font-black text-base">
                Comic Details
              </h3>

              <p className="text-gray-400 text-xs mt-0.5">
                Edit title & description
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="
              p-2.5
              text-gray-400
              hover:text-gray-700
              hover:bg-white
              rounded-xl
              transition-all
              border
              border-transparent
              hover:border-gray-200
            "
          >
            <X size={16} />
          </button>

        </div>


        <div className="p-6 flex flex-col gap-5">

          {/* TITLE */}
          <div>
            <label
              className="
                text-gray-500
                text-xs
                font-black
                uppercase
                tracking-wide
                mb-2
                block
              "
            >
              Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="
                w-full
                bg-gray-50
                border
                border-gray-200
                focus:border-violet-400
                focus:bg-white
                text-gray-800
                px-4
                py-3
                rounded-2xl
                text-sm
                focus:outline-none
                focus:ring-4
                focus:ring-violet-400/10
                transition-all
                hindi-text
              "
            />
          </div>


          {/* DESCRIPTION */}
          <div>
            <label
              className="
                text-gray-500
                text-xs
                font-black
                uppercase
                tracking-wide
                mb-2
                block
              "
            >
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={4}
              className="
                w-full
                bg-gray-50
                border
                border-gray-200
                focus:border-violet-400
                focus:bg-white
                text-gray-800
                px-4
                py-3
                rounded-2xl
                text-sm
                focus:outline-none
                focus:ring-4
                focus:ring-violet-400/10
                transition-all
                resize-none
                hindi-text
                leading-relaxed
              "
            />
          </div>


          {/* BUTTONS */}
          <div className="flex gap-3 pt-1">

            <button
              onClick={onClose}
              className="
                flex-1
                bg-gray-100
                hover:bg-gray-200
                text-gray-600
                font-bold
                py-3.5
                rounded-2xl
                text-sm
                transition-colors
                border
                border-gray-200
              "
            >
              Cancel
            </button>

            <motion.button
              onClick={() =>
                onSave({
                  title,
                  description,
                })
              }
              disabled={loading}
              whileTap={{
                scale: 0.98,
              }}
              className="
                flex-1
                bg-gradient-to-r
                from-violet-500
                to-purple-500
                hover:from-violet-600
                hover:to-purple-600
                disabled:opacity-40
                text-white
                font-black
                py-3.5
                rounded-2xl
                text-sm
                transition-all
                shadow-lg
                shadow-violet-200
                hover:shadow-xl
                hover:shadow-violet-300
                flex
                items-center
                justify-center
                gap-2
              "
            >

              {loading ? (
                <div
                  className="
                    w-4
                    h-4
                    border-2
                    border-white/30
                    border-t-white
                    rounded-full
                    animate-spin
                  "
                />
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}

            </motion.button>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


// ============================================================
// DELETE MODAL
// ============================================================

function DeleteModal({
  panelNumber,
  onClose,
  onDelete,
  loading,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/30
        backdrop-blur-md
        px-4
      "
      onClick={onClose}
    >

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className="
          bg-white
          rounded-[30px]
          p-7
          max-w-sm
          w-full
          text-center
          shadow-[0_30px_100px_rgba(15,23,42,0.18)]
          border
          border-red-100
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div
          className="
            w-16
            h-16
            bg-gradient-to-br
            from-red-50
            to-rose-100
            rounded-2xl
            flex
            items-center
            justify-center
            mx-auto
            mb-5
            border
            border-red-100
            shadow-sm
          "
        >
          <Trash2
            className="text-red-400"
            size={25}
          />
        </div>

        <h3 className="text-gray-900 font-black text-lg mb-1">
          Delete this page?
        </h3>

        <p className="text-gray-400 text-sm mb-7">
          पेज #{panelNumber} permanently हटा दिया जाएगा।
        </p>

        <div className="flex gap-3">

          <button
            onClick={onClose}
            className="
              flex-1
              bg-gray-100
              hover:bg-gray-200
              text-gray-600
              font-bold
              py-3
              rounded-2xl
              text-sm
              transition-colors
              border
              border-gray-200
            "
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onDelete(panelNumber)
            }
            disabled={loading}
            className="
              flex-1
              bg-gradient-to-r
              from-red-500
              to-rose-500
              hover:from-red-600
              hover:to-rose-600
              disabled:opacity-50
              text-white
              font-black
              py-3
              rounded-2xl
              text-sm
              transition-all
              shadow-lg
              shadow-red-100
            "
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>

        </div>
      </motion.div>
    </motion.div>
  );
}


// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    toasts,
    success,
    error: toastError,
  } = useToast();


  const [comic, setComic] = useState(null);
  const [panels, setPanels] = useState([]);
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editPanel, setEditPanel] =
    useState(null);

  const [showMetaModal, setShowMetaModal] =
    useState(false);

  const [deleteConfirm, setDeleteConfirm] =
    useState(null);


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const token =
      localStorage.getItem(
        'dhuaa_admin_token'
      );

    if (!token) {
      navigate('/admin');
      return;
    }

    loadAll();
  }, []);


  async function loadAll() {
    setLoading(true);

    await Promise.all([
      loadComic(),
      loadAnalytics(),
    ]);

    setLoading(false);
  }


  async function loadComic() {
    try {
      const res = await adminGetComic();

      setComic(res.data);

      setPanels(
        [...(res.data.panels || [])].sort(
          (a, b) =>
            a.panelNumber - b.panelNumber
        )
      );
    } catch (err) {
      if (
        err.response?.status === 401
      ) {
        navigate('/admin');
      }
    }
  }


  async function loadAnalytics() {
    try {
      const res =
        await fetchAnalytics();

      setAnalytics(res.data);
    } catch {
      setAnalytics(null);
    }
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {
    localStorage.removeItem(
      'dhuaa_admin_token'
    );

    navigate('/admin');
  }


  // ==========================================================
  // ADD PANEL
  // ==========================================================

  async function handleAddPanel(formData) {
    setSaving(true);

    try {
      await adminAddPanel(formData);

      success(
        'नया पेज जोड़ा गया ✓'
      );

      setShowAddModal(false);

      await loadComic();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Upload failed'
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // EDIT PANEL
  // ==========================================================

  async function handleEditPanel(
    formData,
    panelNumber
  ) {
    setSaving(true);

    try {
      await adminUpdatePanel(
        panelNumber,
        formData
      );

      success(
        'पेज अपडेट हो गया ✓'
      );

      setEditPanel(null);

      await loadComic();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Update failed'
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // DELETE PANEL
  // ==========================================================

  async function handleDelete(
    panelNumber
  ) {
    setSaving(true);

    try {
      await adminDeletePanel(
        panelNumber
      );

      success(
        'पेज हटा दिया गया ✓'
      );

      setDeleteConfirm(null);

      await loadComic();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Delete failed'
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // SAVE META
  // ==========================================================

  async function handleSaveMeta(data) {
    setSaving(true);

    try {
      await adminUpdateMeta(data);

      success(
        'Details saved ✓'
      );

      setShowMetaModal(false);

      await loadComic();
    } catch {
      toastError(
        'Save failed'
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // MOVE PANEL
  // ==========================================================

  function movePanel(
    index,
    direction
  ) {
    const arr = [...panels];

    const swapIdx =
      direction === 'up'
        ? index - 1
        : index + 1;

    if (
      swapIdx < 0 ||
      swapIdx >= arr.length
    ) {
      return;
    }

    [
      arr[index],
      arr[swapIdx],
    ] = [
      arr[swapIdx],
      arr[index],
    ];

    const reordered =
      arr.map((p, i) => ({
        ...p,
        panelNumber: i + 1,
      }));

    setPanels(reordered);


    fetch(
      '/api/admin/panels/reorder',
      {
        method: 'PUT',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${localStorage.getItem(
              'dhuaa_admin_token'
            )}`,
        },

        body: JSON.stringify({
          order:
            reordered.map((p) => ({
              panelNumber:
                p.panelNumber,

              newPanelNumber:
                p.panelNumber,

              newPageNumber:
                p.pageNumber,
            })),
        }),
      }
    ).catch(() =>
      toastError(
        'Reorder save failed'
      )
    );
  }


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-gradient-to-br
          from-slate-50
          via-white
          to-orange-50
          flex
          items-center
          justify-center
          relative
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            -top-40
            -right-40
            w-96
            h-96
            bg-orange-200/30
            rounded-full
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-40
            -left-40
            w-96
            h-96
            bg-violet-200/20
            rounded-full
            blur-3xl
          "
        />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="
            relative
            flex
            flex-col
            items-center
            gap-5
          "
        >

          <div
            className="
              w-16
              h-16
              rounded-3xl
              bg-gradient-to-br
              from-orange-500
              to-amber-500
              flex
              items-center
              justify-center
              shadow-xl
              shadow-orange-200
              ring-8
              ring-orange-50
            "
          >
            <BookOpen
              size={26}
              className="text-white"
            />
          </div>

          <div className="text-center">

            <p className="text-gray-800 font-black text-lg">
              धुआँ
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Loading your studio...
            </p>

          </div>

          <div
            className="
              w-40
              h-1.5
              bg-gray-100
              rounded-full
              overflow-hidden
            "
          >
            <motion.div
              initial={{
                x: '-100%',
              }}
              animate={{
                x: '100%',
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: 'easeInOut',
              }}
              className="
                w-1/2
                h-full
                bg-gradient-to-r
                from-orange-400
                to-amber-400
                rounded-full
              "
            />
          </div>

        </motion.div>
      </div>
    );
  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#f8fafc]
        relative
        overflow-hidden
      "
    >

      {/* ======================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div
        className="
          fixed
          -top-40
          -right-40
          w-96
          h-96
          bg-orange-300/20
          rounded-full
          blur-3xl
          pointer-events-none
        "
      />

      <div
        className="
          fixed
          top-1/2
          -left-40
          w-96
          h-96
          bg-violet-300/10
          rounded-full
          blur-3xl
          pointer-events-none
        "
      />

      <div
        className="
          fixed
          bottom-0
          right-1/4
          w-80
          h-80
          bg-amber-300/10
          rounded-full
          blur-3xl
          pointer-events-none
        "
      />


      <Toast toasts={toasts} />


      {/* ======================================================
          SIDEBAR + MAIN
      ====================================================== */}

      <div className="flex min-h-screen">


        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className="
            hidden
            md:flex
            w-72
            flex-shrink-0
            flex-col
            bg-white/90
            backdrop-blur-xl
            border-r
            border-gray-200
            shadow-[8px_0_40px_rgba(15,23,42,0.04)]
            relative
            z-40
          "
        >

          {/* LOGO */}
          <div
            className="
              px-6
              py-7
              border-b
              border-gray-100
              relative
              overflow-hidden
            "
          >

            <div
              className="
                absolute
                -top-10
                -right-10
                w-28
                h-28
                rounded-full
                bg-orange-100/70
                blur-2xl
              "
            />

            <div className="relative flex items-center gap-3">

              <div
                className="
                  w-12
                  h-12
                  bg-gradient-to-br
                  from-orange-500
                  via-orange-500
                  to-amber-400
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  shadow-xl
                  shadow-orange-200
                  ring-4
                  ring-orange-50
                "
              >
                <BookOpen
                  size={21}
                  className="text-white"
                />
              </div>

              <div>

                <h1
                  className="
                    font-black
                    text-gray-900
                    text-xl
                    leading-none
                    hindi-text
                    tracking-tight
                  "
                >
                  धुआँ
                </h1>

                <p
                  className="
                    text-orange-500
                    text-xs
                    mt-1
                    font-black
                    tracking-[0.15em]
                  "
                >
                  COMIC STUDIO
                </p>

              </div>
            </div>
          </div>


          {/* NAVIGATION */}
          <nav
            className="
              flex-1
              px-4
              py-7
              flex
              flex-col
              gap-1.5
            "
          >

            <div
              className="
                text-gray-400
                text-[10px]
                font-black
                uppercase
                tracking-[0.18em]
                px-3
                mb-3
              "
            >
              Workspace
            </div>


            {[
              {
                icon: LayoutGrid,
                label: 'All Pages',
                active: true,
              },

              {
                icon: TrendingUp,
                label: 'Analytics',
                active: false,
              },

              {
                icon: Edit3,
                label: 'Comic Details',
                active: false,
                onClick: () =>
                  setShowMetaModal(true),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`
                  flex
                  items-center
                  gap-3
                  px-3
                  py-3
                  rounded-2xl
                  text-sm
                  font-bold
                  transition-all
                  duration-200
                  w-full
                  text-left
                  group
                  ${
                    item.active
                      ? `
                        bg-gradient-to-r
                        from-orange-500
                        to-amber-500
                        text-white
                        shadow-lg
                        shadow-orange-200
                        ring-1
                        ring-orange-400/20
                      `
                      : `
                        text-gray-500
                        hover:bg-orange-50
                        hover:text-orange-600
                      `
                  }
                `}
              >

                <div
                  className={`
                    w-8
                    h-8
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    ${
                      item.active
                        ? 'bg-white/15'
                        : 'bg-gray-50 group-hover:bg-white'
                    }
                  `}
                >
                  <item.icon
                    size={16}
                    className={
                      item.active
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-orange-500'
                    }
                  />
                </div>

                {item.label}

                {item.active && (
                  <ArrowUpRight
                    size={13}
                    className="
                      ml-auto
                      text-white/60
                    "
                  />
                )}

              </button>
            ))}
          </nav>


          {/* SIDEBAR FOOTER */}
          <div
            className="
              px-4
              py-5
              border-t
              border-gray-100
              space-y-2
            "
          >

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="
                flex
                items-center
                gap-3
                px-3
                py-3
                rounded-2xl
                text-sm
                font-bold
                text-gray-500
                hover:bg-gray-50
                hover:text-gray-700
                transition-all
              "
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-xl
                  bg-gray-50
                  flex
                  items-center
                  justify-center
                "
              >
                <Eye size={15} />
              </div>

              Preview Comic

              <ArrowUpRight
                size={13}
                className="ml-auto text-gray-300"
              />
            </a>


            <button
              onClick={logout}
              className="
                flex
                items-center
                gap-3
                px-3
                py-3
                rounded-2xl
                text-sm
                font-bold
                text-red-400
                hover:bg-red-50
                hover:text-red-500
                transition-all
                w-full
                text-left
              "
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-xl
                  bg-red-50
                  flex
                  items-center
                  justify-center
                "
              >
                <LogOut size={15} />
              </div>

              Sign Out

            </button>
          </div>
        </aside>


        {/* ====================================================
            MAIN
        ==================================================== */}

        <main
          className="
            flex-1
            flex
            flex-col
            min-w-0
            relative
            z-10
          "
        >

          {/* ==================================================
              TOP BAR
          ================================================== */}

          <header
            className="
              bg-white/85
              backdrop-blur-xl
              border-b
              border-gray-200/80
              px-4
              sm:px-6
              py-4
              flex
              items-center
              justify-between
              sticky
              top-0
              z-30
              shadow-sm
            "
          >

            <div>

              <div className="flex items-center gap-2">

                <h2
                  className="
                    font-black
                    text-gray-900
                    text-xl
                    tracking-tight
                  "
                >
                  Writer's Dashboard
                </h2>

                <Sparkles
                  size={16}
                  className="
                    text-amber-400
                    hidden
                    sm:block
                  "
                />

              </div>

              <p
                className="
                  text-gray-400
                  text-xs
                  mt-1
                  hidden
                  sm:block
                "
              >
                Welcome back,
                <span className="text-orange-500 font-bold">
                  {' '}Karan
                </span>
                <span className="ml-1">
                  👋
                </span>
              </p>

            </div>


            <div className="flex items-center gap-2">

              {/* REFRESH */}
              <button
                onClick={loadAll}
                className="
                  p-2.5
                  text-gray-400
                  hover:text-gray-700
                  hover:bg-gray-100
                  rounded-xl
                  transition-all
                  border
                  border-transparent
                  hover:border-gray-200
                "
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>


              {/* ADD PAGE */}
              <motion.button
                whileTap={{
                  scale: 0.97,
                }}
                whileHover={{
                  y: -1,
                }}
                onClick={() =>
                  setShowAddModal(true)
                }
                className="
                  relative
                  overflow-hidden
                  flex
                  items-center
                  gap-2
                  bg-gradient-to-r
                  from-orange-500
                  via-orange-500
                  to-amber-500
                  hover:from-orange-600
                  hover:via-orange-600
                  hover:to-amber-600
                  text-white
                  font-black
                  text-sm
                  px-4
                  sm:px-5
                  py-3
                  rounded-2xl
                  shadow-lg
                  shadow-orange-200
                  hover:shadow-xl
                  hover:shadow-orange-300
                  transition-all
                  ring-1
                  ring-orange-400/30
                "
              >

                <Plus size={15} />

                <span className="hidden sm:inline">
                  नया पेज
                </span>

                <span className="sm:hidden">
                  Add
                </span>

              </motion.button>


              {/* MOBILE LOGOUT */}
              <button
                onClick={logout}
                className="
                  md:hidden
                  p-2.5
                  text-gray-400
                  hover:text-red-500
                  hover:bg-red-50
                  rounded-xl
                  transition-all
                "
              >
                <LogOut size={15} />
              </button>

            </div>
          </header>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div
            className="
              flex-1
              px-4
              sm:px-6
              py-6
              flex
              flex-col
              gap-6
              max-w-5xl
              w-full
            "
          >

            {/* =================================================
                PAGE TITLE
            ================================================= */}

            <div>

              <div className="flex items-center gap-2">

                <div
                  className="
                    w-1.5
                    h-7
                    rounded-full
                    bg-gradient-to-b
                    from-orange-500
                    to-amber-400
                  "
                />

                <div>

                  <h1
                    className="
                      text-gray-900
                      font-black
                      text-2xl
                      tracking-tight
                    "
                  >
                    Your Story
                  </h1>

                  <p
                    className="
                      text-gray-400
                      text-xs
                      mt-0.5
                    "
                  >
                    Manage your comic, pages and readers
                  </p>

                </div>
              </div>
            </div>


            {/* =================================================
                STATS
            ================================================= */}

            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-4
                gap-3
              "
            >

              <StatCard
                icon="📄"
                label="Total Pages"
                value={panels.length}
                theme="orange"
              />

              <StatCard
                icon="👥"
                label="Readers"
                value={
                  analytics?.totalReaders ??
                  '—'
                }
                theme="blue"
              />

              <StatCard
                icon="✓"
                label="Completion"
                value={
                  analytics
                    ? `${analytics.completionRate}%`
                    : '—'
                }
                theme="emerald"
              />

              <StatCard
                icon="⏱"
                label="Avg. Time"
                value={
                  analytics?.avgTimeFormatted ??
                  '—'
                }
                theme="violet"
              />

            </div>


            {/* =================================================
                COMIC INFO
            ================================================= */}

            {comic && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  relative
                  overflow-hidden
                  bg-gradient-to-br
                  from-white
                  via-white
                  to-orange-50/50
                  rounded-3xl
                  border
                  border-orange-100
                  shadow-lg
                  shadow-gray-100
                  p-5
                  flex
                  items-start
                  gap-4
                  hover:shadow-xl
                  hover:shadow-orange-100/40
                  transition-all
                  duration-300
                "
              >

                {/* Top accent */}
                <div
                  className="
                    absolute
                    top-0
                    left-0
                    right-0
                    h-1
                    bg-gradient-to-r
                    from-orange-400
                    via-amber-400
                    to-violet-400
                  "
                />

                {/* Cover */}
                <div
                  className="
                    w-20
                    h-24
                    rounded-2xl
                    overflow-hidden
                    bg-gradient-to-br
                    from-orange-50
                    to-amber-50
                    flex-shrink-0
                    border
                    border-orange-100
                    shadow-md
                    ring-4
                    ring-orange-50
                  "
                >

                  {comic.coverImage ? (
                    <img
                      src={comic.coverImage}
                      alt=""
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-full
                        h-full
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <BookOpen
                        size={20}
                        className="text-orange-300"
                      />
                    </div>
                  )}

                </div>


                {/* Info */}
                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >

                    <div>

                      <div className="flex items-center gap-2">

                        <span
                          className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            font-black
                            text-orange-500
                          "
                        >
                          Your Comic
                        </span>

                        <Sparkles
                          size={12}
                          className="text-amber-400"
                        />

                      </div>

                      <h3
                        className="
                          hindi-text
                          text-gray-900
                          font-black
                          text-lg
                          leading-tight
                          mt-1
                        "
                      >
                        {comic.title}
                      </h3>

                      <p
                        className="
                          hindi-text
                          text-gray-400
                          text-xs
                          leading-relaxed
                          mt-1.5
                          line-clamp-2
                        "
                      >
                        {comic.description}
                      </p>

                    </div>


                    <button
                      onClick={() =>
                        setShowMetaModal(true)
                      }
                      className="
                        flex-shrink-0
                        flex
                        items-center
                        gap-1.5
                        bg-gray-100
                        hover:bg-violet-50
                        hover:text-violet-600
                        text-gray-500
                        text-xs
                        px-3
                        py-2
                        rounded-xl
                        transition-all
                        font-bold
                        border
                        border-gray-200
                        hover:border-violet-200
                      "
                    >
                      <Edit3 size={11} />
                      <span className="hidden sm:inline">
                        Edit
                      </span>
                    </button>

                  </div>


                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      mt-4
                      flex-wrap
                    "
                  >

                    <span
                      className="
                        flex
                        items-center
                        gap-1.5
                        bg-orange-50
                        text-orange-600
                        text-xs
                        font-bold
                        px-2.5
                        py-1.5
                        rounded-full
                        border
                        border-orange-100
                      "
                    >
                      <Star size={10} />
                      {panels.length} pages
                    </span>

                    <span
                      className="
                        text-gray-300
                        text-xs
                      "
                    >
                      •
                    </span>

                    <span
                      className="
                        text-gray-400
                        text-xs
                      "
                    >
                      Updated{' '}
                      {comic.updatedAt
                        ? new Date(
                            comic.updatedAt
                          ).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : '—'}
                    </span>

                  </div>
                </div>
              </motion.div>
            )}


            {/* =================================================
                PAGES SECTION
            ================================================= */}

            <div>

              {/* Section heading */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      rounded-2xl
                      bg-gradient-to-br
                      from-orange-500
                      to-amber-500
                      flex
                      items-center
                      justify-center
                      shadow-md
                      shadow-orange-200
                    "
                  >
                    <LayoutGrid
                      size={17}
                      className="text-white"
                    />
                  </div>

                  <div>

                    <div className="flex items-center gap-2">

                      <h3
                        className="
                          text-gray-900
                          font-black
                          text-base
                        "
                      >
                        Comic Pages
                      </h3>

                      <span
                        className="
                          bg-orange-100
                          text-orange-600
                          text-xs
                          font-black
                          px-2
                          py-0.5
                          rounded-full
                          border
                          border-orange-200
                        "
                      >
                        {panels.length}
                      </span>

                    </div>

                    <p
                      className="
                        text-gray-400
                        text-[11px]
                        mt-0.5
                      "
                    >
                      Manage your story panels
                    </p>

                  </div>
                </div>


                <p
                  className="
                    text-gray-400
                    text-xs
                    hidden
                    sm:block
                  "
                >
                  Hover a card to edit or delete
                </p>

              </div>


              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {panels.length === 0 ? (

                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="
                    bg-white
                    rounded-3xl
                    border-2
                    border-dashed
                    border-orange-200
                    py-20
                    flex
                    flex-col
                    items-center
                    gap-5
                    text-center
                    px-6
                    shadow-sm
                  "
                >

                  <div
                    className="
                      w-20
                      h-20
                      bg-gradient-to-br
                      from-orange-50
                      to-amber-50
                      rounded-3xl
                      flex
                      items-center
                      justify-center
                      border
                      border-orange-100
                      shadow-sm
                    "
                  >
                    <ImagePlus
                      size={32}
                      className="text-orange-300"
                    />
                  </div>

                  <div>

                    <p
                      className="
                        text-gray-800
                        font-black
                        text-base
                      "
                    >
                      No pages yet
                    </p>

                    <p
                      className="
                        text-gray-400
                        text-sm
                        mt-1
                      "
                    >
                      Add your first comic page to get started
                    </p>

                  </div>

                  <motion.button
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    onClick={() =>
                      setShowAddModal(true)
                    }
                    className="
                      bg-gradient-to-r
                      from-orange-500
                      to-amber-500
                      text-white
                      font-black
                      px-6
                      py-3.5
                      rounded-2xl
                      text-sm
                      shadow-lg
                      shadow-orange-200
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Plus size={15} />
                    Add First Page
                  </motion.button>

                </motion.div>

              ) : (

                <div className="flex flex-col gap-2.5">

                  <AnimatePresence>
                    {panels.map(
                      (panel, idx) => (
                        <PanelCard
                          key={
                            panel._id ||
                            panel.panelNumber
                          }
                          panel={panel}
                          index={idx}
                          total={
                            panels.length
                          }
                          onEdit={
                            setEditPanel
                          }
                          onDelete={
                            setDeleteConfirm
                          }
                          onMoveUp={(i) =>
                            movePanel(
                              i,
                              'up'
                            )
                          }
                          onMoveDown={(i) =>
                            movePanel(
                              i,
                              'down'
                            )
                          }
                        />
                      )
                    )}
                  </AnimatePresence>


                  {/* ADD NEXT PAGE */}
                  <motion.button
                    whileHover={{
                      scale: 1.01,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.99,
                    }}
                    onClick={() =>
                      setShowAddModal(true)
                    }
                    className="
                      mt-2
                      w-full
                      relative
                      overflow-hidden
                      bg-gradient-to-r
                      from-orange-50
                      via-amber-50
                      to-orange-50
                      hover:from-orange-100
                      hover:via-amber-100
                      hover:to-orange-100
                      border-2
                      border-dashed
                      border-orange-300
                      hover:border-orange-400
                      text-orange-600
                      font-bold
                      py-5
                      rounded-3xl
                      text-sm
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                      duration-300
                      shadow-sm
                      hover:shadow-lg
                      hover:shadow-orange-100
                    "
                  >

                    <span
                      className="
                        w-9
                        h-9
                        rounded-xl
                        bg-gradient-to-br
                        from-orange-500
                        to-amber-500
                        flex
                        items-center
                        justify-center
                        text-white
                        shadow-md
                      "
                    >
                      <Plus size={16} />
                    </span>

                    अगला पेज जोड़ें

                  </motion.button>

                </div>
              )}
            </div>
          </div>
        </main>
      </div>


      {/* ======================================================
          MODALS
      ====================================================== */}

      <AnimatePresence>

        {showAddModal && (
          <PanelModal
            panel={null}
            onClose={() =>
              setShowAddModal(false)
            }
            onSave={handleAddPanel}
            loading={saving}
          />
        )}

      </AnimatePresence>


      <AnimatePresence>

        {editPanel && (
          <PanelModal
            panel={editPanel}
            onClose={() =>
              setEditPanel(null)
            }
            onSave={handleEditPanel}
            loading={saving}
          />
        )}

      </AnimatePresence>


      <AnimatePresence>

        {showMetaModal &&
          comic && (
            <MetaModal
              comic={comic}
              onClose={() =>
                setShowMetaModal(false)
              }
              onSave={handleSaveMeta}
              loading={saving}
            />
          )}

      </AnimatePresence>


      {/* ======================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <AnimatePresence>

        {deleteConfirm && (
          <DeleteModal
            panelNumber={
              deleteConfirm
            }
            onClose={() =>
              setDeleteConfirm(null)
            }
            onDelete={handleDelete}
            loading={saving}
          />
        )}

      </AnimatePresence>

    </div>
  );
}