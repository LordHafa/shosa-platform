#!/usr/bin/env bash
set -euo pipefail

# SHOSA production backup script.
# Required environment:
#   DATABASE_URL="postgresql://user:password@host:5432/dbname"
#
# Optional environment:
#   BACKUP_DIR="/var/backups/shosa"
#   UPLOADS_DIR="/var/www/shosa/backend/uploads"
#   PRIVATE_DOCS_DIR="/var/www/shosa/backend/private_admin_documents"
#   RETENTION_DAYS=30

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL is not set." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/shosa}"
UPLOADS_DIR="${UPLOADS_DIR:-}"
PRIVATE_DOCS_DIR="${PRIVATE_DOCS_DIR:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

DB_BACKUP="$BACKUP_DIR/shosa_db_$STAMP.sql.gz"
echo "Creating database backup: $DB_BACKUP"
pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP"

if [ -n "$UPLOADS_DIR" ] && [ -d "$UPLOADS_DIR" ]; then
  UPLOADS_BACKUP="$BACKUP_DIR/shosa_uploads_$STAMP.tar.gz"
  echo "Creating uploads backup: $UPLOADS_BACKUP"
  tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
fi

if [ -n "$PRIVATE_DOCS_DIR" ] && [ -d "$PRIVATE_DOCS_DIR" ]; then
  DOCS_BACKUP="$BACKUP_DIR/shosa_private_documents_$STAMP.tar.gz"
  echo "Creating private documents backup: $DOCS_BACKUP"
  tar -czf "$DOCS_BACKUP" -C "$(dirname "$PRIVATE_DOCS_DIR")" "$(basename "$PRIVATE_DOCS_DIR")"
fi

find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -delete

echo "SHOSA backup completed successfully."