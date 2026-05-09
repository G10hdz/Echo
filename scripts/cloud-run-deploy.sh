#!/usr/bin/env bash
# Deploy Echo API to Cloud Run using secrets from Doppler (no .env files in git).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v doppler >/dev/null 2>&1; then
  echo "Install Doppler CLI: https://docs.doppler.com/docs/install-cli" >&2
  exit 1
fi

cd "$ROOT"
# Default to this folder's linked config (same as `doppler secrets set` with no flags).
# Passing a config name as $1 or DOPPLER_CONFIG still overrides (e.g. prd).
LINKED_CONFIG="$(doppler configure get config --plain 2>/dev/null || true)"
CONFIG="${1:-${DOPPLER_CONFIG:-${LINKED_CONFIG:-prd}}}"
echo "Doppler: project=$(doppler configure get project --plain 2>/dev/null || echo '?') config=$CONFIG" >&2
exec doppler run --config "$CONFIG" -- "$ROOT/scripts/cloud-run-deploy-inner.sh"
