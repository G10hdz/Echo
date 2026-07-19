#!/usr/bin/env bash
# One-shot bootstrap on a fresh Linux box.
# Prereqs: docker, docker compose plugin, curl.
#
# Usage:
#   cp .env.example .env
#   # edit ECHO_DATA_DIR if /mnt/ssd isn't right
#   ./bootstrap.sh
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing. Run: cp .env.example .env"
  exit 1
fi

source .env

: "${ECHO_DATA_DIR:?ECHO_DATA_DIR not set in .env}"

echo "=== Echo stack bootstrap ==="
echo "Data dir: $ECHO_DATA_DIR"

# 1) Disk space sanity
free_mb=$(df -m "$(dirname "$ECHO_DATA_DIR")" | awk 'NR==2 {print $4}')
if (( free_mb < 10240 )); then
  echo "WARN: only ${free_mb}MB free on $(dirname "$ECHO_DATA_DIR") — need ≥10GB"
fi

mkdir -p "$ECHO_DATA_DIR"/{kokoro/{models,cache},whisper/models,scorer/{hf,models},rhubarb/jobs,piper/{voices,cache},edge-tts/cache}

# 2) Docker sanity
if ! command -v docker >/dev/null; then
  echo "ERROR: docker not installed. Install: curl -fsSL https://get.docker.com | sh"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin missing."
  exit 1
fi

# 3) Move docker data root if / is tight (idempotent, asks first)
root_free=$(df -m / | awk 'NR==2 {print $4}')
if (( root_free < 10000 )) && [[ ! -f /etc/docker/daemon.json ]]; then
  echo "Root filesystem tight (${root_free}MB free). Move docker data to $ECHO_DATA_DIR/docker-data?"
  read -r -p "[y/N] " ans
  if [[ "$ans" == "y" ]]; then
    sudo systemctl stop docker docker.socket
    sudo mkdir -p "$ECHO_DATA_DIR/docker-data"
    sudo rsync -aP /var/lib/docker/ "$ECHO_DATA_DIR/docker-data/"
    sudo mkdir -p /etc/docker
    echo "{\"data-root\": \"$ECHO_DATA_DIR/docker-data\"}" | sudo tee /etc/docker/daemon.json
    sudo systemctl start docker
    echo "Docker data moved. Verify with: docker info | grep 'Docker Root Dir'"
  fi
fi

# 4) Build + pull
echo "=== Pulling and building images ==="
docker compose --env-file .env -f docker-compose.echo.yml pull --ignore-pull-failures
docker compose --env-file .env -f docker-compose.echo.yml build

# 5) Up
echo "=== Starting stack ==="
docker compose --env-file .env -f docker-compose.echo.yml up -d

# 6) Wait for health (some services take 2-3 min on first model download)
echo "=== Waiting for services to come up (max 5 min) ==="
for port in "${KOKORO_PORT:-5315}" "${WHISPER_PORT:-5316}" "${SCORER_PORT:-5317}" "${RHUBARB_PORT:-5318}" "${PIPER_PORT:-5319}" "${EDGE_PROXY_PORT:-5320}"; do
  echo -n "  port $port: "
  for i in {1..60}; do
    if curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1; then
      echo "ok"; break
    fi
    echo -n "."; sleep 5
  done
  if ! curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1; then
    echo "TIMEOUT"
  fi
done

echo ""
echo "=== Done. Run ./smoke.sh to verify endpoints. ==="
docker compose --env-file .env -f docker-compose.echo.yml ps
