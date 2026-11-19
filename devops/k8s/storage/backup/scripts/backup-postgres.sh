#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"
STAGING_DIR="${STAGING_DIR:-/staging}"

echo "[PostgreSQL Backup] Starting database dump from ${DB_HOST}:${DB_PORT}/${DB_NAME}..."

DUMP_OK=0
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>/tmp/dump_err.log | gzip > "${STAGING_DIR}/${BACKUP_FILE}"; then
  FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_FILE}" 2>/dev/null || echo "0")
  if [ "$FILE_SIZE" -gt 100 ]; then
    DUMP_OK=1
  fi
fi

if [ "$DUMP_OK" -eq 0 ]; then
  cat /tmp/dump_err.log 2>/dev/null || true
  if [ "$DB_PORT" = "5432" ]; then
    echo "Notice: Standard port 5432 failed, attempting connection via pooler port 6543..."
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p 6543 -U "$DB_USER" -d "$DB_NAME" | gzip > "${STAGING_DIR}/${BACKUP_FILE}"; then
      FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_FILE}" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" -gt 100 ]; then
        DUMP_OK=1
      fi
    fi
  fi
fi

FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_FILE}" 2>/dev/null || echo "0")
if [ "$DUMP_OK" -eq 0 ] || [ "$FILE_SIZE" -le 100 ]; then
  echo "ERROR: Backup dump failed or generated empty archive (${FILE_SIZE} bytes)!"
  rm -f "${STAGING_DIR}/${BACKUP_FILE}"
  exit 1
fi

cp "${STAGING_DIR}/${BACKUP_FILE}" "${STAGING_DIR}/latest.sql.gz"
echo "${BACKUP_FILE}" > "${STAGING_DIR}/current_backup_filename.txt"

echo "Dump completed successfully (${FILE_SIZE} bytes)."

echo "Cleaning up older backups from ${STAGING_DIR}..."
find "${STAGING_DIR}" -maxdepth 1 -type f -name "*.sql.gz" ! -name "${BACKUP_FILE}" ! -name "latest.sql.gz" -delete 2>/dev/null || true
find "${STAGING_DIR}" -maxdepth 1 -type f \( -name "*.bak" -o -name "*.dmp" -o -name "*.log" \) -delete 2>/dev/null || true

echo "Dump stage finished successfully."
ls -lh "${STAGING_DIR}"
