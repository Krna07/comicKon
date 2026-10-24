const mongoose = require('mongoose');

const ReaderSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    episodeId:        { type: String, default: '' },           // Mongo ObjectId as string for the episode
    episodeTitle:     { type: String, default: '' },
    episodeNumber:    { type: Number, default: null },
    readerName:       { type: String, default: '' },
    ipAddress:        { type: String, default: 'unknown' },
    userAgent:        { type: String, default: '' },
    pagesRead:        { type: [Number], default: [] },
    maxPageReached:   { type: Number, default: 1 },
    completed:        { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 },
    rating:           { type: Number, default: null, min: 1, max: 10 },
    ratedAt:          { type: Date, default: null },
    firstVisitedAt:   { type: Date, default: Date.now },
    lastActiveAt:     { type: Date, default: Date.now }
  },
  { timestamps: false }
);

module.exports = mongoose.model('ReaderSession', ReaderSessionSchema);
