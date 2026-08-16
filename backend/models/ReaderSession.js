const mongoose = require('mongoose');

const ReaderSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ipAddress: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    pagesRead: { type: [Number], default: [] },
    maxPageReached: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 },
    firstVisitedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

module.exports = mongoose.model('ReaderSession', ReaderSessionSchema);
