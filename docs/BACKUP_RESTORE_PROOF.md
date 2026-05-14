# SHOSA Backup and Restore Proof

Date: 2026-05-14

## Result

Database backup and restore test completed successfully on local PostgreSQL.

## Evidence

- Source database: seeta_db
- Restore test database: shosa_restore_test
- Restored table count: 22
- Backup file was non-empty and restored successfully.
- Key Prisma tables were verified using a temporary SQL file with quoted identifiers.

## Verified tables

- Alumni
- Payment
- Receipt
- Admin
- AdminDocument

## Commands used

- pg_dump with custom format.
- dropdb --if-exists shosa_restore_test.
- createdb shosa_restore_test.
- pg_restore into shosa_restore_test.
- psql count checks on key tables.

## Production requirement

Before public launch, repeat this same backup and restore drill on the production or staging server using production paths for:

- PostgreSQL database
- uploads directory
- private_admin_documents directory

Backups are not launch-ready until restore has been tested on the real deployment environment.
