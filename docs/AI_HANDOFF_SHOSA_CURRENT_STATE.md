# SHOSA Platform Handoff — Current State

Date: 2026-04-30

## Current goal
Build SHOSA as a modern Seeta High Old Students Association digital ecosystem: alumni portal, SACCO flows, store, gallery, events, admin operations, and communication/payment infrastructure.

## Current repository structure
- `SHOSA_frontend/` — static HTML/CSS/JS frontend.
- `SHOSA_backend/backend_full/` — Node.js + Express + SQLite backend.
- `docs/` — project documentation: SRS, system design, user manual, UAT, SACCO automation/audit notes, UI brand system.

## Current restored state
This package restores the preferred modern frontend and adds/keeps the backend runtime needed for local development.

### Frontend work preserved
- Modern SHOSA blue/gold Gen-Z corporate visual style.
- Theme toggle system in `assets/js/worldclass-site.js` and `assets/css/worldclass-theme.css`.
- Custom SHOSA glassmorphism file picker system.
- Auth-aware navbar.
- SACCO gating flow.
- Alumni dashboard polish.
- Admin dashboard polish.
- Admin gallery upload page styling.
- Public gallery display.
- Clean login experience with header/footer hidden on `alumni-login.html`.
- Dynamic hero background engine using public gallery endpoints, uploaded images, and safe local fallbacks.

### Backend work preserved/restored
- Active backend entry file: `SHOSA_backend/backend_full/server.js`.
- Start command: `npm start`.
- Backend runs on `http://localhost:4000`.
- SQLite database bootstrap using `better-sqlite3`.
- Admin login endpoint: `/api/admin/login`.
- Alumni auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/me`.
- SACCO endpoints: `/api/sacco/register`, `/api/sacco/status`, `/api/sacco/me`.
- Payment endpoint: `/api/payments/mobilemoney`.
- Admin data endpoints: `/api/admin/alumni`, `/api/admin/sacco`, `/api/admin/payments`, `/api/admin/stats`.
- Gallery endpoints: `/api/gallery/upload`, `/api/gallery/all`, `/api/gallery/public`, `/api/gallery/approved`, `/api/gallery/all-public`, `/api/gallery/images`, `/api/gallery/events`.

## Admin credentials for local testing
Copy `.env.example` to `.env` inside `SHOSA_backend/backend_full/`.

Default local testing values:
- Email: `joel.hafasha@gmail.com`
- Password: `adminshosa`

Do not commit `.env` to GitHub.

## Run instructions
### Backend
```powershell
cd "C:\Projects\shosa\shosa\shosa-platform\SHOSA_backend\backend_full"
copy .env.example .env
npm install
npm start
```

### Frontend
Open a second PowerShell:
```powershell
cd "C:\Projects\shosa\shosa\shosa-platform\SHOSA_frontend"
python -m http.server 8080
```

Open:
- `http://localhost:8080/index.html`
- `http://localhost:8080/alumni-login.html`
- `http://localhost:8080/admin-gallery.html`
- `http://localhost:8080/gallery.html`

## Manual test checklist
- Backend starts on port 4000.
- Frontend starts on port 8080.
- Admin login works using credentials above.
- Login page has no header/footer clutter.
- Theme toggle appears on public pages and switches Bright/Classic.
- Admin gallery upload has SHOSA custom picker, not default browser-only UI.
- Admin gallery upload uses field name `photo`.
- Uploaded images appear in admin gallery and public gallery.
- Homepage/page heroes rotate images using uploaded gallery/public endpoint images or local fallbacks.
- SACCO rules remain enforced: Regular membership by default, system-controlled contribution plans, UGX 50,000 first membership fee requirement.

## Rules for future AI/Codex work
1. Do not overwrite the SHOSA design system with generic UI.
2. Preserve `worldclass-theme.css`, `worldclass-site.js`, the theme toggle, custom uploaders, auth-aware navbar, SACCO gating, gallery upload/display, and dashboard polish.
3. Do not remove `server.js`.
4. Do not commit `.env`, `node_modules`, SQLite database files, or uploaded user media.
5. Make small patches, list changed files, and run syntax checks before summarizing.
