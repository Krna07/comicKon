const express = require('express');
const router = express.Router();
const ReaderSession = require('../models/ReaderSession');

// POST /api/sessions/start — initialize or retrieve session, attach reader name
router.post('/start', async (req, res) => {
  try {
    const { sessionId, readerName } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || '';

    let session = await ReaderSession.findOne({ sessionId });

    if (!session) {
      session = await ReaderSession.create({
        sessionId,
        readerName: readerName || '',
        ipAddress,
        userAgent,
        pagesRead: [1],
        maxPageReached: 1,
        firstVisitedAt: new Date(),
        lastActiveAt: new Date()
      });
    } else {
      session.lastActiveAt = new Date();
      session.ipAddress = ipAddress;
      // Update name if provided and not set yet
      if (readerName && !session.readerName) session.readerName = readerName;
      await session.save();
    }

    res.status(200).json(session);
  } catch (err) {
    console.error('POST /api/sessions/start error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/sessions/progress — update reading progress
router.put('/progress', async (req, res) => {
  try {
    const { sessionId, pageNumber, timeSpentSeconds, totalPages } = req.body;

    if (!sessionId || pageNumber == null) {
      return res.status(400).json({ message: 'sessionId and pageNumber are required' });
    }

    const session = await ReaderSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.pagesRead.includes(pageNumber)) {
      session.pagesRead.push(pageNumber);
    }
    if (pageNumber > session.maxPageReached) {
      session.maxPageReached = pageNumber;
    }
    if (timeSpentSeconds != null && timeSpentSeconds > session.timeSpentSeconds) {
      session.timeSpentSeconds = timeSpentSeconds;
    }
    if (totalPages && pageNumber >= totalPages) {
      session.completed = true;
    }

    session.lastActiveAt = new Date();
    await session.save();

    res.json(session);
  } catch (err) {
    console.error('PUT /api/sessions/progress error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/sessions/rate — submit a rating (1-10)
router.put('/rate', async (req, res) => {
  try {
    const { sessionId, rating, readerName } = req.body;

    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
    if (rating == null || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'rating must be between 1 and 10' });
    }

    let session = await ReaderSession.findOne({ sessionId });

    if (!session) {
      // Session may not exist if startSession failed silently — create it now
      session = await ReaderSession.create({
        sessionId,
        readerName: readerName || '',
        rating:    parseInt(rating),
        ratedAt:   new Date(),
        pagesRead: [],
        maxPageReached: 1,
        firstVisitedAt: new Date(),
        lastActiveAt:   new Date(),
      });
    } else {
      session.rating  = parseInt(rating);
      session.ratedAt = new Date();
      // Attach name if it wasn't stored yet
      if (readerName && !session.readerName) session.readerName = readerName;
      await session.save();
    }

    res.json({ message: 'Rating saved', rating: session.rating });
  } catch (err) {
    console.error('PUT /api/sessions/rate error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
