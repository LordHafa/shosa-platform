# SHOSA Roles, Permissions & Governance Design

Prepared for the SHOSA alumni + unified SACCO platform — May 2026.

## 1. Executive Summary

The SHOSA platform is moving from a public alumni website into a controlled operating system for alumni records, SACCO activity, gallery/media, events, store requests, payments, and administration.

The guiding principle remains:

> SHOSA alumni leadership can be organized by campus, but the SACCO remains unified across all campuses.

This means Main Campus, Mbalala Campus, Green Campus, and A Level Campus can each have campus-level alumni leadership, while SACCO money, SACCO membership activation, SACCO payment verification, SACCO reports, and future loan workflows are handled by SACCO-specific roles at the unified SACCO level.

## 2. Current Implemented State

The current implementation now includes:

- Environment-based admin login that issues an admin JWT.
- A permission helper layer in the backend.
- A `/api/admin/me` endpoint that exposes the current admin role, permissions, and SHOSA governance context.
- A unified SACCO payment verification workflow.
- Payment approval/rejection endpoints protected by `verify_sacco_payments`.
- Audit logs for admin login, gallery actions, denied permissions, and SACCO payment approval/rejection.
- Admin dashboard buttons for payment approval/rejection, shown only when the admin has payment verification permission.

This is not full final RBAC yet. It is a safe bridge: current `super_admin` continues to work, while the backend is now prepared for more precise roles later.

## 3. SHOSA Executive Structure

### 3.1 Central SHOSA Executive

The Central Executive operates across the whole association.

Recommended central roles:

- Central President
- Central Vice President
- Central Secretary
- Central Treasurer
- Central Publicity / Communications Officer
- Central Organising Secretary
- Central Welfare / Alumni Relations Officer

Typical permissions:

- View global alumni summaries.
- View campus activity summaries.
- Manage official announcements and events where delegated.
- View non-SACCO association finance summaries where appropriate.

They should not automatically approve SACCO payments unless separately assigned a SACCO role.

### 3.2 Campus Executives

Each campus can have its own campus executive structure.

Campuses:

1. Main Campus
2. Mbalala Campus
3. Green Campus
4. A Level Campus

Recommended campus roles per campus:

- Campus Chairperson
- Campus Vice Chairperson
- Campus Secretary
- Campus Treasurer
- Campus Publicity / Mobilisation Officer
- Campus Welfare Representative

Campus roles should be scoped to their assigned campus.

Example:

```text
Role: campus_chair
Campus: Main Campus
Can view: Main Campus alumni records and campus activity
Cannot view: full SACCO payment verification queue
Cannot approve/reject: SACCO payments
```

## 4. Unified SACCO Governance

The SACCO should not be split by campus.

Recommended SACCO roles:

- SACCO Board
- SACCO Chairperson
- SACCO Secretary
- SACCO Treasurer
- SACCO Staff / Operations Officer
- SACCO Payment Verifier
- Credit Committee
- Supervisory Committee / Audit Committee

SACCO roles operate across all campuses because members from all campuses participate in one SACCO.

## 5. Recommended Roles and Permissions

| Role | Scope | Key Permissions | Not Allowed |
|---|---|---|---|
| `super_admin` | Global | All permissions | Should be used sparingly |
| `system_auditor` | Global read-only | `view_dashboard`, `view_audit_logs`, selected read views | No create/update/delete/approve/reject |
| `central_president` | Global alumni | `view_dashboard`, `view_alumni`, `view_sacco` summaries | No SACCO payment approval |
| `central_secretary` | Global alumni operations | `view_alumni`, `manage_events`, `send_broadcasts` | No SACCO payment approval |
| `central_treasurer` | Global association finance | `view_payments` for non-SACCO summaries when separated | No unified SACCO approval unless also SACCO verifier |
| `campus_chair` | Assigned campus | `view_alumni` scoped to campus | No SACCO payment approval |
| `campus_secretary` | Assigned campus | `view_alumni`, campus events/content | No SACCO payment approval |
| `campus_treasurer` | Assigned campus | Campus-level non-SACCO summaries | No SACCO payment approval |
| `sacco_staff` | Unified SACCO | `view_sacco`, `view_payments`, `verify_sacco_payments` | No gallery/events/admin-user management |
| `sacco_board` | Unified SACCO oversight | `view_sacco`, `view_payments`, `view_audit_logs` | No direct editing of payments |
| `credit_committee` | Unified SACCO loans/future | Future loan review permissions | No deposit verification by default |
| `supervisory_committee` | Unified SACCO audit | `view_sacco`, `view_payments`, `view_audit_logs` | No data mutation |
| `gallery_manager` | Content | `manage_gallery` | No SACCO/payment access |
| `events_manager` | Content | `manage_events` | No SACCO/payment access |
| `store_manager` | Store | `manage_store` | No SACCO/payment access |
| `viewer` | Limited read-only | `view_dashboard` | No mutation |

