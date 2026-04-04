# SHOSA Alumni + SACCO Website

This repository contains the SHOSA website frontend and the active Node.js backend used for alumni, SACCO, payment, and admin flows.

## Project structure

- `SHOSA_frontend/` — static HTML, CSS, and JavaScript website
- `SHOSA_backend/backend_full/` — active Node.js backend

## What was cleaned before GitHub

- Removed local runtime databases and upload contents
- Removed legacy backend duplicate folder to reduce confusion
- Removed `.env.production` from the publishable package
- Removed bundled SQLite Windows executables
- Removed AI handoff/internal refinement notes from the public package
- Kept `.env.example` and `.gitkeep` placeholders where useful

## Local run order

### 1) Backend

```bash
cd SHOSA_backend/backend_full
cp .env.example .env
npm install
npm start
```

The API starts on the port in `.env`, usually `4000`.

### 2) Frontend

Serve the frontend directory with any simple static server.

Example with Python:

```bash
cd SHOSA_frontend
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Important config

Set these in `SHOSA_backend/backend_full/.env` before real deployment:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `UPLOADS_DIR`
- `EVENTS_IMAGES_ROOT`
- any database path or database settings you choose to keep using

## Current note on backend architecture

The active backend in this package still runs with a SQLite-based flow in `server.js`. The repository also contains schema/migration-oriented files that suggest a future database cleanup step. Before production hosting, choose one final database direction and remove anything no longer needed.

## Recommended next cleanup after first GitHub push

1. Decide the single final database path.
2. Add a proper deployment README.
3. Add automated backups for production data.
4. Add basic tests for login, profile, SACCO registration, and payments.


