const mongoose = require('mongoose');

const DialogueSchema = new mongoose.Schema({
  text: { type: String, required: true },
  top:  { type: Number, default: 10 },
  left: { type: Number, default: 10 },
  type: { type: String, enum: ['speech', 'caption', 'thought'], default: 'speech' },
  tail: { type: String, default: 'bottom-left' }
});

const PanelSchema = new mongoose.Schema({
  panelNumber:  { type: Number, required: true },
  pageNumber:   { type: Number, required: true },
  imageUrl:     { type: String, required: true },
  size:         { type: String, enum: ['half', 'wide', 'third'], default: 'wide' },
  captionHindi: { type: String, default: '' },
  dialogues:    [DialogueSchema]
});

const ComicBookSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true },
    episodeNumber: { type: Number, default: 1 },
    episodeTitle:  { type: String, default: '' },       // e.g. "धुआँ का जन्म"
    description:   { type: String, default: '' },
    coverImage:    { type: String, default: '' },
    type:          { type: String, enum: ['comic', 'novel'], default: 'comic' },
    novelContent:  { type: String, default: '' },
    totalPages:    { type: Number, required: true },
    published:     { type: Boolean, default: false },   // false = draft, true = visible to readers
    panels:        [PanelSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComicBook', ComicBookSchema);
