# Seeta Alumni Website + SACCO Database

Separate comparison project for evaluating a Seeta Alumni + SACCO system against the current SHOSA platform.

## Stack

- Frontend: Vue 3 + Vite + TailwindCSS + Pinia
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL
- Auth: JWT unified alumni/admin login

## Local defaults

Backend API: http://localhost:5000/api  
Frontend: http://localhost:5173  
Database: `seeta_db` on PostgreSQL port `5433`

Default seeded admin:

- Email: `admin@seetaalumni.ug`
- Password: `Admin123!`

## Important

This is a separate test project. It should use the `seeta_db` database only and must not point to your SHOSA database.
