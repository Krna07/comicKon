const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');
const ComicBook   = require('../models/Comic');
const { adminAuth } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dhuaa_secret';

// ── Storage ─────────────────────────────────────────────────────
let upload, getUploadedUrl;

if (process.env.CLOUDINARY_URL) {
  const { storage } = require('../config/cloudinary');
  upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
  getUploadedUrl = (req) => req.file?.path || null;
} else {
  const panelsDir = path.join(__dirname, '../../public/panels');
  if (!fs.existsSync(panelsDir)) fs.mkdirSync(panelsDir, { recursive: true });
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, panelsDir),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `panel_${Date.now()}${ext}`);
    },
  });
  upload = multer({ storage: diskStorage, limits: { fileSize: 20 * 1024 * 1024 } });
  getUploadedUrl = (req) => req.file ? `/panels/${req.file.filename}` : null;
}

// ── Login ────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== (process.env.ADMIN_USERNAME || 'karan') ||
      password !== (process.env.ADMIN_PASSWORD || 'Bihar@1234')) {
    return res.status(401).json({ message: 'गलत यूज़रनेम या पासवर्ड' });
  }
  const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// ── GET all episodes (admin — includes drafts) ───────────────────
router.get('/episodes', adminAuth, async (req, res) => {
  try {
    const episodes = await ComicBook.find()
      .sort({ episodeNumber: 1 })
      .select('_id title episodeNumber episodeTitle description coverImage totalPages published createdAt updatedAt');
    res.json(episodes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST create new episode ──────────────────────────────────────
router.post('/episodes', adminAuth, async (req, res) => {
  try {
    const { title, episodeNumber, episodeTitle, description } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });

    // Auto-assign episode number if not provided
    const maxEp = await ComicBook.findOne().sort({ episodeNumber: -1 }).select('episodeNumber');
    const epNum = parseInt(episodeNumber) || ((maxEp?.episodeNumber || 0) + 1);

    const episode = await ComicBook.create({
      title,
      episodeNumber: epNum,
      episodeTitle:  episodeTitle || '',
      description:   description  || '',
      totalPages:    0,
      published:     false,
      panels:        [],
    });

    res.status(201).json({ message: 'Episode created', episode });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET single episode (admin) ───────────────────────────────────
router.get('/episodes/:id', adminAuth, async (req, res) => {
  try {
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });
    const sorted = { ...comic.toObject(), panels: [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber) };
    res.json(sorted);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT update episode meta ──────────────────────────────────────
router.put('/episodes/:id/meta', adminAuth, async (req, res) => {
  try {
    const { title, episodeTitle, description, episodeNumber } = req.body;
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

    if (title         !== undefined) comic.title         = title;
    if (episodeTitle  !== undefined) comic.episodeTitle  = episodeTitle;
    if (description   !== undefined) comic.description   = description;
    if (episodeNumber !== undefined) comic.episodeNumber = parseInt(episodeNumber);
    await comic.save();
    res.json({ message: 'Updated', comic });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT publish / unpublish ──────────────────────────────────────
router.put('/episodes/:id/publish', adminAuth, async (req, res) => {
  try {
    const { published } = req.body;
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

    comic.published = !!published;
    await comic.save();
    res.json({ message: comic.published ? 'Published ✓' : 'Unpublished', published: comic.published });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE episode ───────────────────────────────────────────────
router.delete('/episodes/:id', adminAuth, async (req, res) => {
  try {
    await ComicBook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Episode deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST add panel to episode ────────────────────────────────────
router.post('/episodes/:id/panels', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const imageUrl = getUploadedUrl(req);
    const { captionHindi, pageNumber, size } = req.body;
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

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

// ── PUT update panel ─────────────────────────────────────────────
router.put('/episodes/:id/panels/:panelNumber', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const pNum  = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

    const panel = comic.panels.find(p => p.panelNumber === pNum);
    if (!panel) return res.status(404).json({ message: `Panel ${pNum} not found` });

    const { captionHindi, pageNumber, size } = req.body;
    if (captionHindi !== undefined) panel.captionHindi = captionHindi;
    if (pageNumber   !== undefined) panel.pageNumber   = parseInt(pageNumber);
    if (size         !== undefined) panel.size         = size;
    if (req.file) panel.imageUrl = getUploadedUrl(req);

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();
    res.json({ message: 'Panel updated', panel });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE panel ─────────────────────────────────────────────────
router.delete('/episodes/:id/panels/:panelNumber', adminAuth, async (req, res) => {
  try {
    const pNum  = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

    const idx = comic.panels.findIndex(p => p.panelNumber === pNum);
    if (idx === -1) return res.status(404).json({ message: `Panel ${pNum} not found` });

    comic.panels.splice(idx, 1);
    comic.totalPages = comic.panels.length > 0 ? Math.max(...comic.panels.map(p => p.pageNumber)) : 0;
    await comic.save();
    res.json({ message: `Panel ${pNum} deleted` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT reorder panels ────────────────────────────────────────────
router.put('/episodes/:id/panels/reorder', adminAuth, async (req, res) => {
  try {
    const { pages } = req.body;
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });

    pages.forEach(({ panelNumber, pageNumber }) => {
      const panel = comic.panels.find(p => p.panelNumber === panelNumber);
      if (panel && pageNumber != null) panel.pageNumber = parseInt(pageNumber);
    });

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();
    res.json({ message: 'Reordered', panels: [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Legacy routes (backwards compat with old single-comic endpoints) ──
router.get('/comic', adminAuth, async (req, res) => {
  const comic = await ComicBook.findOne().sort({ createdAt: -1 });
  if (!comic) return res.status(404).json({ message: 'No comic found' });
  res.json({ ...comic.toObject(), panels: [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber) });
});

module.exports = router;
