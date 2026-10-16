# DPG Lost & Found — Backend

Node.js + Express + MongoDB API for the Lost & Found portal
(DPG Institute of Technology and Management).

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # or: npm start
```

The server runs on `http://localhost:5000` by default. Point the frontend's
future `fetch()` calls at `http://localhost:5000/api/...`.

## Folder structure

```
backend/
├── server.js              Entry point — Express app, middleware, routes
├── config/db.js           MongoDB connection
├── models/                Mongoose schemas: User, Item, ClaimRequest
├── controllers/            Route logic
├── routes/                  Route definitions
├── middleware/
│   ├── auth.js             JWT auth (protect, requireRole)
│   ├── upload.js           Multer image upload config
│   └── errorHandler.js     Central error handling + asyncHandler wrapper
├── utils/
│   ├── generateToken.js
│   └── matching.js         Lost/found matching algorithm
└── uploads/                 Uploaded item photos (served at /uploads/...)
```

## Auth

JWT-based. Signup/login return a `token` — send it on protected routes as:

```
Authorization: Bearer <token>
```

## API Reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | `{ name, email, password }` |
| POST | `/api/auth/login` | – | `{ email, password }` |
| GET | `/api/auth/me` | ✅ | Current logged-in user |

### Items
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/items` | – | List items. Query: `type`, `category`, `location`, `status`, `search` |
| GET | `/api/items/mine` | ✅ | Items posted by the logged-in user |
| GET | `/api/items/:id` | – | Single item |
| GET | `/api/items/:id/matches` | – | Smart matching suggestions (opposite type, scored 0-100) |
| POST | `/api/items` | ✅ | Create item. `multipart/form-data`: `type, title, description, category, location, date, verificationQuestions (JSON string array), photo (file)` |
| PATCH | `/api/items/:id/status` | ✅ (owner/staff) | `{ status: "claimed" \| "resolved", note? }` — validated against the timeline's allowed transitions |
| DELETE | `/api/items/:id` | ✅ (owner/admin) | Delete a post |

### Claims
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/items/:id/claim` | ✅ | Submit a claim with `{ answers: [{ question, answer }] }` — moves item to "claimed" |
| GET | `/api/items/:id/claims` | ✅ (owner) | View claim requests on your item |
| PATCH | `/api/claims/:claimId` | ✅ (owner) | `{ status: "approved" \| "rejected" }` — approving moves the item to "resolved" |

## How the status timeline works

Every `Item` has a `status` field plus a `statusHistory` array that logs each
transition with a timestamp. Allowed moves are enforced server-side:

```
posted → claimed → resolved
   ↑________|   (a rejected claim reopens the item to "posted")
```

This is exactly what powers the Posted → Claimed → Resolved UI on the
frontend's item detail page.

## How matching works (`utils/matching.js`)

When a lost item is posted, `getItemMatches` looks at all **found** items
(and vice versa) and scores each candidate 0–100:

- **40 pts** — same category (required just to be considered)
- **30 pts** — keyword overlap between title/description
- **15 pts** — same location
- **15 pts** — reported within a 14-day window (closer = more points)

Only candidates scoring 40+ are returned, best match first.

## Admin dashboard

`frontend/admin.html` is only visible/usable to users with role `admin` or
`security`. Since signup always creates a `student` account (by design —
you don't want random users self-promoting to admin), you make someone
staff by editing their user document directly in MongoDB:

1. Atlas → **Browse Collections** → `users` collection
2. Find the user by email, edit the `role` field from `"student"` to `"admin"`
3. Log out and back in on the frontend so the new role is picked up

Once logged in as admin/security, the nav bar shows an **Admin** link with:
- Total items, resolved count, avg. time to resolve
- Breakdown by status and by category
- A full item table — change any item's status or delete it directly

### Admin-only API routes
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/items` | Every item, including inactive ones |
| GET | `/api/admin/stats` | Totals + status/category breakdown |

Staff can also move any item to **any** status via the existing
`PATCH /api/items/:id/status` route — regular owners are still restricted
to the normal posted → claimed → resolved flow.

## Not yet wired up

- Image storage is local disk (`/uploads`) — swap for Cloudinary/S3 before
  deploying anywhere the filesystem isn't persistent.
- No auto-expiry cron job yet — `ITEM_EXPIRY_DAYS` is in `.env.example` for
  when you want to add one with `node-cron`.
- No email notifications yet.
