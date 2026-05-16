# Echo — Deployment Guide

Full steps to go from zero to a live app: backend on Cloud Run, frontend on Netlify.

---

## Prerequisites

| Tool | Install |
|------|---------|
| `gcloud` CLI | https://cloud.google.com/sdk/docs/install |
| `doppler` CLI | https://docs.doppler.com/docs/install-cli |
| `netlify` CLI (optional) | `npm i -g netlify-cli` |
| Docker (for local test only) | https://docs.docker.com/get-docker/ |
| Node 20+ | https://nodejs.org |

Verify:
```bash
gcloud version
doppler --version
node --version
```

---

## Part 1 — Backend → Google Cloud Run

### 1.1 Authenticate gcloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 1.2 Create or select a GCP project

```bash
# Create new (skip if you already have one)
gcloud projects create echo-pronunciation --name="Echo"

# Set active project
gcloud config set project echo-pronunciation
```

Enable required APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 1.3 Set up Doppler secrets

Doppler keeps secrets out of git. The deploy script reads from it.

```bash
# Install + login
doppler login

# Inside the project root, link to a Doppler project
cd /path/to/Echo
doppler setup   # creates a Doppler project + dev/prd configs if prompted
```

Set the required secrets (replace values with your own):

```bash
doppler secrets set \
  GCP_PROJECT_ID=echo-pronunciation \
  GCP_REGION=us-central1 \
  AR_REPO=echo \
  IMAGE_NAME=echo-api \
  CLOUD_RUN_SERVICE=echo-api \
  ECHO_CORS_ORIGINS=https://echo-pronunciation-23a4fc3a.netlify.app \
  ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

Optional resource tuning (defaults shown):
```bash
doppler secrets set \
  CLOUD_RUN_MEMORY=8Gi \
  CLOUD_RUN_CPU=4 \
  CLOUD_RUN_TIMEOUT=900 \
  WHISPER_MODEL_SIZE=base
```

> **Note:** `WHISPER_MODEL_SIZE=base` uses ~1 GB RAM. Use `tiny` for cheaper cold starts.  
> Cloud Run with Whisper + Kokoro TTS needs **at least 8 GB RAM** — do not reduce below that.

Verify Doppler is injecting correctly:
```bash
doppler run -- printenv | sort | grep -E "GCP|AR_REPO|IMAGE|CLOUD_RUN|ECHO|WHISPER|ELEVEN"
```

### 1.4 Deploy to Cloud Run

```bash
chmod +x scripts/cloud-run-deploy.sh
bash scripts/cloud-run-deploy.sh
```

This script:
1. Runs `gcloud builds submit` — builds Docker image via Cloud Build (no local Docker needed)
2. Pushes image to Artifact Registry
3. Deploys to Cloud Run with your env vars
4. Prints the live service URL at the end

**Save that URL** — you need it in Part 2.

Example output:
```
Done. Service URL:
https://echo-api-abc123xyz-uc.a.run.app
```

### 1.5 Verify backend is live

```bash
BACKEND_URL=https://echo-api-abc123xyz-uc.a.run.app

curl $BACKEND_URL/health
# Expected: {"status":"ok","whisper":true,"elevenlabs_tts":true,...}

curl "$BACKEND_URL/api/sentences?level=A1&language=en&limit=1"
# Expected: {"sentences":[{"id":...,"text":"..."}]}
```

---

## Part 2 — Frontend → Netlify

### 2.1 Set environment variable in Netlify

Go to: **Netlify dashboard → your site → Site configuration → Environment variables**

Add:
```
VITE_API_ORIGIN = https://echo-api-abc123xyz-uc.a.run.app
```

Replace the URL with the actual Cloud Run URL from step 1.4.

> This is the root cause of the broken demo. Without it, API calls hit Netlify itself (404).

### 2.2 Deploy frontend

Push current branch — Netlify auto-deploys on push:

```bash
git add frontend/public/_redirects frontend/src/components/MicRecorder.tsx frontend/src/hooks/useMicrophone.ts
git commit -m "fix: SPA routing + mobile canvas overflow"
git push origin HEAD
```

Or trigger manually from Netlify dashboard: **Deploys → Trigger deploy → Deploy site**.

### 2.3 Verify frontend is live

Open https://echo-pronunciation-23a4fc3a.netlify.app and confirm:

- [ ] Home `/` loads a sentence card (not error)
- [ ] `/progress` loads (not 404)
- [ ] `/settings` loads (not 404)
- [ ] Mic button works (needs HTTPS — Netlify provides this)
- [ ] TTS "Listen" button plays audio after sentence loads
- [ ] Mobile layout has no horizontal scroll

---

## Part 3 — Run automated test suite

After deploy, verify everything end-to-end:

```bash
python3 scripts/test_webapp.py
# or against a different URL:
python3 scripts/test_webapp.py --url https://echo-pronunciation-23a4fc3a.netlify.app
```

Expected: 20/20 pass. Screenshots saved to `/tmp/echo_*.png`.

---

## Redeploy after code changes

| What changed | Command |
|-------------|---------|
| Backend code | `bash scripts/cloud-run-deploy.sh` |
| Frontend code | `git push` (Netlify auto-deploys) |
| Secrets/env vars | `doppler secrets set KEY=value` then redeploy backend |
| Netlify env vars | Update in dashboard → Trigger deploy |

---

## Troubleshooting

### API returns 404 from frontend
`VITE_API_ORIGIN` not set in Netlify. See step 2.1.

### Cloud Run build fails — out of memory
Add to `gcloud builds submit`: `--machine-type=E2_HIGHCPU_8`.  
Or set `--memory=16Gi` in the deploy script.

### Cold start timeout (30s+)
Whisper + Kokoro take time to load. Options:
- Set `WHISPER_MODEL_SIZE=tiny` in Doppler
- Set min instances: add `--min-instances=1` to the `gcloud run deploy` command in `scripts/cloud-run-deploy-inner.sh` (costs ~$30/mo)

### CORS errors in browser
`ECHO_CORS_ORIGINS` in Doppler must exactly match the Netlify URL (no trailing slash).  
Check: `doppler secrets get ECHO_CORS_ORIGINS`

### Netlify `/progress` still 404 after push
Check that `frontend/public/_redirects` contains `/* /index.html 200` and was committed.

### Canvas waveform tiny on mobile
Already fixed in `MicRecorder.tsx` + `useMicrophone.ts`. Make sure those changes are committed and deployed.

---

## Cost estimate (GCP)

| Service | Usage | ~Monthly cost |
|---------|-------|--------------|
| Cloud Run (CPU only) | Light traffic, min-instances=0 | < $5 |
| Cloud Run (sustained) | min-instances=1, 4 CPU / 8 GB | ~$80 |
| Artifact Registry | 1 image ~3 GB | ~$0.30 |
| Cloud Build | Per deploy (~5 min) | ~$0.02/deploy |

Netlify free tier covers the frontend with no cost.
