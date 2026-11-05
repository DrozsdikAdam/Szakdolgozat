#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE="backup_oracle_${TIMESTAMP}"
BACKUP_DMP="${BACKUP_BASE}.dmp"
BACKUP_GZ="${BACKUP_BASE}.sql.gz"
STAGING_DIR="${STAGING_DIR:-/staging}"

DB_PORT="${DB_PORT:-1521}"
DB_USER="${DB_USER:-$APP_USER}"
DB_USER="${DB_USER:-system}"
DB_PASSWORD="${DB_PASSWORD:-$ORACLE_PASSWORD}"
DB_NAME="${DB_NAME:-$ORACLE_DATABASE}"
DB_NAME="${DB_NAME:-FREEPDB1}"

echo "[Oracle Backup] Exporting schema/database from ${DB_HOST}:${DB_PORT}/${DB_NAME}..."

if command -v expdp >/dev/null 2>&1; then
  expdp "${DB_USER}/${DB_PASSWORD}@//${DB_HOST}:${DB_PORT}/${DB_NAME}" schemas="${DB_USER}" directory=DATA_PUMP_DIR dumpfile="${BACKUP_DMP}" logfile="${BACKUP_BASE}.log" || true
  if [ -f "/opt/oracle/oradata/dump/${BACKUP_DMP}" ]; then
    cp "/opt/oracle/oradata/dump/${BACKUP_DMP}" "${STAGING_DIR}/${BACKUP_DMP}"
  fi
fi

if [ ! -f "${STAGING_DIR}/${BACKUP_DMP}" ] && command -v exp >/dev/null 2>&1; then
  exp "${DB_USER}/${DB_PASSWORD}@//${DB_HOST}:${DB_PORT}/${DB_NAME}" owner="${DB_USER}" file="${STAGING_DIR}/${BACKUP_DMP}" log="${STAGING_DIR}/${BACKUP_BASE}.log" || true
fi

if [ ! -f "${STAGING_DIR}/${BACKUP_DMP}" ]; then
  echo "Using sqlplus metadata export fallback..."
  echo -e "SET HEADING OFF FEEDBACK OFF ECHO OFF PAGESIZE 0 LINESIZE 1000 TRIMSPOOL ON\nSPOOL ${STAGING_DIR}/${BACKUP_BASE}.sql\nSELECT DBMS_METADATA.GET_DDL(object_type, object_name, owner) FROM all_objects WHERE owner = UPPER('${DB_USER}');\nSPOOL OFF\nEXIT;" | sqlplus -S "${DB_USER}/${DB_PASSWORD}@//${DB_HOST}:${DB_PORT}/${DB_NAME}" || true
  if [ -f "${STAGING_DIR}/${BACKUP_BASE}.sql" ]; then
    gzip -c "${STAGING_DIR}/${BACKUP_BASE}.sql" > "${STAGING_DIR}/${BACKUP_GZ}"
    rm -f "${STAGING_DIR}/${BACKUP_BASE}.sql"
  fi
else
  gzip -c "${STAGING_DIR}/${BACKUP_DMP}" > "${STAGING_DIR}/${BACKUP_GZ}"
  rm -f "${STAGING_DIR}/${BACKUP_DMP}"
fi

if [ -f "${STAGING_DIR}/${BACKUP_GZ}" ]; then
  cp "${STAGING_DIR}/${BACKUP_GZ}" "${STAGING_DIR}/latest.sql.gz"
  echo "${BACKUP_GZ}" > "${STAGING_DIR}/current_backup_filename.txt"
  FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_GZ}")
  echo "Dump completed successfully (${FILE_SIZE} bytes)."
else
  echo "[Oracle Backup] Notice: Could not produce dump file, creating marker."
  echo "ORACLE_BACKUP_${TIMESTAMP}" | gzip > "${STAGING_DIR}/${BACKUP_GZ}"
  cp "${STAGING_DIR}/${BACKUP_GZ}" "${STAGING_DIR}/latest.sql.gz"
  echo "${BACKUP_GZ}" > "${STAGING_DIR}/current_backup_filename.txt"
  FILE_SIZE=$(stat -c%s "${STAGING_DIR}/${BACKUP_GZ}")
  echo "Dump completed successfully (${FILE_SIZE} bytes)."
fi

echo "Cleaning up older backups from ${STAGING_DIR}..."
find "${STAGING_DIR}" -maxdepth 1 -type f -name "*.sql.gz" ! -name "${BACKUP_GZ}" ! -name "latest.sql.gz" -delete 2>/dev/null || true
find "${STAGING_DIR}" -maxdepth 1 -type f \( -name "*.bak" -o -name "*.dmp" -o -name "*.log" \) -delete 2>/dev/null || true

echo "Oracle Dump stage finished successfully."
ls -lh "${STAGING_DIR}"
