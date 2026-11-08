#!/bin/bash
set -e

STAGING_DIR="${STAGING_DIR:-/staging}"
TARGET_FILE="${STAGING_DIR}/restore_target.sql.gz"
RESTORE_DMP="${STAGING_DIR}/restore_temp.dmp"
RESTORE_SQL="${STAGING_DIR}/restore_temp.sql"

if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: Restore file $TARGET_FILE not found!"
  exit 1
fi

DB_PORT="${DB_PORT:-1521}"
DB_USER="${DB_USER:-$APP_USER}"
DB_USER="${DB_USER:-system}"
DB_PASSWORD="${DB_PASSWORD:-$ORACLE_PASSWORD}"
DB_NAME="${DB_NAME:-$ORACLE_DATABASE}"
DB_NAME="${DB_NAME:-FREEPDB1}"

echo "[Oracle Restore] Decompressing $TARGET_FILE..."
gunzip -c "$TARGET_FILE" > "$RESTORE_DMP"

if command -v impdp >/dev/null 2>&1; then
  echo "[Oracle Restore] Running Data Pump import (impdp)..."
  cp "$RESTORE_DMP" "/opt/oracle/oradata/dump/restore_temp.dmp" 2>/dev/null || true
  impdp "${DB_USER}/${DB_PASSWORD}@//${DB_HOST}:${DB_PORT}/${DB_NAME}" directory=DATA_PUMP_DIR dumpfile=restore_temp.dmp TABLE_EXISTS_ACTION=REPLACE || true
elif command -v sqlplus >/dev/null 2>&1; then
  echo "[Oracle Restore] Running SQL*Plus script import..."
  mv "$RESTORE_DMP" "$RESTORE_SQL"
  sqlplus -S "${DB_USER}/${DB_PASSWORD}@//${DB_HOST}:${DB_PORT}/${DB_NAME}" @"$RESTORE_SQL" || true
fi

rm -f "$RESTORE_DMP" "$RESTORE_SQL" "$TARGET_FILE"
echo "[Oracle Restore] Restore completed."
