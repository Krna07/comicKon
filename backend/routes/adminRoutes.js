const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const ComicBook = require('../models/Comic');
const { adminAuth } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dhuaa_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ── Multer config: save uploads to /public/panels ──────────────
const panelsDir = path.join(__dirname, '../../public/panels');
if (!fs.existsSync(panelsDir)) fs.mkdirSync(panelsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, panelsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `panel_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
    }
  }
});

// ── POST /api/admin/login ───────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME || 'karan';
  const validPassword = process.env.ADMIN_PASSWORD || 'Bihar@1234';

  if (!username || !password || username !== validUsername || password !== validPassword) {
    return res.status(401).json({ message: 'गलत यूज़रनेम या पासवर्ड' });
  }

  const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, message: 'Login successful' });
});

// ── GET /api/admin/comic ── get full comic with all panels ──────
router.get('/comic', adminAuth, async (req, res) => {
  try {
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found' });
    const sorted = { ...comic.toObject(), panels: [...comic.panels].sort((a, b) => a.panelNumber - b.panelNumber) };
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/comic/meta ── update title/description ───────
router.put('/comic/meta', adminAuth, async (req, res) => {
  try {
    const { title, description, totalPages } = req.body;
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found' });
    if (title)       comic.title = title;
    if (description) comic.description = description;
    if (totalPages)  comic.totalPages = totalPages;
    await comic.save();
    res.json({ message: 'Comic metadata updated', comic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/admin/panels ── upload image + add new panel ──────
router.post('/panels', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const { captionHindi, pageNumber, size } = req.body;
    const imageUrl = `/panels/${req.file.filename}`;

    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'No comic found. Create one first.' });

    // Auto-assign panelNumber
    const maxPanel = comic.panels.reduce((m, p) => Math.max(m, p.panelNumber), 0);
    const newPanel = {
      panelNumber:  maxPanel + 1,
      pageNumber:   parseInt(pageNumber) || (maxPanel + 1),
      imageUrl,
      size:         size || 'wide',
      captionHindi: captionHindi || '',
      dialogues:    []
    };

    comic.panels.push(newPanel);
    comic.totalPages = Math.max(comic.totalPages, newPanel.pageNumber);
    await comic.save();

    res.status(201).json({ message: 'Panel added', panel: newPanel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/panels/:panelNumber ── edit caption/page ─────
router.put('/panels/:panelNumber', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const pNum = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const panel = comic.panels.find(p => p.panelNumber === pNum);
    if (!panel) return res.status(404).json({ message: `Panel ${pNum} not found` });

    const { captionHindi, pageNumber, size } = req.body;
    if (captionHindi !== undefined) panel.captionHindi = captionHindi;
    if (pageNumber   !== undefined) panel.pageNumber   = parseInt(pageNumber);
    if (size         !== undefined) panel.size         = size;

    // Replace image if new one uploaded
    if (req.file) {
      // Delete old file if it's a local upload
      if (panel.imageUrl.startsWith('/panels/panel_')) {
        const oldPath = path.join(panelsDir, path.basename(panel.imageUrl));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      panel.imageUrl = `/panels/${req.file.filename}`;
    }

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();
    res.json({ message: 'Panel updated', panel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/admin/panels/:panelNumber ── remove a panel ─────
router.delete('/panels/:panelNumber', adminAuth, async (req, res) => {
  try {
    const pNum = parseInt(req.params.panelNumber);
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    const idx = comic.panels.findIndex(p => p.panelNumber === pNum);
    if (idx === -1) return res.status(404).json({ message: `Panel ${pNum} not found` });

    const [removed] = comic.panels.splice(idx, 1);

    // Delete the uploaded file if it's a local one
    if (removed.imageUrl.startsWith('/panels/panel_')) {
      const filePath = path.join(panelsDir, path.basename(removed.imageUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    comic.totalPages = comic.panels.length > 0
      ? Math.max(...comic.panels.map(p => p.pageNumber))
      : 0;
    await comic.save();
    res.json({ message: `Panel ${pNum} deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/panels/reorder ── reorder panel numbers ──────
router.put('/panels/reorder', adminAuth, async (req, res) => {
  try {
    // body: { order: [{ panelNumber, newPanelNumber, newPageNumber }] }
    const { order } = req.body;
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) return res.status(404).json({ message: 'Comic not found' });

    order.forEach(({ panelNumber, newPanelNumber, newPageNumber }) => {
      const panel = comic.panels.find(p => p.panelNumber === panelNumber);
      if (panel) {
        panel.panelNumber = newPanelNumber;
        panel.pageNumber  = newPageNumber;
      }
    });

    comic.totalPages = Math.max(...comic.panels.map(p => p.pageNumber));
    await comic.save();
    res.json({ message: 'Panels reordered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
