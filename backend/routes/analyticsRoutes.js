const express = require('express');
const router = express.Router();
const ReaderSession = require('../models/ReaderSession');
const { adminAuth } = require('../middleware/authMiddleware');

// GET /api/analytics/summary — reader metrics (public enough for the reader stats button)
router.get('/summary', async (req, res) => {
  try {
    const totalReaders = await ReaderSession.countDocuments();
    const completedReaders = await ReaderSession.countDocuments({ completed: true });
    const completionRate =
      totalReaders > 0 ? Math.round((completedReaders / totalReaders) * 100) : 0;

    const avgTimeResult = await ReaderSession.aggregate([
      { $match: { timeSpentSeconds: { $gt: 0 } } },
      { $group: { _id: null, avgTime: { $avg: '$timeSpentSeconds' } } }
    ]);
    const avgTimeSeconds =
      avgTimeResult.length > 0 ? Math.round(avgTimeResult[0].avgTime) : 0;

    const mostReadPage = await ReaderSession.aggregate([
      { $unwind: '$pagesRead' },
      { $group: { _id: '$pagesRead', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReaders = await ReaderSession.countDocuments({
      lastActiveAt: { $gte: oneDayAgo }
    });

    // Rating summary
    const ratingResult = await ReaderSession.aggregate([
      { $match: { rating: { $exists: true, $ne: null, $gte: 1 } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const avgRating = ratingResult.length > 0
      ? Math.round(ratingResult[0].avg * 10) / 10
      : null;
    const totalRatings = ratingResult.length > 0 ? ratingResult[0].count : 0;

    res.json({
      totalReaders,
      completedReaders,
      completionRate,
      avgTimeSeconds,
      avgTimeFormatted: formatSeconds(avgTimeSeconds),
      mostReadPage: mostReadPage[0]?._id || 1,
      recentReaders,
      avgRating,
      totalRatings,
    });
  } catch (err) {
    console.error('GET /api/analytics/summary error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/analytics/ratings — per-user ratings list (admin only)
router.get('/ratings', adminAuth, async (req, res) => {
  try {
    const ratings = await ReaderSession.find({
      rating: { $exists: true, $ne: null, $gte: 1 }
    })
      .sort({ ratedAt: -1 })
      .select('readerName rating ratedAt firstVisitedAt completed timeSpentSeconds')
      .lean();

    res.json(ratings.map(r => ({
      name:      r.readerName || 'Anonymous',
      rating:    r.rating,
      ratedAt:   r.ratedAt,
      completed: r.completed,
      readTime:  formatSeconds(r.timeSpentSeconds || 0),
    })));
  } catch (err) {
    console.error('GET /api/analytics/ratings error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

module.exports = router;
