# SHOSA System Design Document

## Architecture
- Frontend: static HTML/CSS/JavaScript.
- Backend: Node.js / Express.
- Storage: current launch build uses local DB/storage patterns; PostgreSQL migration remains recommended for production scale.
- Auth: token-based localStorage session for alumni/admin roles.

## Main modules
1. Public website
2. Alumni registration/login/profile
3. SACCO registration and payments
4. Store ordering workflow
5. Gallery/events/content pages
6. Admin dashboard and analytics

## SACCO safety design
- Backend enforces Regular membership for public applicants.
- Backend preserves elevated categories if admin already assigned them.
- Backend enforces first-fee rule before other SACCO payments.
- Backend enforces exact fixed amounts for membership fee, yearly subscription, monthly savings and quarterly savings.

## Recommended production additions
- PostgreSQL database.
- Payment gateway callbacks.
- Immutable audit log table.
- Email/SMS provider integration.
- Admin verification workflow.
- Role-based permissions in the UI and API.
