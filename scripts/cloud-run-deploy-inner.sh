#!/usr/bin/env bash
# Invoked only via: scripts/cloud-run-deploy.sh (under doppler run).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Allow GCP's conventional name in Doppler if you prefer it over GCP_PROJECT_ID
GCP_PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"

missing=()
[[ -z "${GCP_PROJECT_ID:-}" ]] && missing+=("GCP_PROJECT_ID (or GOOGLE_CLOUD_PROJECT)")
[[ -z "${GCP_REGION:-}" ]] && missing+=("GCP_REGION")
[[ -z "${AR_REPO:-}" ]] && missing+=("AR_REPO")
[[ -z "${IMAGE_NAME:-}" ]] && missing+=("IMAGE_NAME")
[[ -z "${CLOUD_RUN_SERVICE:-}" ]] && missing+=("CLOUD_RUN_SERVICE")
[[ -z "${ECHO_CORS_ORIGINS:-}" ]] && missing+=("ECHO_CORS_ORIGINS")

if ((${#missing[@]})); then
  echo "Missing Doppler secrets (names are case-sensitive):" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  echo >&2
  echo "In the Doppler project linked to this repo (run: doppler setup), add them. Example:" >&2
  echo "  cd $ROOT && doppler secrets set GCP_PROJECT_ID=my-proj GCP_REGION=us-central1 \\" >&2
  echo "    AR_REPO=echo IMAGE_NAME=echo-api CLOUD_RUN_SERVICE=echo-api \\" >&2
  echo "    ECHO_CORS_ORIGINS=https://your-site.netlify.app" >&2
  echo >&2
  echo "List what Doppler is injecting: doppler run -- printenv | sort" >&2
  exit 1
fi

WHISPER_MODEL_SIZE="${WHISPER_MODEL_SIZE:-base}"
IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${IMAGE_NAME}:latest"

gcloud config set project "${GCP_PROJECT_ID}"

gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${GCP_REGION}" 2>&1 | grep -v "ALREADY_EXISTS" || true

gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

gcloud builds submit --tag "${IMAGE}" .

gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --image "${IMAGE}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory "${CLOUD_RUN_MEMORY:-8Gi}" \
  --cpu "${CLOUD_RUN_CPU:-4}" \
  --timeout "${CLOUD_RUN_TIMEOUT:-900}" \
  --set-env-vars "ECHO_CORS_ORIGINS=${ECHO_CORS_ORIGINS},WHISPER_MODEL_SIZE=${WHISPER_MODEL_SIZE},ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-}"

echo "Done. Service URL:"
gcloud run services describe "${CLOUD_RUN_SERVICE}" --region "${GCP_REGION}" --format='value(status.url)'
