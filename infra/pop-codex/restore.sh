#!/usr/bin/env bash
# Restore echo stack from a backup tarball on a fresh box.
#
# Usage:
#   ./restore.sh /path/to/echo-backup-YYYYMMDD-HHMMSS.tar
set -euo pipefail
cd "$(dirname "$0")"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup.tar>"
  exit 1
fi
BACKUP="$1"
if [[ ! -f "$BACKUP" ]]; then
  echo "Backup not found: $BACKUP"
  exit 1
fi

# Extract into CWD (overwrites .env + docker-compose + services/* + data dir if relative)
echo "=== Extracting $BACKUP ==="
tar -xf "$BACKUP" -C .

if [[ ! -f .env ]]; then
  echo "ERROR: backup missing .env — corrupt or wrong format"
  exit 1
fi

source .env
echo "Restored config: ECHO_DATA_DIR=$ECHO_DATA_DIR"

# Now run bootstrap which will start everything from the restored state.
echo "=== Running bootstrap ==="
exec ./bootstrap.sh