## 6. Current Permission Keys

| Permission | Meaning |
|---|---|
| `view_dashboard` | Open admin dashboard and view permitted widgets |
| `view_alumni` | Read alumni records |
| `manage_alumni` | Edit alumni records |
| `delete_alumni` | Delete alumni accounts; high risk |
| `view_sacco` | Read unified SACCO member records and summaries |
| `view_payments` | Read payment records |
| `verify_sacco_payments` | Approve/reject pending SACCO payments |
| `correct_sacco_payments` | Future reversal/correction workflow |
| `manage_gallery` | Upload/delete gallery records |
| `manage_events` | Create/update events |
| `manage_store` | Manage merchandise records |
| `send_broadcasts` | Send announcements |
| `view_audit_logs` | Read audit logs |
| `manage_admins` | Create/administer admin users |
| `manage_roles` | Change role-permission mappings |

## 7. Backend Rules

The backend is the true security boundary.

Current pattern:

```js
app.post(
  "/api/admin/payments/:id/approve",
  adminAuthMiddleware,
  requirePermission("verify_sacco_payments"),
  handler
);
```

Rules:

- Frontend hiding is only for user experience.
- Backend must still return `403 Permission denied` if the admin lacks permission.
- Denied permission attempts must be audit logged.
- Campus scope will be added later when exact campus admin assignments are defined.
- SACCO roles remain global because the SACCO is unified.

## 8. Payment Verification Workflow

### 8.1 Alumni Submission

An alumni member submits a SACCO payment.

The payment starts as:

- `pending_gateway_confirmation`, or
- `pending_verification`

For membership registration fee, the SACCO membership does not become active until payment is approved.

### 8.2 Admin Review

A permitted admin opens the Payments tab.

If the payment is pending and the admin has `verify_sacco_payments`, the dashboard shows:

- Approve
- Reject

### 8.3 Approval

Approval updates:

- `status = approved`
- `confirmedAt`
- `confirmedBy`
- `reviewedAt`
- `reviewedBy`
- audit log action: `sacco_payment_approved`

If the approved payment is `sacco_membership_fee`, the member's SACCO membership becomes `active`.

### 8.4 Rejection

Rejection updates:

- `status = rejected`
- `reviewedAt`
- `reviewedBy`
- `rejectionReason`
- audit log action: `sacco_payment_rejected`

If the rejected payment is the only membership registration fee, the membership remains or returns to `pending_membership_fee`.

## 9. What We Should Not Grant

- Campus roles should not approve/reject SACCO payments.
- Content roles should not access private SACCO/payment data.
- Auditors should not mutate records.
- Only `super_admin` should manage admin users in the first version.
- Admins should not be allowed to change their own permissions.
- Pending payments should not be counted as verified SACCO revenue.
- Sensitive values such as passwords, tokens, authorization headers, cookies, and secrets must not be stored in audit metadata.
- Financial records should not be deleted casually; use review, rejection, correction, or reversal workflows instead.

## 10. Later Work

Later phases should add:

1. Real database-backed admin users.
2. Admin role assignment screens.
3. Campus-scoped permissions.
4. `/api/admin/users` management.
5. Payment reversal/correction workflow.
6. SACCO reports that separate pending, approved, rejected, reversed, and corrected funds.
7. Notifications for payment approved/rejected events.

## 11. Current Phase Commit Scope

This phase intentionally changes only:

- `SHOSA_backend/backend_full/server.js`
- `SHOSA_frontend/admin-dashboard.html`
- `docs/SHOSA_ROLES_PERMISSIONS_GOVERNANCE_2026.md`

It does not change:

- theme CSS
- navbar JS
- login pages
- gallery UI
- file upload UI
- `.env`
- database file
- `node_modules`
