# SHOSA UI Overhaul V5 Test Notes — 2026-05-02

This update focuses on the issues found during V4 testing.

## Fixed

1. Homepage authenticated navigation
   - Homepage now uses the same auth-aware navbar logic as the other pages.
   - Logged-in alumni/admin users should no longer see public Log in/Register buttons.

2. Bright/light theme readability
   - Fixed the homepage announcement bar.
   - Fixed Contact & Support text.
   - Fixed Make a donation / Get involved style buttons on light cards.
   - Strengthened event/gallery/about/contact/donation card readability.

3. SACCO payments page
   - Separated payment purposes into three visible groups: Membership & subscription, Savings, Donations.
   - Removed the extra Join / Update SACCO navigation link from the payment page.
   - Forced the SACCO payment desk/status cards to use dark readable text on the cream background.

4. Profile page
   - Repaired profile card, profile field, form, label, and note readability.

5. Admin dashboard charts
   - Upgraded chart rendering with richer gradients, hover effects, line+bar trend chart, improved doughnut spacing, tooltip styling, and center text.

6. Local environment
   - Included local .env files in the root and backend folder for testing:
     ADMIN_EMAIL=joel.hafasha@gmail.com
     ADMIN_PASSWORD=adminshosa

## Important GitHub warning

The .env files are for local testing only. Do not commit .env to GitHub.

## SACCO policy recommendation

A 6-month grace period after SACCO activation is sensible for yearly subscription. After the grace period, savings payments should be blocked until the yearly subscription is paid. Donations should remain separate from SACCO savings and should not be counted as member savings.
