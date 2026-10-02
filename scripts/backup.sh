#!/usr/bin/env bash
# ==============================================================================
# Nightly Backup Script for Gereh (SPEC §9)
#
# Features:
# 1. Atomic SQLite backup via `sqlite3 .backup` (WAL-safe without stopping the app)
# 2. Complete archive including persistent uploads/ directory
# 3. 7-day retention with automatic cleanup of old backups
# 4. Off-box copy via rsync/scp to secondary server or cloud storage
#
# Crontab schedule (nightly at 03:00):
#   0 3 * * * /path/to/gereh/scripts/backup.sh >> /var/log/gereh/backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Directory of the script and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment variables if .env exists
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

DATABASE_PATH="${DATABASE_PATH:-${PROJECT_ROOT}/gereh.db}"
UPLOADS_DIR="${UPLOADS_DIR:-${PROJECT_ROOT}/uploads}"
BACKUP_ROOT="${BACKUP_ROOT:-${PROJECT_ROOT}/backups}"
RETENTION_DAYS=7

# Resolve relative paths against PROJECT_ROOT (ADR-0003, SPEC §9)
if [[ "${DATABASE_PATH}" != /* ]]; then
  DATABASE_PATH="${PROJECT_ROOT}/${DATABASE_PATH}"
fi
if [[ "${UPLOADS_DIR}" != /* ]]; then
  UPLOADS_DIR="${PROJECT_ROOT}/${UPLOADS_DIR}"
fi
if [[ "${BACKUP_ROOT}" != /* ]]; then
  BACKUP_ROOT="${PROJECT_ROOT}/${BACKUP_ROOT}"
fi

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
TMP_STAGE="${BACKUP_ROOT}/stage_${TIMESTAMP}"
ARCHIVE_NAME="gereh_backup_${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${BACKUP_ROOT}/${ARCHIVE_NAME}"

echo "[backup] Starting backup at $(date -Iseconds)"
mkdir -p "${BACKUP_ROOT}"
mkdir -p "${TMP_STAGE}"

# 1. SQLite atomic online backup
if [ -f "${DATABASE_PATH}" ]; then
  echo "[backup] Backing up SQLite database from ${DATABASE_PATH}..."
  sqlite3 "${DATABASE_PATH}" ".backup '${TMP_STAGE}/gereh.db'"
else
  echo "[backup] WARNING: Database file not found at ${DATABASE_PATH}"
fi

# 2. Copy uploads/ directory if it exists
if [ -d "${UPLOADS_DIR}" ]; then
  echo "[backup] Including uploads directory from ${UPLOADS_DIR}..."
  cp -r "${UPLOADS_DIR}" "${TMP_STAGE}/uploads"
else
  mkdir -p "${TMP_STAGE}/uploads"
fi

# 3. Create compressed tarball
echo "[backup] Packaging archive: ${ARCHIVE_PATH}..."
tar -czf "${ARCHIVE_PATH}" -C "${TMP_STAGE}" .
rm -rf "${TMP_STAGE}"

echo "[backup] Created archive: ${ARCHIVE_PATH} ($(du -h "${ARCHIVE_PATH}" | cut -f1))"

# 4. Retention cleanup: delete backups older than 7 days
echo "[backup] Pruning local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_ROOT}" -maxdepth 1 -name "gereh_backup_*.tar.gz" -type f -mtime "+${RETENTION_DAYS}" -exec echo "[backup] Removing expired backup: {}" \; -delete

# 5. Off-box copy (SPEC §9: "losing gereh.db loses the shop")
# Set REMOTE_BACKUP_DEST in .env (e.g. user@remote-backup-vps:/backups/gereh/)
if [ -n "${REMOTE_BACKUP_DEST:-}" ]; then
  echo "[backup] Syncing backup off-box to ${REMOTE_BACKUP_DEST}..."
  rsync -avz -e "ssh -o StrictHostKeyChecking=no" "${ARCHIVE_PATH}" "${REMOTE_BACKUP_DEST}"
  echo "[backup] Off-box copy completed successfully."
else
  echo "[backup] NOTE: REMOTE_BACKUP_DEST not configured. Off-box copy skipped."
fi

echo "[backup] Backup finished successfully at $(date -Iseconds)"
