const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');
const ComicBook   = require('../models/Comic');
const { adminAuth } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dhuaa_secret';

// ── Storage: Cloudinary if configured, local disk otherwise ────
let upload;
let getUploadedUrl;

if (process.env.CLOUDINARY_URL) {
  const { storage } = require('../config/cloudinary');
  upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
  // Cloudinary puts the permanent URL in req.file.path
  getUploadedUrl = (req) => req.file?.path || null;
} else {
  // Local dev fallback
  const panelsDir = path.join(__dirname, '../../public/panels');
  if (!fs.existsSync(panelsDir)) fs.mkdirSync(panelsDir, { recursive: true });

  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, panelsDir),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `panel_${Date.now()}${ext}`);
    },
  });
  upload = multer({
    storage: diskStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = ['.jpg','.jpeg','.png','.webp','.gif'];
      ok.includes(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Images only'));
    },
  });
  getUploadedUrl = (req) => req.file ? `/panels/${req.file.filename}` : null;
}

// ── POST /api/admin/login ───────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || 'karan';
  const validPass = process.env.ADMIN_PASSWORD || 'Bihar@1234';
  if (!username || !password || username !== validUser || password !== validPass) {
    return res.status(401).json({ message: 'गलत यूज़रनेम या पासवर्ड' });
  }
  const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, message: 'Login successful' });
});

// ── GET /api/admin/comic ────────────────────────────────────────
router.get('/comic', adminAuth, async (req, res) => {
  try {
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found' });
    const sorted = { ...comic.toObject(), panels: [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber) };
    res.json(sorted);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/admin/comic/meta ───────────────────────────────────
router.put('/comic/meta', adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found' });
    if (title)       comic.title       = title;
    if (description) comic.description = description;
    await comic.save();
    res.json({ message: 'Updated', comic });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/admin/panels ── add new panel ─────────────────────
router.post('/panels', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const imageUrl = getUploadedUrl(req);
    const { captionHindi, pageNumber, size } = req.body;

    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found. Run seed first.' });

    const maxPanel = comic.panels.reduce((m, p) => Math.max(m, p.panelNumber), 0);
    const newPanel = {
      panelNumber:  maxPanel + 1,
      pageNumber:   parseInt(pageNumber) || (maxPanel + 1),
      imageUrl,
      size:         size || 'wide',
      captionHindi: captionHindi || '',
      dialogues:    [],
    };

    comic.panels.push(newPanel);
    comic.totalPages = Math.max(comic.totalPages, newPanel.pageNumber);
    await comic.save();

    res.status(201).json({ message: 'Panel added', panel: newPanel });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/admin/panels/:panelNumber ── edit panel ────────────
router.put('/panels/:panelNumber', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const pNum  = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const panel = comic.panels.find(p => p.panelNumber === pNum);
    if (!panel) return res.status(404).json({ message: `Panel ${pNum} not found` });

    const { captionHindi, pageNumber, size } = req.body;
    if (captionHindi !== undefined) panel.captionHindi = captionHindi;
    if (pageNumber   !== undefined) panel.pageNumber   = parseInt(pageNumber);
    if (size         !== undefined) panel.size         = size;

    if (req.file) {
      panel.imageUrl = getUploadedUrl(req);
    }

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();
    res.json({ message: 'Panel updated', panel });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/admin/panels/:panelNumber ───────────────────────
router.delete('/panels/:panelNumber', adminAuth, async (req, res) => {
  try {
    const pNum  = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const idx = comic.panels.findIndex(p => p.panelNumber === pNum);
    if (idx === -1) return res.status(404).json({ message: `Panel ${pNum} not found` });

    comic.panels.splice(idx, 1);
    comic.totalPages = comic.panels.length > 0 ? Math.max(...comic.panels.map(p => p.pageNumber)) : 0;
    await comic.save();
    res.json({ message: `Panel ${pNum} deleted` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/admin/panels/reorder ───────────────────────────────
router.put('/panels/reorder', adminAuth, async (req, res) => {
  try {
    const { pages } = req.body;
    if (!Array.isArray(pages)) return res.status(400).json({ message: 'pages array required' });

    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    pages.forEach(({ panelNumber, pageNumber }) => {
      const panel = comic.panels.find(p => p.panelNumber === panelNumber);
      if (panel && pageNumber != null) panel.pageNumber = parseInt(pageNumber);
    });

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();

    const sorted = [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber);
    res.json({ message: 'Order saved', panels: sorted });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
