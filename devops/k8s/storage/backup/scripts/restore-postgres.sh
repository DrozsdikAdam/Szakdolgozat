#!/bin/sh
set -e

STAGING_DIR="${STAGING_DIR:-/staging}"
TARGET_FILE="${STAGING_DIR}/restore_target.sql.gz"

if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: Restore file $TARGET_FILE not found!"
  exit 1
fi

echo "[PostgreSQL Restore] Restoring database into ${DB_PRIMARY_HOST:-$DB_HOST}:${DB_PORT}/${DB_NAME}..."
gunzip -c "$TARGET_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "${DB_PRIMARY_HOST:-$DB_HOST}" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

rm -f "$TARGET_FILE"
echo "[PostgreSQL Restore] Restore completed successfully."
