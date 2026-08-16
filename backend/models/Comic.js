const mongoose = require('mongoose');

// A speech bubble / dialogue balloon on a panel
const DialogueSchema = new mongoose.Schema({
  text: { type: String, required: true },
  // position as % from top-left of the panel image
  top:  { type: Number, default: 10 },  // 0-100
  left: { type: Number, default: 10 },  // 0-100
  // 'speech' = round bubble | 'caption' = rectangular box | 'thought' = cloud
  type: { type: String, enum: ['speech', 'caption', 'thought'], default: 'speech' },
  // tail direction: bottom-left, bottom-right, top-left, top-right
  tail: { type: String, default: 'bottom-left' }
});

const PanelSchema = new mongoose.Schema({
  panelNumber: { type: Number, required: true },
  pageNumber:  { type: Number, required: true },
  imageUrl:    { type: String, required: true },

  // Layout size on the page grid:
  // 'half'  = takes half the row width (2 side by side)
  // 'wide'  = full row width (solo wide panel)
  // 'third' = one-third width (3 across)
  size: {
    type: String,
    enum: ['half', 'wide', 'third'],
    default: 'half'
  },

  // Narrative caption shown BELOW the panel (the box text in comics)
  captionHindi: { type: String, default: '' },

  // Speech / thought bubbles overlaid ON the image
  dialogues: [DialogueSchema]
});

const ComicBookSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    totalPages:  { type: Number, required: true },
    coverImage:  { type: String, default: '' },
    description: { type: String, default: '' },
    panels:      [PanelSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComicBook', ComicBookSchema);
