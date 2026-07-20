#!/usr/bin/env bash
# deploy.sh — One-command deploy Echo backend to Google Cloud Run
# Prerequisites: gcloud CLI installed, authenticated, project set

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION=${REGION:-us-central1}
SERVICE_NAME=${SERVICE_NAME:-echo-backend}
IMAGE=gcr.io/$PROJECT_ID/$SERVICE_NAME

echo "▶ Project: $PROJECT_ID"
echo "▶ Region:  $REGION"
echo "▶ Service: $SERVICE_NAME"

# ─── 1. Enable required APIs ───
echo "▶ Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet 2>/dev/null || true

# ─── 2. Store secrets (if not already) ───
if ! gcloud secrets describe echo-elevenlabs-key --project="$PROJECT_ID" &>/dev/null; then
  echo "▶ Creating secret for ELEVENLABS_API_KEY"
  echo -n "${ELEVENLABS_API_KEY:-placeholder}" | \
    gcloud secrets create echo-elevenlabs-key \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
else
  echo "✔ Secret echo-elevenlabs-key already exists"
fi

# ─── 3. Build & push container ───
echo "▶ Building container image..."
gcloud builds submit \
  --tag "$IMAGE" \
  --project="$PROJECT_ID" \
  --timeout=1200s \
  .

# ─── 4. Deploy to Cloud Run ───
echo "▶ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --memory=4Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=3 \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="^||^WHISPER_MODEL_SIZE=base||ECHO_CORS_ORIGINS=https://echo-pronunciation.netlify.app,http://localhost:5173" \
  --set-secrets="ELEVENLABS_API_KEY=echo-elevenlabs-key:latest" \
  --project="$PROJECT_ID"

# ─── 5. Get the service URL ───
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format='value(status.url)')

echo ""
echo "✅ Deployed successfully!"
echo ""
echo "   Backend URL: $SERVICE_URL"
echo ""
echo "   Next steps:"
echo "   1. Set this in Netlify:"
echo "      VITE_API_ORIGIN=$SERVICE_URL"
echo "   2. Trigger a Netlify redeploy (Settings → Build & Deploy → Trigger deploy)"
echo "   3. Test at: https://echo-pronunciation.netlify.app/"
echo ""