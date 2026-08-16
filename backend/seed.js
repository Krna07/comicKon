const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ComicBook = require('./models/Comic');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dhuaa_comic';

// ─────────────────────────────────────────────────────────────────
// Each entry = one full comic book page from the PDF.
// imageUrl points to the extracted PNG served from /panels/ in /public.
//
// captionHindi = the overall page narrative (shown below each page).
// dialogues    = any extra speech bubbles you want to overlay (optional).
// size         = 'wide' so every page spans the full column width.
// ─────────────────────────────────────────────────────────────────
const panels = [
  {
    panelNumber: 1,
    pageNumber:  1,
    size:        'wide',
    imageUrl:    '/panels/page_1.png',
    captionHindi: 'हम सब गाँव से कहीं जा रहे थे। शाम का वक्त था और सब कुछ बिल्कुल शांत और सामान्य लग रहा था।',
    dialogues:   []
  },
  {
    panelNumber: 2,
    pageNumber:  2,
    size:        'wide',
    imageUrl:    '/panels/page_2.png',
    captionHindi: 'तभी अचानक ज़ोरदार धमाका हुआ — \'धड़ाम!\' आवाज़ इतनी तेज़ थी कि सब कुछ थम गया। दूर आसमान में बहुत बड़ा विस्फोट हुआ और काला, बेहद घना धुआँ तेजी से उठने लगा।',
    dialogues:   []
  },
  {
    panelNumber: 3,
    pageNumber:  3,
    size:        'wide',
    imageUrl:    '/panels/page_3.png',
    captionHindi: 'हमें समझ ही नहीं आया कि क्या हुआ। डर के मारे सब चिल्लाने लगे — \'भागो! यहाँ से निकलो!\' धुआँ किसी परमाणु बम की तरह हमारी तरफ बढ़ रहा था।',
    dialogues:   []
  },
  {
    panelNumber: 4,
    pageNumber:  4,
    size:        'wide',
    imageUrl:    '/panels/page_4.png',
    captionHindi: 'काला धुआँ हर चीज़ को अपनी ओर खींच रहा था, पेड़ और धूल हवा में उड़ने लगे थे। तभी दोस्त ने अचानक कहा — \'किसी भी जानवर के अंदर खुद को छुपा लो!\'',
    dialogues:   []
  },
  {
    panelNumber: 5,
    pageNumber:  5,
    size:        'wide',
    imageUrl:    '/panels/page_5.png',
    captionHindi: 'मुझे खुद नहीं पता था कि मैं क्या कर रहा हूँ, मैंने बस पास खड़े बछड़े की तरफ कदम बढ़ा दिए। मैं उस बछड़े के अंदर जा छिपा, और बाकी दोस्त भी जान बचाने के लिए अलग-अलग दिशाओं में भागे।',
    dialogues:   []
  },
  {
    panelNumber: 6,
    pageNumber:  6,
    size:        'wide',
    imageUrl:    '/panels/page_6.png',
    captionHindi: 'धुआँ बेहद करीब आ गया। चारों तरफ छाए अंधेरे के बीच मुझे एक अजीब रहस्यमयी आदमी दिखाई दिया। वह पूरे विनाश का सरदार लग रहा था। उसने जाते-जाते सबको संदेश दिया — \'मैं फिर लौटूँगा!\'',
    dialogues:   []
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await ComicBook.deleteMany({});
    console.log('🗑️  Cleared existing comic data');

    const comic = await ComicBook.create({
      title:       'धुआँ — एक रहस्यमयी कहानी',
      totalPages:  6,
      coverImage:  '/panels/page_1.png',
      description: 'एक शांत शाम अचानक बदल जाती है जब एक रहस्यमयी धुआँ सब कुछ निगलने लगता है। क्या हमारे नायक बच पाएंगे?',
      panels
    });

    console.log(`✅ Seeded: "${comic.title}" — ${comic.panels.length} pages`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

seed();
