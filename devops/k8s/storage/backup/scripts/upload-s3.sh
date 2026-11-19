#!/bin/sh
set -e

echo "=== [PaaS S3 Upload] Starting backup upload ==="
echo "Connecting to MinIO/S3 endpoint: $S3_ENDPOINT"
mc alias set remote "$S3_ENDPOINT" "$S3_ACCESS_KEY" "$S3_SECRET_KEY" --api s3v4

echo "Ensuring S3 bucket '$S3_BUCKET' exists..."
mc mb --ignore-existing "remote/$S3_BUCKET" 2>/dev/null || true

BACKUP_FILE=$(cat /staging/current_backup_filename.txt 2>/dev/null || echo "")

if [ -n "$BACKUP_FILE" ] && [ -f "/staging/$BACKUP_FILE" ]; then
  FILE_SIZE=$(stat -c%s "/staging/$BACKUP_FILE" 2>/dev/null || echo "0")
  echo "Uploading $BACKUP_FILE ($FILE_SIZE bytes) to remote/$S3_BUCKET/manual/ and archive/ and daily/..."
  mc cp "/staging/$BACKUP_FILE" "remote/$S3_BUCKET/manual/$BACKUP_FILE"
  mc cp "/staging/$BACKUP_FILE" "remote/$S3_BUCKET/daily/$BACKUP_FILE"
  mc cp "/staging/$BACKUP_FILE" "remote/$S3_BUCKET/archive/$BACKUP_FILE"
else
  echo "Warning: /staging/current_backup_filename.txt was empty or file does not exist."
fi

if [ -f "/staging/latest.sql.gz" ]; then
  echo "Uploading latest.sql.gz to remote/$S3_BUCKET/latest.sql.gz..."
  mc cp /staging/latest.sql.gz "remote/$S3_BUCKET/latest.sql.gz"
fi

echo "Upload finished successfully! Current bucket contents:"
mc ls -r "remote/$S3_BUCKET"

echo "Cleaning up local /staging: keeping ONLY the latest backup..."
find /staging -maxdepth 1 -type f -name "*.sql.gz" ! -name "$BACKUP_FILE" ! -name "latest.sql.gz" -delete 2>/dev/null || true
find /staging -maxdepth 1 -type f \( -name "*.bak" -o -name "*.dmp" -o -name "*.log" \) -delete 2>/dev/null || true

echo "Current local /staging storage status:"
ls -lh /staging
echo "=== [PaaS S3 Upload] Completed successfully ==="

