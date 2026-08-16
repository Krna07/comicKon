const express = require('express');
const router = express.Router();
const ReaderSession = require('../models/ReaderSession');

// GET /api/analytics/summary — reader metrics
router.get('/summary', async (req, res) => {
  try {
    const totalReaders = await ReaderSession.countDocuments();
    const completedReaders = await ReaderSession.countDocuments({ completed: true });
    const completionRate =
      totalReaders > 0 ? Math.round((completedReaders / totalReaders) * 100) : 0;

    // Average time spent (only sessions with time > 0)
    const avgTimeResult = await ReaderSession.aggregate([
      { $match: { timeSpentSeconds: { $gt: 0 } } },
      { $group: { _id: null, avgTime: { $avg: '$timeSpentSeconds' } } }
    ]);
    const avgTimeSeconds =
      avgTimeResult.length > 0 ? Math.round(avgTimeResult[0].avgTime) : 0;

    // Most read page
    const mostReadPage = await ReaderSession.aggregate([
      { $unwind: '$pagesRead' },
      { $group: { _id: '$pagesRead', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Active readers in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReaders = await ReaderSession.countDocuments({
      lastActiveAt: { $gte: oneDayAgo }
    });

    res.json({
      totalReaders,
      completedReaders,
      completionRate,
      avgTimeSeconds,
      avgTimeFormatted: formatSeconds(avgTimeSeconds),
      mostReadPage: mostReadPage[0]?._id || 1,
      recentReaders
    });
  } catch (err) {
    console.error('GET /api/analytics/summary error:', err);
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
