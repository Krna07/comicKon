const express = require('express');
const router = express.Router();
const ComicBook = require('../models/Comic');

// GET /api/comic — returns all panels ordered by panelNumber
router.get('/', async (req, res) => {
  try {
    const comic = await ComicBook.findOne().sort({ createdAt: -1 });
    if (!comic) {
      return res.status(404).json({ message: 'No comic found. Please run seed.js first.' });
    }

    // Sort panels by panelNumber ascending
    const sortedPanels = [...comic.panels].sort((a, b) => a.panelNumber - b.panelNumber);

    res.json({
      id: comic._id,
      title: comic.title,
      totalPages: comic.totalPages,
      coverImage: comic.coverImage,
      description: comic.description,
      panels: sortedPanels
    });
  } catch (err) {
    console.error('GET /api/comic error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
