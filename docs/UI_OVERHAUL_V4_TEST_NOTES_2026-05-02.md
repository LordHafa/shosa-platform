# SHOSA UI Overhaul V4 Test Notes — 2026-05-02

This package integrates the latest SHOSA UI refinements into the current project zip.

## Included fixes

- Warm cream / light-gold background applied systemwide.
- Bright/day theme readability fixed on homepage, SACCO payments, alumni register, admin gallery and profile.
- Profile page repaired with a clear member identity card and readable profile fields.
- Dashboard pages now use the same premium visual direction as the liked SACCO dashboard: cream base, dark glass cards, richer hero panels and stronger typography.
- Store hero marked for product-only image rotation.
- Homepage/public hero rotation excludes product/store imagery.
- SACCO payments page removes the unnecessary Join / Update SACCO button beside payment actions.
- Login page theme toggle restored.
- `.env` included for local testing credentials.

## Local admin credentials

Email: `joel.hafasha@gmail.com`  
Password: `adminshosa`

## SACCO policy recommendation added

After SACCO activation, members get a 6-month grace period before the yearly subscription becomes compulsory. Once the grace period ends, the system blocks other SACCO payments until the yearly subscription is paid.

## Important Git note

The included `.env` is for local testing only. Do not commit `.env` to GitHub in production.
