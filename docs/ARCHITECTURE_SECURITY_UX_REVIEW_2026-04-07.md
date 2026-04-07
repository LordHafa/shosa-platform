# SHOSA Platform Review (Architecture, Security, UX)

Date: 2026-04-07  
Scope reviewed: `SHOSA_frontend/*`, `SHOSA_backend/backend_full/*`

## 1) Executive summary

The project has a strong foundation for an MVP: clear alumni auth flows, SACCO membership/payment rules, and a modern store page with good visual effort. To become production-ready for real finance operations, priority should shift to:

1. **Security hardening** (auth, admin access, file uploads, secrets).
2. **Data integrity and auditability** (money ledger, idempotency, immutable transactions).
3. **Operational resilience** (backups, monitoring, incidents, environment separation).
4. **Design system consistency** (single style system and reusable components across all pages).

If these are addressed, SHOSA can become both trustworthy for SACCO operations and appealing to younger + older audiences.

---

## 2) What is working well already

- Password hashing for alumni accounts (`bcrypt`, cost 12).
- JWT-based auth with expiration.
- Baseline protections (`helmet`, CORS, rate limiting).
- Parameterized SQL statements through prepared queries.
- SACCO payment gating logic (membership fee before other SACCO payments).
- Store experience already includes persistence (local draft), clear order summary, and WhatsApp handoff.

---

## 3) Highest-priority risks and improvements

### A. Admin authentication and authorization (Critical)

Current backend admin login compares plaintext env password directly and issues a role token without multi-layer checks.

**Recommended fixes (priority 0):**
- Move admin users into DB with hashed passwords (`bcrypt`) and `isActive` flag.
- Add 2FA for admin accounts (TOTP or email OTP at minimum).
- Add account lockout / cooldown after repeated failures per account + IP.
- Introduce role permissions matrix (not just role string checks).
- Record admin auth events (login success/failure, token issuance, token revocation).

### B. Financial transaction integrity (Critical)

Payments are currently recorded as application inserts but there is no end-to-end gateway verification, idempotency key, immutable ledger boundary, or reconciliation workflow.

**Recommended fixes (priority 0):**
- Introduce `transactions` table with immutable records (`created_by`, `source`, `reference`, `status`, `posted_at`).
- Add `idempotency_key` per payment request to prevent duplicate submissions.
- Store gateway callback signatures and verification results.
- Split states: `initiated -> pending -> confirmed -> failed -> reversed`.
- Build daily reconciliation report (gateway statement vs SHOSA ledger).
- Restrict manual payment edits; only allow reversal entries, never destructive edits.

### C. Secrets and configuration hygiene (Critical)

The system does warn on weak JWT secret in production (good), but additional controls are needed.

**Recommended fixes (priority 0):**
- Enforce secret validation at startup for all environments except local development.
- Add rotation policy for JWT signing keys and admin credentials.
- Keep secrets only in managed secret stores (Render/Heroku/Vercel secrets, Doppler, Vault, etc.).
- Add environment-level config schema validation (e.g., `zod` or `envalid`).

### D. Data and PII protection (High)

Alumni and payment data include personal details and financial context.

**Recommended fixes (priority 1):**
- Encrypt backup artifacts and sensitive fields where practical (phone numbers at rest for exports).
- Add retention policy: what is kept, for how long, and deletion/anonymization rules.
- Create privacy and consent notices in UI (especially around payments and profile photos).
- Add tamper-evident audit log tables for admin and finance actions.

### E. File upload security (High)

Uploads are image-filtered by MIME, but this should be strengthened.

**Recommended fixes (priority 1):**
- Validate by content signature/magic bytes (not MIME only).
- Re-encode images server-side before storage (strip metadata where possible).
- Use randomized file names only (do not retain original file names).
- Serve uploads from isolated bucket/domain with strict content-type headers.

### F. Operational reliability and scale (High)

SQLite is excellent for early stages, but SACCO-grade workflows need stronger multi-user reliability and observability.

**Recommended fixes (priority 1):**
- Plan migration path to PostgreSQL (managed service + migrations).
- Add migration tool (`Prisma`, `Knex`, or `Drizzle`) and versioned schema changes.
- Implement daily automated backups + tested restore drills.
- Add uptime checks, structured logs, and error alerts.

