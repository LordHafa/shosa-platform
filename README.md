# SHOSA Platform

Integrated alumni, SACCO, events, gallery, and merchandise platform for the Seeta High Old Students Association (SHOSA).

## Stack

- Frontend: Vue 3 + Vite + TailwindCSS + Pinia
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL
- Auth: JWT-based unified alumni/admin login

## Local development defaults

- Backend API: `http://localhost:5000/api`
- Frontend: `http://localhost:5173`
- Database: PostgreSQL database configured in `backend/.env` (local example commonly uses `seeta_db` on port `5433`)

## Seeded admin (local development only)

Seeded admin credentials are read from your local `backend/.env` file:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Do not commit real private credentials to Git.

## Important

This repository is the main SHOSA platform codebase.

Before deployment, make sure you set and verify:

- a strong `JWT_SECRET`
- the correct PostgreSQL connection in `DATABASE_URL`
- your intended `SEED_ADMIN_EMAIL`
- your intended `SEED_ADMIN_PASSWORD`
- production-safe SMTP settings if email delivery is enabled

Also confirm backup/restore readiness, uploads directory permissions, and private admin document storage before public launch.
