#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE="backup_mssql_${TIMESTAMP}"
BACKUP_BAK="${BACKUP_BASE}.bak"
BACKUP_GZ="${BACKUP_BASE}.sql.gz"
STAGING_DIR="${STAGING_DIR:-/staging}"

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD" ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

DB_PORT="${DB_PORT:-1433}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-$MSSQL_SA_PASSWORD}"
DB_NAME="${DB_NAME:-mesdb}"

echo "[MS SQL Backup] Starting native backup for ${DB_HOST},${DB_PORT}/${DB_NAME}..."

$SQLCMD -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C -Q "
  BACKUP DATABASE [${DB_NAME}]
  TO DISK = N'${STAGING_DIR}/${BACKUP_BAK}'
  WITH FORMAT, INIT, STATS = 10;
"

echo "[MS SQL Backup] Compressing backup file..."
gzip -c "${STAGING_DIR}/${BACKUP_BAK}" > "${STAGING_DIR}/${BACKUP_GZ}"
cp "${STAGING_DIR}/${BACKUP_GZ}" "${STAGING_DIR}/latest.sql.gz"
echo "${BACKUP_GZ}" > "${STAGING_DIR}/current_backup_filename.txt"
rm -f "${STAGING_DIR}/${BACKUP_BAK}"

FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_GZ}")
echo "Dump completed successfully (${FILE_SIZE} bytes)."

echo "Cleaning up older backups from ${STAGING_DIR}..."
find "${STAGING_DIR}" -maxdepth 1 -type f -name "*.sql.gz" ! -name "${BACKUP_GZ}" ! -name "latest.sql.gz" -delete 2>/dev/null || true
find "${STAGING_DIR}" -maxdepth 1 -type f \( -name "*.bak" -o -name "*.dmp" -o -name "*.log" \) -delete 2>/dev/null || true

echo "MS SQL Dump stage finished successfully."
ls -lh "${STAGING_DIR}"
