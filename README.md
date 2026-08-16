# धुआँ — Comic Book Reader

A full-stack MERN comic book reader with an interactive flipbook layout, anonymous session tracking, and a Hindi story experience.

---

## Tech Stack

- **Frontend**: React 19 + Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose

---

## Project Structure

```
dhuaa/
├── src/                        # React frontend
│   ├── api/comicApi.js         # Axios API helpers
│   ├── components/
│   │   ├── ComicReader.jsx     # Main reader shell
│   │   ├── BookSpread.jsx      # Dual-panel spread with animations
│   │   └── ProgressBar.jsx     # Reading progress bar
│   ├── hooks/useSessionTracker.js  # Anonymous session tracking
│   ├── App.jsx
│   └── index.css
├── backend/
│   ├── models/
│   │   ├── Comic.js            # ComicBook Mongoose model
│   │   └── ReaderSession.js    # ReaderSession Mongoose model
│   ├── routes/
│   │   ├── comicRoutes.js      # GET /api/comic
│   │   ├── sessionRoutes.js    # POST /start, PUT /progress
│   │   └── analyticsRoutes.js  # GET /api/analytics/summary
│   ├── server.js
│   ├── seed.js                 # Seed 12 panels into MongoDB
│   └── .env
├── vite.config.js
└── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) OR a MongoDB Atlas connection string

---

### Step 1 — Install frontend dependencies

```bash
# From project root (dhuaa/)
npm install
```

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 3 — Configure environment

Edit `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/dhuaa_comic
PORT=5000
```

Replace `MONGO_URI` with your Atlas URI if using the cloud.

### Step 4 — Seed the database

```bash
cd backend
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Comic seeded: "धुआँ — एक रहस्यमयी कहानी" with 12 panels
```

### Step 5 — Start the backend

```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

### Step 6 — Start the frontend

Open a new terminal from the project root:
```bash
npm run dev
# Frontend running on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/comic`               | All panels + comic metadata          |
| POST   | `/api/sessions/start`      | Initialize or resume reader session  |
| PUT    | `/api/sessions/progress`   | Update reading progress              |
| GET    | `/api/analytics/summary`   | Reader metrics dashboard             |
| GET    | `/api/health`              | Health check                         |

---

## Adding Your Own Comic Images

1. Open `backend/seed.js`
2. Replace the `imageUrl` values in the `panels` array with your actual image URLs (hosted on Cloudinary, S3, GitHub, etc.)
3. Re-run `npm run seed` from the `backend/` folder

For adding new pages/panels, simply add more objects to the `panels` array with the correct `panelNumber` and `pageNumber` values.

---

## Reader Features

- 📖 **Dual-panel book spread** on desktop, stacked on mobile
- 🌐 **Hindi captions** with toggle on/off
- ⌨️ **Keyboard navigation**: Arrow keys to turn pages
- 👆 **Touch swipe** for mobile readers
- 🔴 **Reading progress bar** at the top
- 📊 **Analytics modal** showing live reader stats
- 🔲 **Fullscreen mode** (press `F` or click the icon)
- 🔄 **Completion screen** with restart option
- 🏷️ **Anonymous session tracking** — no login required
