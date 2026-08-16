const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Serve uploaded panel images statically
// e.g. GET /panels/panel_123456789.png
app.use('/panels', express.static(path.join(__dirname, '../public/panels')));

// Routes
const comicRoutes     = require('./routes/comicRoutes');
const sessionRoutes   = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes     = require('./routes/adminRoutes');

app.use('/api/comic',     comicRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin',     adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dhuaa Comic API is running' });
});

// Connect to MongoDB
const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dhuaa_comic';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Admin portal: http://localhost:5173/admin`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
