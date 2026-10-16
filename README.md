# DPG Lost & Found Portal

A full-stack Lost & Found portal for **DPG Institute of Technology and
Management**. Frontend (HTML/CSS/JS) is now wired up to the backend
(Node.js + Express + MongoDB) via `fetch()` calls — no more mock data.

```
lost-and-found-portal/
├── frontend/     HTML/CSS/JS — talks to the API via js/api.js
└── backend/      Express + MongoDB REST API
```

## Run it

**1. Start the backend**
```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI + JWT_SECRET
npm run dev                # runs on http://localhost:5000
```

**2. Serve the frontend** (don't just double-click `index.html` — some
browsers block `fetch()` from `file://` pages; use a tiny static server)
```bash
cd frontend
npx serve .                 # or: npx http-server -p 5500
```
Open whatever URL it prints (e.g. `http://localhost:5500`).

**3. Match the ports**
- `frontend/js/api.js` → `API_BASE` defaults to `http://localhost:5000/api`
- `backend/.env` → `CLIENT_ORIGIN` should include whatever port your
  static server used (default `.env.example` already has `5500`)

If you change either port, update the other side to match.

## What's connected

| Frontend page | Talks to |
|---|---|
| `index.html` (browse) | `GET /api/items` — live list, client-side search/filter |
| `post-item.html` | `POST /api/items` — multipart form with photo upload |
| `item-detail.html` | `GET /api/items/:id`, `GET /api/items/:id/matches`, `POST /api/items/:id/claim` — renders the real status timeline from `statusHistory` |
| `my-posts.html` | `GET /api/items/mine` (requires login) |
| `login.html` / `signup.html` | `POST /api/auth/login` / `POST /api/auth/signup` — saves a JWT in `localStorage` |

The nav bar automatically shows "Hi, `<name>`" + Logout once logged in
(`js/auth.js` handles this on every page).

## Notes
- Auth token + user info are stored in `localStorage` (`dpg-lnf-token`, `dpg-lnf-user`).
- Posting an item or claiming one requires being logged in — you'll be
  redirected to `login.html` if you're not.
- Uploaded photos are served from the backend at `/uploads/...` and the
  frontend prefixes that with `API_BASE` (minus `/api`) to display them.
- See each folder's own `README.md` for more detail (full API reference is in `backend/README.md`).
