const express = require('express');
const router = express.Router();
const ComicBook = require('../models/Comic');

// GET /api/comic/episodes — all published episodes (no panels, just metadata)
router.get('/episodes', async (req, res) => {
  try {
    const episodes = await ComicBook.find({ published: true })
      .sort({ episodeNumber: 1 })
      .select('_id title episodeNumber episodeTitle description coverImage totalPages createdAt');

    res.json(episodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/comic/:id — single episode with all panels (must be published)
router.get('/:id', async (req, res) => {
  try {
    const comic = await ComicBook.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Episode not found' });
    if (!comic.published) return res.status(403).json({ message: 'This episode is not published yet' });

    const sortedPanels = [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber);
    res.json({ ...comic.toObject(), panels: sortedPanels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/comic — legacy: returns latest published episode (backwards compat)
router.get('/', async (req, res) => {
  try {
    const comic = await ComicBook.findOne({ published: true }).sort({ episodeNumber: -1 });
    if (!comic) return res.status(404).json({ message: 'No published episodes yet.' });

    const sortedPanels = [...comic.panels].sort((a, b) => a.pageNumber - b.pageNumber);
    res.json({ ...comic.toObject(), panels: sortedPanels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
