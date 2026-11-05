#!/bin/bash
set -e

STAGING_DIR="${STAGING_DIR:-/staging}"
TARGET_FILE="${STAGING_DIR}/restore_target.sql.gz"
RESTORE_BAK="${STAGING_DIR}/restore_temp.bak"

if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: Restore file $TARGET_FILE not found!"
  exit 1
fi

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
if [ ! -f "$SQLCMD" ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

DB_PORT="${DB_PORT:-1433}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-$MSSQL_SA_PASSWORD}"
DB_NAME="${DB_NAME:-mesdb}"

echo "[MS SQL Restore] Decompressing $TARGET_FILE..."
gunzip -c "$TARGET_FILE" > "$RESTORE_BAK"

echo "[MS SQL Restore] Restoring database [${DB_NAME}] from ${RESTORE_BAK}..."
$SQLCMD -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C -Q "
  ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  RESTORE DATABASE [${DB_NAME}] FROM DISK = N'${RESTORE_BAK}' WITH REPLACE;
  ALTER DATABASE [${DB_NAME}] SET MULTI_USER;
"

rm -f "$RESTORE_BAK" "$TARGET_FILE"
echo "[MS SQL Restore] Restore completed successfully."
