# SHOSA Phase 1 Testing Guide

This guide lets you test current baseline behavior before implementing deeper Phase 1 hardening.

## 1) Prerequisites

- Node.js 20+ (22 preferred).
- Backend dependencies installed.

```bash
cd SHOSA_backend/backend_full
npm install
```

## 2) Start backend

```bash
cd SHOSA_backend/backend_full
npm start
```

Expected: `✅ SHOSA backend running on http://localhost:4000`

## 3) Run automated smoke test

In a second terminal:

```bash
cd SHOSA_backend/backend_full
npm run test:smoke
```

What this checks today:
- API health endpoint responds.
- Alumni registration works.
- Alumni login works.
- Authenticated `/api/me` works.
- SACCO payment is blocked before SACCO registration.
- SACCO registration endpoint works.
- First-payment gate is enforced.

## 4) Manual finance sanity checks (recommended)

### 4.1 Admin login negative test
Try wrong credentials and confirm 401:

```bash
curl -i -X POST http://localhost:4000/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"wrong@example.com","password":"bad"}'
```

### 4.2 Rate limiting test
Call login endpoint repeatedly and verify rate-limit response appears.

### 4.3 Upload validation test
Try uploading non-image file to profile photo endpoint and confirm backend rejects it.

## 5) Frontend checks (store)

Serve frontend:

```bash
cd SHOSA_frontend
python -m http.server 8080
```

Then open `http://localhost:8080/store.html` and verify:
- Quantity buttons update live summary.
- Total pricing updates as expected.
- Draft persists after refresh.
- “Send order to WhatsApp” opens prefilled message.

## 6) Troubleshooting

- If smoke test fails on connection error, backend is not running on the expected port.
- To run on a different host/port:

```bash
SHOSA_API_BASE=http://localhost:4000 npm run test:smoke
```

## 7) What comes next (Phase 1 implementation)

After these tests pass, implement in this order:
1. Admin auth hardening (hashed DB users + lockouts + 2FA path).
2. Audit logs for admin and payment routes.
3. Payment idempotency keys + transaction state transitions.
4. Config schema validation and startup policy.
