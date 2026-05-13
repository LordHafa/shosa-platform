# Final Acceptance Checklist - Seeta Alumni System

Use this checklist before considering the Seeta comparison system ready for final review against SHOSA.

## Public website

- [ ] Homepage loads at `http://localhost:5173`
- [ ] Homepage hero displays correctly
- [ ] Homepage has alumni introduction, campuses, orientation/community section, SACCO highlight, store highlight, events/gallery and contact/donation CTAs
- [ ] About page mentions Seeta High starting in 2000
- [ ] Four campuses appear correctly: Main, Mbalala, Green, A Level
- [ ] Events page loads
- [ ] Gallery page loads without image overflow
- [ ] Store page loads and product cards display
- [ ] Donate page loads
- [ ] Contact page submits messages

## Auth and alumni

- [ ] Unified login works for admin
- [ ] Alumni registration works with firstName, lastName, otherNames
- [ ] Duplicate email registration is blocked
- [ ] Alumni login works
- [ ] Alumni dashboard loads
- [ ] Profile page loads
- [ ] Profile update works
- [ ] Profile photo upload works

## SACCO and payments

- [ ] SACCO registration creates pending membership
- [ ] SACCO registration creates membership-fee payment
- [ ] SACCO dashboard loads
- [ ] SACCO payments page loads
- [ ] Mobile money payment can be submitted
- [ ] Bad payment amounts like `50000abc` are rejected
- [ ] Duplicate transaction references are rejected
- [ ] Alumni cannot approve/reject payments

## Admin

- [ ] Admin dashboard loads
- [ ] Admin dashboard shows governance counters after Wave 5 migration/seed
- [ ] Admin Alumni page loads
- [ ] Admin can verify/reject/suspend alumni verification status
- [ ] Admin Payments page loads
- [ ] Admin can approve only pending payments
- [ ] Admin can reject only pending payments with reason
- [ ] Approved/rejected payments cannot be finalized again
- [ ] Admin Gallery page loads
- [ ] Admin can upload gallery image
- [ ] Admin Files page loads
- [ ] Admin can upload/download/soft-delete private documents
- [ ] Admin Contacts page loads
- [ ] Admin can mark contact messages as read/replied/archived
- [ ] Admin Audit Logs page loads
- [ ] Admin Users page loads
- [ ] Super admin can create admin users

## Security/readiness

- [ ] `.env` is not committed
- [ ] `node_modules` is not committed
- [ ] `dist` is not committed
- [ ] uploads/private documents are not committed
- [ ] Password hashes never appear in API responses
- [ ] Private admin documents are not stored in frontend/public
- [ ] Dark/light themes are readable
- [ ] Mobile layout has no page-level horizontal scrolling
