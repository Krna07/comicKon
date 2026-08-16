const express = require('express');
const router = express.Router();
const ReaderSession = require('../models/ReaderSession');

// POST /api/sessions/start — initialize or retrieve anonymous session
router.post('/start', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    // Get IP address (handle proxies)
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const userAgent = req.headers['user-agent'] || '';

    // Upsert: create if not exists, else return existing
    let session = await ReaderSession.findOne({ sessionId });

    if (!session) {
      session = await ReaderSession.create({
        sessionId,
        ipAddress,
        userAgent,
        pagesRead: [1],
        maxPageReached: 1,
        firstVisitedAt: new Date(),
        lastActiveAt: new Date()
      });
    } else {
      // Update last active and IP (may have changed)
      session.lastActiveAt = new Date();
      session.ipAddress = ipAddress;
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

    // Add page to pagesRead if not already recorded
    if (!session.pagesRead.includes(pageNumber)) {
      session.pagesRead.push(pageNumber);
    }

    // Update max page reached
    if (pageNumber > session.maxPageReached) {
      session.maxPageReached = pageNumber;
    }

    // Update time spent
    if (timeSpentSeconds != null && timeSpentSeconds > session.timeSpentSeconds) {
      session.timeSpentSeconds = timeSpentSeconds;
    }

    // Check if completed (reached last page)
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

module.exports = router;
