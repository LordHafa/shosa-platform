# SHOSA update pack

This package keeps the original SHOSA website structure and flow, while upgrading presentation and governance foundations.

## Frontend
- Added a richer premium visual layer in `SHOSA_frontend/assets/css/worldclass-theme.css`
- Added lightweight shell behaviors in `SHOSA_frontend/assets/js/worldclass-site.js`
- Applied the new theme to all HTML pages without replacing the original layout structure
- Enhanced the homepage with a campus/governance strip for the four-campus SHOSA model

## Backend
- Added governance-ready schema pieces for: campuses, governance roles, governance assignments
- Seeded four campuses: Main, Mbalala, Green, A Level
- Added metadata endpoints:
  - `GET /api/meta/campuses`
  - `GET /api/meta/governance`
  - `GET /api/admin/governance`
- Preserved the current alumni, SACCO, payment and admin flows

## Governance direction embedded
- 1 central SHOSA executive
- 4 campus committees
- 1 unified SHOSA SACCO
- small super-admin layer to avoid duplicate administrators for the same function
