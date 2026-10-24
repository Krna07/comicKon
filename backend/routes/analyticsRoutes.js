const express = require('express');
const router = express.Router();
const ReaderSession = require('../models/ReaderSession');
const ComicBook = require('../models/Comic');
const { adminAuth } = require('../middleware/authMiddleware');

// GET /api/analytics/summary — overall + episode-by-episode reader metrics
router.get('/summary', async (req, res) => {
  try {
    const totalReaders = await ReaderSession.countDocuments({ episodeId: { $exists: true, $ne: '' } });
    const completedReaders = await ReaderSession.countDocuments({ completed: true, episodeId: { $exists: true, $ne: '' } });
    const completionRate =
      totalReaders > 0 ? Math.round((completedReaders / totalReaders) * 100) : 0;

    const avgTimeResult = await ReaderSession.aggregate([
      { $match: { timeSpentSeconds: { $gt: 0 }, episodeId: { $exists: true, $ne: '' } } },
      { $group: { _id: null, avgTime: { $avg: '$timeSpentSeconds' } } }
    ]);
    const avgTimeSeconds =
      avgTimeResult.length > 0 ? Math.round(avgTimeResult[0].avgTime) : 0;

    const mostReadPage = await ReaderSession.aggregate([
      { $match: { episodeId: { $exists: true, $ne: '' } } },
      { $unwind: '$pagesRead' },
      { $group: { _id: '$pagesRead', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReaders = await ReaderSession.countDocuments({
      lastActiveAt: { $gte: oneDayAgo },
      episodeId: { $exists: true, $ne: '' }
    });

    const ratingResult = await ReaderSession.aggregate([
      { $match: { rating: { $exists: true, $ne: null, $gte: 1 }, episodeId: { $exists: true, $ne: '' } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const avgRating = ratingResult.length > 0
      ? Math.round(ratingResult[0].avg * 10) / 10
      : null;
    const totalRatings = ratingResult.length > 0 ? ratingResult[0].count : 0;

    const episodeStats = await ReaderSession.aggregate([
      { $match: { episodeId: { $exists: true, $ne: '' } } },
      { $group: {
          _id: '$episodeId',
          totalReaders: { $sum: 1 },
          completedReaders: { $sum: { $cond: ['$completed', 1, 0] } },
          avgRating: { $avg: { $cond: [{ $and: [{ $ne: ['$rating', null] }, { $gte: ['$rating', 1] }] }, '$rating', null] } },
          totalRatings: { $sum: { $cond: [{ $and: [{ $ne: ['$rating', null] }, { $gte: ['$rating', 1] }] }, 1, 0] } }
        }
      },
      { $sort: { totalReaders: -1, _id: 1 } }
    ]);

    const episodeIds = episodeStats.map(s => s._id);
    const episodes = await ComicBook.find({ _id: { $in: episodeIds } })
      .select('_id title episodeNumber episodeTitle')
      .lean();

    const episodeMap = new Map(episodes.map(ep => [String(ep._id), ep]));

    const episodeResults = episodeStats.map(stat => {
      const base = episodeMap.get(String(stat._id)) || {};
      const avgRatingValue = stat.totalRatings > 0 && stat.avgRating != null
        ? Math.round(stat.avgRating * 10) / 10
        : null;

      return {
        _id: stat._id,
        title: base.title || 'Untitled Episode',
        episodeNumber: base.episodeNumber ?? 1,
        episodeTitle: base.episodeTitle || '',
        totalReaders: stat.totalReaders || 0,
        completedReaders: stat.completedReaders || 0,
        completionRate: stat.totalReaders > 0 ? Math.round((stat.completedReaders / stat.totalReaders) * 100) : 0,
        avgRating: avgRatingValue,
        totalRatings: stat.totalRatings || 0,
      };
    });

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
      episodes: episodeResults,
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
