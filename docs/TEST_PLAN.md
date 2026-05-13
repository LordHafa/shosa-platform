# Manual Test Plan

## 1. Admin Login
- Go to http://localhost:5173/login
- Email: admin@seetaalumni.ug
- Password: Admin123!
- Expected: admin dashboard opens.

## 2. Alumni Registration
- Logout.
- Go to Register.
- Create a test alumni using a unique email.
- Expected: registration success and redirect to login.

## 3. Alumni Dashboard
- Login with the alumni account.
- Expected: profile details and payments table show.

## 4. SACCO Registration
- Click Join SACCO.
- Submit the form.
- Expected: pending membership and pending payment.

## 5. Admin Payment Approval
- Login as admin.
- Open Admin > Payments.
- Approve pending payment.
- Expected: payment becomes approved and SACCO membership becomes active.

## 6. Gallery Upload
- Admin > Gallery.
- Upload an image.
- Expected: image appears on public Gallery page.

## 7. Audit Logs
- Admin > Audit Logs.
- Expected: payment approval and gallery upload actions appear.
