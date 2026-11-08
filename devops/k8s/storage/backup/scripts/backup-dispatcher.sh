#!/bin/sh
set -e

ENGINE="${DB_ENGINE:-postgres}"
ENGINE=$(echo "$ENGINE" | tr '[:upper:]' '[:lower:]')
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================================="
echo " PaaS Backup Dispatcher: Detected Engine = $ENGINE"
echo "=========================================================="

case "$ENGINE" in
  postgres|postgresql)
    echo "Running PostgreSQL backup script..."
    sh "${SCRIPT_DIR}/backup-postgres.sh"
    ;;
  mssql|sqlserver)
    echo "Running MS SQL Server backup script..."
    bash "${SCRIPT_DIR}/backup-mssql.sh"
    ;;
  oracle)
    echo "Running Oracle Database backup script..."
    bash "${SCRIPT_DIR}/backup-oracle.sh"
    ;;
  *)
    echo "Error: Unknown DB_ENGINE '$ENGINE'. Supported engines: postgres, mssql, oracle."
    exit 1
    ;;
esac
