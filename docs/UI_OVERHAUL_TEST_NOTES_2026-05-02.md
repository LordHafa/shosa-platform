# SHOSA UI Overhaul Test Notes — 2026-05-02

This package applies a controlled visual refinement pass after the warm cream/light-gold direction was approved.

## Included changes

- Systemwide warm luxury cream background, while preserving SHOSA navy/gold identity.
- Readability fixes for cream cards/forms on alumni registration, store, admin gallery and other public pages.
- Dashboard cards remain premium/dark but now sit within the same systemwide background language.
- Store hero is marked as a store-specific dynamic hero and rotates store/product images only.
- Home/public dynamic heroes exclude store/product images.
- Store footer public Admin link removed.
- SACCO dashboard quick action no longer displays the manual “Record a payment” button; the top action now says “Payment options”.

## Manual test checklist

1. Start backend on http://localhost:4000.
2. Start frontend on http://localhost:8080.
3. Test index.html hero rotation.
4. Test store.html hero rotation: should rotate only store/product images.
5. Test alumni-register.html: labels, inputs and file picker should be readable on cream background.
6. Test admin-gallery.html: labels, inputs and upload picker should be readable.
7. Test alumni-dashboard.html, sacco-dashboard.html, admin-dashboard.html: dashboards should retain premium dark cards on the warm system background.
8. Confirm sacco-dashboard.html no longer has the “Record a payment” quick action button.
9. Test bright/classic toggle on all major pages.
