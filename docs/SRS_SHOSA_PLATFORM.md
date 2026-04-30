# SHOSA Platform Software Requirements Specification (SRS)

## 1. Purpose
The SHOSA Platform supports Seeta High Old Students Association alumni registration, profile management, events, gallery, store ordering, donations, SACCO registration, SACCO payments, and admin oversight.

## 2. User groups
- Public visitor
- Registered alumni
- SACCO applicant/member
- Admin / SACCO staff / Treasurer / Auditor / Super Admin

## 3. Core functional requirements

### Alumni
- Register with structured names, email, phone country code, profile photo, campus and completion details.
- Login/logout securely.
- View dashboard and profile.
- Update profile information.

### SACCO
- Apply using guided selections only.
- Default public membership category is Regular.
- Founder/Executive categories are admin-assigned only.
- First required SACCO payment is UGX 50,000 membership registration fee.
- Fixed payment types use locked amounts.
- Payment proof/reference fields support audit history.

### Store
- View SHOSA merchandise.
- Build an order request.
- Generate WhatsApp-ready order summary.

### Admin
- Admin login through unified secure login flow.
- View alumni, SACCO members, payments, and SACCO analytics.
- Manage gallery uploads.
- Future: verify payment proofs, send broadcasts, assign SACCO categories.

## 4. Non-functional requirements
- Responsive desktop/mobile UI.
- Accessible contrast across Classic/Bright themes.
- No public admin links in footer/nav.
- Sensitive environment variables excluded from Git.
- Audit-focused SACCO data model.
