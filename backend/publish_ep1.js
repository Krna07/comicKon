require('dotenv').config();
const mongoose = require('mongoose');
const Comic = require('./models/Comic');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Comic.updateMany({}, {
    $set: { published: true, episodeNumber: 1, episodeTitle: 'धुआँ का जन्म' }
  });
  const all = await Comic.find({}, 'title episodeNumber published');
  all.forEach(c => console.log('Ep', c.episodeNumber, c.published ? '✅ PUBLISHED' : '📝 DRAFT', '|', c.title));
  await mongoose.disconnect();
  console.log('Done');
});
