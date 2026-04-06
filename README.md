# ⚡ EV Charge Pro — Complete Setup Guide

## Prerequisites
- **XAMPP** (MySQL + Apache) — https://www.apachefriends.org
- **Node.js** v18+ — https://nodejs.org
- **npm** (comes with Node.js)

---

## Step 1 — Start XAMPP

1. Open XAMPP Control Panel
2. Start **MySQL** (and optionally Apache)
3. Make sure MySQL is running on port **3306**

---

## Step 2 — Create the Database

1. Open your browser → go to **http://localhost/phpmyadmin**
2. Click **"New"** in the left sidebar (or use the SQL tab)
3. Click the **SQL** tab at the top
4. Open the file `database/schema.sql` from this project
5. Copy **all** the contents and paste into the SQL box
6. Click **Go** (or Run)

✅ This will create the `evcharging` database with 8 Mysuru stations pre-loaded.

---

## Step 3 — Setup Backend

Open a terminal/command prompt:

```bash
cd backend
npm install
```

The backend uses these settings (in `backend/.env`):
```
DB_NAME=evcharging
DB_USER=root
DB_PASSWORD=          ← leave blank for default XAMPP
PORT=5000
```

> If you set a MySQL password in XAMPP, edit `backend/.env` and set `DB_PASSWORD=yourpassword`

Start the backend:
```bash
npm start
```

You should see:
```
✅  MySQL (evcharging) connected via XAMPP
⚡  EV Charge Pro — Backend API
🌐  http://localhost:5000
```

Test it: Open http://localhost:5000/api/health — you should see `{"success":true}`

---

## Step 4 — Setup Frontend

Open a **new** terminal (keep backend running):

```bash
cd frontend
npm install
npm start
```

The browser will open automatically at **http://localhost:3000**

---

## Step 5 — Using the App

| Feature | How |
|---|---|
| Browse stations | Home page shows all Mysuru EV stations |
| Filter stations | Use "Open Now", "Fast", "CCS", "Type 2" buttons |
| Book a slot | Click any active station → pick date & time → fill form |
| View booking | Click "My Booking" in the top nav, paste your token |
| Cancel booking | In "My Booking", find your booking → Cancel |
| Leave a review | In "My Booking", find your booking → Leave a Review |

---

## Bugs Fixed

| Bug | Fix |
|---|---|
| "Compiled with problems" in browser | Added `DISABLE_ESLINT_PLUGIN=true` to frontend `.env` |
| Security middleware blocks valid names/notes | `guardMalicious` regex fixed — no longer blocks English words like "delete", "select" in user input |
| Booking date mismatch error | Added `dateStrings: true` to MySQL pool so dates are plain strings |
| `is_past` wrong timezone | Slots now compared in IST (+05:30) |
| Wrong DB name | Changed from `evcharge` → `evcharging` throughout |
| Dark theme remnants | Full light theme applied |
| Charger color crash | Removed unsafe `hexToRgb`, use object lookup |
| ManagePage token pre-fill | `initialToken` prop passed from ConfirmationPage |
| Date displayed as raw ISO | Dates now formatted as "Mon, 5 Apr 2025" |
| DB not connected on startup | `server.js` now explicitly requires `config/db` at boot |
| `amenities` helper hoisting | Moved above component definition to avoid ESLint warnings |

---

## Folder Structure

```
evcharge/
├── backend/
│   ├── config/db.js          ← MySQL connection (evcharging DB)
│   ├── controllers/          ← Request handlers
│   ├── models/               ← Station, Booking, TimeSlot, Review
│   ├── routes/               ← API routes
│   ├── middleware/security.js← Rate limiting, validation, sanitization
│   ├── server.js             ← Express app entry point
│   ├── .env                  ← DB config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js            ← Page routing
│   │   ├── pages/            ← StationsPage, BookingPage, ConfirmationPage, ManagePage
│   │   ├── services/api.js   ← Axios API calls
│   │   └── styles/global.css ← Light theme CSS
│   ├── public/index.html
│   ├── .env                  ← REACT_APP_API_URL + DISABLE_ESLINT_PLUGIN
│   └── package.json
└── database/
    └── schema.sql            ← Run this in phpMyAdmin
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/stations` | List all stations |
| GET | `/api/stations/stats` | Dashboard stats |
| GET | `/api/stations/:id` | Single station with reviews |
| GET | `/api/stations/:id/slots?date=YYYY-MM-DD` | Available time slots |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/:token` | View booking by token |
| DELETE | `/api/bookings/:token` | Cancel booking |
| POST | `/api/bookings/:token/review` | Submit a review |

---

## Troubleshooting

**"MySQL connection failed"**
→ Make sure XAMPP MySQL is started and running on port 3306

**"Network error. Is backend running?"**
→ Start the backend first (`cd backend && npm start`)

**"Cannot book a past time slot"**
→ Select a future time slot on today's date or a future date

**Frontend shows blank page**
→ Make sure you ran `npm install` in the `frontend` folder
