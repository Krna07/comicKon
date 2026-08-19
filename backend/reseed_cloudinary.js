/**
 * reseed_cloudinary.js
 * Wipes the comic DB, uploads all 6 page PNGs to Cloudinary,
 * then saves the comic with permanent Cloudinary URLs.
 *
 * Run once: node reseed_cloudinary.js
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const path     = require('path');
const fs       = require('fs');
dotenv.config();

const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

const ComicBook = require('./models/Comic');
const PANELS_DIR = path.join(__dirname, '../public/panels');

// ── Story captions for each page ──────────────────────────────
const storyData = [
  { page: 1, caption: 'हम सब गाँव से कहीं जा रहे थे। शाम का वक्त था और सब कुछ बिल्कुल शांत और सामान्य लग रहा था।' },
  { page: 2, caption: 'तभी अचानक ज़ोरदार धमाका हुआ — \'धड़ाम!\' आवाज़ इतनी तेज़ थी कि सब कुछ थम गया। दूर आसमान में बहुत बड़ा विस्फोट हुआ और काला, बेहद घना धुआँ तेजी से उठने लगा।' },
  { page: 3, caption: 'हमें समझ ही नहीं आया कि क्या हुआ। डर के मारे सब चिल्लाने लगे — \'भागो! यहाँ से निकलो!\' धुआँ किसी परमाणु बम की तरह हमारी तरफ बढ़ रहा था।' },
  { page: 4, caption: 'काला धुआँ हर चीज़ को अपनी ओर खींच रहा था, पेड़ और धूल हवा में उड़ने लगे थे। तभी दोस्त ने अचानक कहा — \'किसी भी जानवर के अंदर खुद को छुपा लो!\'' },
  { page: 5, caption: 'मुझे खुद नहीं पता था कि मैं क्या कर रहा हूँ, मैंने बस पास खड़े बछड़े की तरफ कदम बढ़ा दिए। मैं उस बछड़े के अंदर जा छिपा, और बाकी दोस्त भी जान बचाने के लिए अलग-अलग दिशाओं में भागे।' },
  { page: 6, caption: 'धुआँ बेहद करीब आ गया। चारों तरफ छाए अंधेरे के बीच मुझे एक अजीब रहस्यमयी आदमी दिखाई दिया। वह पूरे विनाश का सरदार लग रहा था। उसने जाते-जाते सबको संदेश दिया — \'मैं फिर लौटूँगा!\'' },
];

async function run() {
  // ── 1. Connect ──────────────────────────────────────────────
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected\n');

  // ── 2. Upload each page PNG to Cloudinary ───────────────────
  const panels = [];

  for (const { page, caption } of storyData) {
    const localFile = path.join(PANELS_DIR, `page_${page}.png`);

    if (!fs.existsSync(localFile)) {
      console.error(`❌ File not found: ${localFile}`);
      console.error('   Make sure public/panels/page_1.png … page_6.png exist.');
      process.exit(1);
    }

    process.stdout.write(`  ⬆️  Uploading page_${page}.png ... `);
    const result = await cloudinary.uploader.upload(localFile, {
      folder:      'dhuaa-comic',
      public_id:   `page_${page}`,
      overwrite:   true,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    console.log(`✅ ${result.secure_url}`);

    panels.push({
      panelNumber:  page,
      pageNumber:   page,
      size:         'wide',
      imageUrl:     result.secure_url,   // permanent Cloudinary URL
      captionHindi: caption,
      dialogues:    [],
    });
  }

  // ── 3. Wipe old data and save fresh ─────────────────────────
  // NOTE: Only wipes if you explicitly pass --force flag
  if (process.argv.includes('--force')) {
    await ComicBook.deleteMany({});
    console.log('\n🗑️  Cleared old comic data (--force)');
  }

  const comic = await ComicBook.create({
    title:       'धुआँ — एक रहस्यमयी कहानी',
    totalPages:  6,
    coverImage:  panels[0].imageUrl,
    description: 'एक शांत शाम अचानक बदल जाती है जब एक रहस्यमयी धुआँ सब कुछ निगलने लगता है। क्या हमारे नायक बच पाएंगे?',
    panels,
  });

  console.log(`✅ Seeded: "${comic.title}" — ${comic.panels.length} pages with Cloudinary URLs`);

  await mongoose.disconnect();
  console.log('🔌 Done — all images are now permanently on Cloudinary!');
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