---

## 4) Product/UX recommendations (Gen Z + older generations)

### Design language strategy

Use one unified SHOSA design system:
- **Elegant + high-contrast base** for older audiences (clarity first).
- **Modern micro-interactions** and visual polish for Gen Z.
- Keep fonts and spacing consistent across all pages.

### Accessibility baseline (non-negotiable)

- Ensure WCAG AA contrast on every page.
- Increase base text size to at least 16px equivalent in all major body copy.
- Minimum touch target 44x44px.
- Visible keyboard focus on all controls.
- Plain-language labels and helper text on finance forms.

### Information architecture

Top-level nav should separate concerns clearly:
1. About SHOSA
2. Alumni
3. SACCO
4. Store
5. Events/Gallery
6. Contact/Support

For trust:
- Add “How SACCO works” page with governance, fees, payout timelines, and FAQ.
- Add transparent “Financial Accountability” page (reports, committee roles, audit cadence).

---

## 5) SHOSA Store “top-notch” upgrade plan

### Current strengths
- Clean product cards, quantity controls, summary panel, WhatsApp checkout flow.

### Improvements to make it best-in-class

1. **Catalog architecture**
   - Move products from hardcoded HTML into DB/API.
   - Add stock status, variants (size/color), and product media gallery.

2. **Checkout quality**
   - Add in-site cart page + order confirmation step before WhatsApp redirect.
   - Generate an order number and save order server-side.
   - Offer payment intent options (mobile money link or pay-on-confirmation).

3. **Alignment and visual consistency**
   - Introduce reusable components: `ProductCard`, `PriceTag`, `QuantityStepper`, `OrderSummary`.
   - Standardize vertical rhythm and card height alignment.
   - Ensure equal media ratio across product cards (1:1 or 4:5).

4. **Merch operations**
   - Admin UI for product CRUD, stock, featured tags, and seasonal drops.
   - Export orders CSV + fulfillment status tracking.

5. **Conversion optimization**
   - Add social proof (recent orders, testimonials, “worn at events”).
   - Add bundle pricing (e.g., tee + cap).
   - Add urgency signals only if truthful (low stock, preorder windows).

---

## 6) Suggested architecture target (pragmatic)

- **Frontend:** Keep current static site initially; progressively componentize (Vite + React or keep vanilla with component partials).
- **Backend:** Express API with structured modules (`auth`, `alumni`, `sacco`, `payments`, `store`, `admin`).
- **Database:** PostgreSQL for production finance records.
- **Auth:** JWT short-lived access + refresh token rotation (HTTP-only secure cookies for web).
- **Storage:** Object storage for uploads (S3-compatible) + CDN.
- **Monitoring:** Request logs, security logs, alerting, dashboard.
- **CI/CD:** lint/test/build pipeline before deploy.

---

## 7) 30-60-90 day execution roadmap

### First 30 days (stability + trust)
- Harden admin auth and role model.
- Introduce audit logs for admin + payments.
- Implement strict env validation and secret policy.
- Add backup automation and restore test.
- Build SACCO transparency pages and finance FAQ.

### Days 31-60 (finance correctness + store backbone)
- Implement payment transaction state machine + idempotency.
- Add gateway callback verification.
- Move store catalog/orders to backend.
- Add order IDs and admin fulfillment flow.

### Days 61-90 (scale + polish)
- Migrate from SQLite to PostgreSQL.
- Introduce automated tests for critical flows.
- Add analytics + funnel monitoring for store and SACCO onboarding.
- Final UI consistency pass with shared component library.

---

## 8) Engineering standards to adopt now

- Add ESLint + Prettier and enforce in CI.
- Use conventional commit messages.
- Add tests for: auth, membership gating, payment flow, admin access control.
- Separate `dev/staging/prod` environments.
- Maintain incident response runbook for finance-related outages.

---

## 9) Recommended immediate next task list (week 1)

1. Refactor admin auth to hashed DB-based users.
2. Add `audit_logs` table + middleware logger for sensitive routes.
3. Add `idempotency_key` to payment API contract.
4. Add environment config validator at startup.
5. Create a lightweight design tokens file and apply across all pages.
6. Define store order schema and persist order requests.

