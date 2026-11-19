#!/bin/sh
set -e

ENGINE="${DB_ENGINE:-postgres}"
ENGINE=$(echo "$ENGINE" | tr '[:upper:]' '[:lower:]')
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================================="
echo " PaaS Restore Dispatcher: Detected Engine = $ENGINE"
echo "=========================================================="

case "$ENGINE" in
  postgres|postgresql)
    echo "Running PostgreSQL restore script..."
    sh "${SCRIPT_DIR}/restore-postgres.sh"
    ;;
  mssql|sqlserver)
    echo "Running MS SQL Server restore script..."
    bash "${SCRIPT_DIR}/restore-mssql.sh"
    ;;
  oracle)
    echo "Running Oracle Database restore script..."
    bash "${SCRIPT_DIR}/restore-oracle.sh"
    ;;
  *)
    echo "Error: Unknown DB_ENGINE '$ENGINE'. Supported engines: postgres, mssql, oracle."
    exit 1
    ;;
esac
