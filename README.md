# SHSID-PA

SHSID Peer Advisors (PA) web platform for browsing and managing peer-written academic guides.

## What the site does

- **Landing page (`/index.html`)**
  - Animated hero section with theme-aware visuals
  - Direct entry point to the guides library
- **Guides library (`/guides.html`)**
  - Resource list is hidden until login (`Log in to view resources`)
  - Student or admin login can view guides; only admin can upload/remove guides
  - Fetches guides from `GET /api/guides`
  - Organizes content by semester period → subject → level
  - Supports real-time search by title, subject, and level
  - Includes inline PDF viewing links (`/api/guides/pdf/:filename`)
  - Login modal supports:
    - **Admin Login** (account + password, JWT role `admin`)
    - **Student Login** (G number only, matched against `Grade_10.txt`, JWT role `student`)
    - Improved login type picker for faster Student/Admin selection
  - Logged-in users can use the navbar **Logout** action to switch accounts without clearing browser cache
  - Admin-only guide removal controls and upload access
- **Guide upload (`/upload.html`)**
  - JWT-gated page (redirects if session is invalid)
  - Auto-generates guide titles from selected semester/subject/level
  - PDF drag-and-drop + file picker upload UX
  - Uploads guides through `POST /api/guides/upload`
- **Global UI features**
  - Dark / light / pink theme cycle (saved in `localStorage`)
  - Motion/reveal effects with reduced-motion fallback
  - Responsive layout tuned for desktop and mobile

## Backend/API summary

- **Auth**: `POST /api/auth/login`
  - `mode: "admin"`: account/password login for authorized staff
  - `mode: "student"`: G-number login validated against `Grade_10.txt`
- **Guides**:
  - `GET /api/guides`
  - `POST /api/guides/upload` (auth required, PDF only)
  - `DELETE /api/guides/:id` (auth required)
  - `GET /api/guides/pdf/:filename`
- **Storage**:
  - PostgreSQL tables: `users`, `guides`
  - Uploaded files stored in `/uploads`

## Tech stack

- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- File uploads (`multer`)
- Frontend: static HTML + React (UMD) + Babel in-browser

## Environment variables

Configure these in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (optional)
- `FURINA_ACCOUNT`, `FURINA_PASSWORD` (recommended)
- `ADMIN_ACCOUNT`, `ADMIN_PASSWORD` (recommended)

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Scripts

- `npm start` — start server
- `npm run seed` — seed/update users
- `npm test` — placeholder script (currently not a real test suite)
