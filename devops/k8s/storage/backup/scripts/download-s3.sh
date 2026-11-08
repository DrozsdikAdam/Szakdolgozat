#!/bin/sh
set -e

echo "=== [PaaS S3 Download] Starting download for restore ==="
TARGET_BACKUP="${TARGET_BACKUP:-latest}"
echo "Connecting to MinIO/S3 endpoint: $S3_ENDPOINT"
mc alias set remote "$S3_ENDPOINT" "$S3_ACCESS_KEY" "$S3_SECRET_KEY" --api s3v4

mkdir -p /staging

if [ "$TARGET_BACKUP" = "latest" ]; then
  if [ -f "/staging/latest.sql.gz" ]; then
    echo "Using existing local latest backup from /staging/latest.sql.gz"
    cp /staging/latest.sql.gz /staging/restore_target.sql.gz
  else
    echo "Downloading latest backup from remote/$S3_BUCKET/latest.sql.gz..."
    mc cp "remote/$S3_BUCKET/latest.sql.gz" /staging/restore_target.sql.gz
  fi
else
  echo "Locating target backup '$TARGET_BACKUP' in remote/$S3_BUCKET/..."
  if mc stat "remote/$S3_BUCKET/archive/$TARGET_BACKUP" >/dev/null 2>&1; then
    echo "Found in archive/, downloading..."
    mc cp "remote/$S3_BUCKET/archive/$TARGET_BACKUP" /staging/restore_target.sql.gz
  elif mc stat "remote/$S3_BUCKET/manual/$TARGET_BACKUP" >/dev/null 2>&1; then
    echo "Found in manual/, downloading..."
    mc cp "remote/$S3_BUCKET/manual/$TARGET_BACKUP" /staging/restore_target.sql.gz
  elif mc stat "remote/$S3_BUCKET/daily/$TARGET_BACKUP" >/dev/null 2>&1; then
    echo "Found in daily/, downloading..."
    mc cp "remote/$S3_BUCKET/daily/$TARGET_BACKUP" /staging/restore_target.sql.gz
  elif mc stat "remote/$S3_BUCKET/$TARGET_BACKUP" >/dev/null 2>&1; then
    echo "Found in bucket root, downloading..."
    mc cp "remote/$S3_BUCKET/$TARGET_BACKUP" /staging/restore_target.sql.gz
  else
    echo "ERROR: Backup file '$TARGET_BACKUP' not found in remote/$S3_BUCKET"
    exit 1
  fi
fi

echo "Download completed successfully. Restore staging file:"
ls -lh /staging/restore_target.sql.gz
echo "=== [PaaS S3 Download] Completed successfully ==="

