#!/usr/bin/env bash
# Snapshot models + caches to a portable tarball.
# Useful for disaster recovery: PC dies → restore on another box.
#
# Usage:
#   ./backup.sh                         # writes to $ECHO_DATA_DIR/../echo-backup-<date>.tar
#   ./backup.sh /mnt/external/echo.tar  # custom output
#   DEST=user@host:/path ./backup.sh    # rsync to remote
set -euo pipefail
cd "$(dirname "$0")"
source .env

: "${ECHO_DATA_DIR:?}"

DATE=$(date +%Y%m%d-%H%M%S)
OUT="${1:-$(dirname "$ECHO_DATA_DIR")/echo-backup-${DATE}.tar}"

echo "=== Backing up $ECHO_DATA_DIR → $OUT ==="
echo "(this includes all downloaded models, ~3-5GB typical)"

# Stop services for consistent snapshot (optional but safe)
echo "Stopping stack..."
docker compose --env-file .env -f docker-compose.echo.yml stop

tar -cf "$OUT" \
  --exclude='*/cache/*' \
  -C "$(dirname "$ECHO_DATA_DIR")" \
  "$(basename "$ECHO_DATA_DIR")" \
  .env docker-compose.echo.yml bootstrap.sh smoke.sh

echo "Restarting stack..."
docker compose --env-file .env -f docker-compose.echo.yml start

if [[ -n "${DEST:-}" ]]; then
  echo "Syncing to $DEST..."
  rsync -aP "$OUT" "$DEST/"
fi

SIZE=$(du -h "$OUT" | awk '{print $1}')
echo "=== Backup done: $OUT ($SIZE) ==="
