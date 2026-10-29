# Echo Architecture

Echo is an AI pronunciation practice app. The frontend is a React SPA hosted on Netlify. The backend is a FastAPI service on Google Cloud Run that transcribes, scores, and synthesizes audio. There is no real user account system; the product runs as a public demo.

Deployment procedures live in [DEPLOY.md](./DEPLOY.md). This document covers architecture, flows, and known limitations, not how to deploy.

## Overview

```
Browser (React SPA on Netlify)
   │  VITE_API_ORIGIN (Cloud Run URL)
   ▼
Cloud Run: FastAPI (echo-backend)
   ├── ElevenLabs API  (external TTS, primary)
   ├── faster-whisper  (in-process STT, CPU)
   ├── Kokoro TTS      (in-process local fallback)
   └── SQLite          (echo.db, ephemeral container filesystem)
```

- Frontend: React 19 + TypeScript + Vite, Tailwind CSS, react-router-dom, TanStack Query, Recharts, Framer Motion. Hosted on Netlify, published from `frontend/dist`.
- Backend: FastAPI, single process, single container image. Runs `uvicorn main:app`. Mounted at `/audio` for cached TTS files.
- TTS: ElevenLabs API when `ELEVENLABS_API_KEY` is set, otherwise Kokoro (local, container-resident).
- STT: faster-whisper, loaded in-process with CPU torch.
- Storage: SQLite at `echo.db` (or `ECHO_DB_PATH`). On Cloud Run there is no attached disk, so the database and the TTS cache live on the container's ephemeral filesystem.

## Repository map

| Path | Responsibility |
|------|----------------|
| `frontend/` | React/Vite SPA |
| `frontend/src/pages/` | Home, Practice, Results, Progress, Settings, Onboarding, Mandarin practice |
| `frontend/src/components/` | MicRecorder, WaveComparison, ScoreDisplay, SentenceCard, Sidebar, ProgressChart, Mandarin UI |
| `frontend/src/services/api.ts` | All backend calls, retry logic, settings persistence |
| `frontend/src/lib/mandarin/` | Pinyin parsing, tone colors, client-side pitch extraction and tone scoring |
| `frontend/src/hooks/useMicrophone.ts` | MediaRecorder capture to WebM blobs |
| `frontend/src/types/index.ts` | API contracts, settings, Mandarin tone types |
| `frontend/src/App.tsx` | Routes, animated page wrapper, onboarding gate, error boundary |
| `frontend/public/_redirects` | SPA fallback, `/* /index.html 200` |
| `backend/main.py` | FastAPI app, all endpoints, ffmpeg conversion, optional-service wiring |
| `backend/database.py` | SQLite manager, schema, sentence seeding, progress aggregation |
| `backend/scoring.py` | Word-level (latin) and character-level (CJK) Levenshtein scoring |
| `backend/whisper_service.py` | faster-whisper transcription with word timestamps |
| `backend/elevenlabs_service.py` | ElevenLabs TTS, WAV header wrapping |
| `backend/kokoro_service.py` | Kokoro TTS with es/en/zh pipelines |
| `backend/util.py` | `tts_cache_name`, stable TTS cache filenames |
| `backend/models.py` | Pydantic request/response models |
| `backend/tests/` | pytest unit tests for scoring and TTS cache naming |
| `Dockerfile` | Backend image, ffmpeg + espeak-ng + CPU torch |
| `cloudbuild.yaml`, `deploy.sh` | Manual Cloud Run deployment fallbacks |
| `scripts/` | `cloud-run-deploy.sh` (Doppler), `dev-start.sh`, load tests |
| `docker-compose.yml` | Local full stack with persistent DB volume |
| `netlify.toml`, `.github/workflows/` | Netlify config and CI/CD |

## Module responsibilities (backend)

- `main.py` owns the HTTP layer. At import time it tries to load Whisper, ElevenLabs, and Kokoro, each wrapped in try/except so a missing service degrades instead of crashing. Services report availability in `/health`.
- `database.py` creates the schema (users, practice_sessions, user_progress, sentence_library), seeds the sentence library when empty, and computes progress aggregates. `streak_days` exists in the schema but is never updated; it stays at 0.
- `scoring.py` compares expected vs. actual text with Levenshtein `ratio`. Latin text is scored word by word; Chinese (zh) is scored per character. Grades map from 0.50 to 1.00 onto F through A+.
- `whisper_service.py` loads the model during process startup (torch CPU, int8), downloading missing model files from Hugging Face. Default model size is `base` via the container env, though the code default is `medium`.
- `elevenlabs_service.py` calls the ElevenLabs API (`eleven_multilingual_v2`) and writes raw PCM into a WAV file. Only active when the API key is present.
- `kokoro_service.py` loads three Kokoro pipelines (en/es/zh) at import, using espeak-ng for phonemization. Used only when ElevenLabs is unavailable.
- `util.py` builds cache filenames from `sha1(provider:language:text)` so identical requests reuse one file.

## Request flows

### Full practice analysis (main path)

`POST /api/practice/analyze`, called by the practice page with a recorded WebM plus `expected_text`:

1. ffmpeg converts the upload to 16 kHz mono WAV.
2. A practice session row is created with the caller-supplied `user_id`.
3. Whisper transcribes the WAV. If Whisper is unavailable, transcription stays empty.
4. If there is a transcription, the scorer compares it with the expected text.
5. TTS is generated for the expected text (ElevenLabs preferred, Kokoro fallback) and cached in `audio_cache/`. TTS failure is non-blocking.
6. The session is saved with score, grade, transcription, and flagged words. An empty transcription still saves a session with score 0 and grade "N/A".
7. Returns session_id, transcription, word timings, score, and `tts_url` pointing at `/audio/...`.

The frontend plays `tts_url` through `mediaUrl()` and renders the waveform comparison client-side.

### Listen to a sentence (reference audio)

`POST /api/tts` generates and returns `audio_url`. `GET /audio/{name}` serves the cached WAV. The cache is keyed by provider, language, and text; files are regenerated after a cold start because the cache is ephemeral.

### Progress and sentence library

- `GET /api/progress/{user_id}` returns aggregate stats and the 10 most recent sessions for that user_id.
- `GET /api/sentences?level=A1&language=en&limit=10` returns random sentences from the seeded library.

## API endpoints

All endpoints from `backend/main.py`. The backend is deployed with `--allow-unauthenticated`.

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| GET | `/health` | Service status and availability flags | Version, whisper, elevenlabs_tts, kokoro_tts, scorer, database |
| POST | `/api/transcribe` | Transcribe uploaded audio | 503 if Whisper unavailable; 413 over 10 MB; 400 on ffmpeg failure |
| POST | `/api/score` | Score expected vs. actual text | JSON body, no audio |
| POST | `/api/tts` | Generate reference audio | 503 if no TTS provider; prefers ElevenLabs |
| POST | `/api/practice/start` | Open a practice session | Returns session_id |
| POST | `/api/practice/complete` | Save a session result | Updates progress aggregates |
| GET | `/api/progress/{user_id}` | User progress stats | No auth on the user_id |
| GET | `/api/sentences` | Random practice sentences | Query: level, language, limit |
| POST | `/api/practice/analyze` | Full analyze pipeline in one call | Main practice flow, see above |
| GET | `/audio/{name}` | Serve cached TTS WAV | Static mount of `audio_cache/` |

## Environment variables

Backend (read at import time):

| Variable | Default | Purpose |
|----------|---------|---------|
| `ELEVENLABS_API_KEY` | unset | Enables ElevenLabs TTS; mounted from Secret Manager on Cloud Run |
| `WHISPER_MODEL_SIZE` | `base` (container), `medium` (code) | faster-whisper model size |
| `ECHO_CORS_ORIGINS` | localhost:5173, localhost:3000 | Comma-separated allowed browser origins |
| `ECHO_DB_PATH` | `echo.db` | SQLite path; only set in docker-compose |
| `PORT` | 8080 | uvicorn port |

Deploy-time variables for `scripts/cloud-run-deploy.sh` come from Doppler: `GCP_PROJECT_ID`, `GCP_REGION`, `AR_REPO`, `IMAGE_NAME`, `CLOUD_RUN_SERVICE`, `ECHO_CORS_ORIGINS`, `ELEVENLABS_API_KEY`, and optional `WHISPER_MODEL_SIZE`, `CLOUD_RUN_MEMORY`, `CLOUD_RUN_CPU`, `CLOUD_RUN_TIMEOUT`.

Frontend (build-time):

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_ORIGIN` | hardcoded `https://echo-backend-527601165113.us-central1.run.app` | API base URL; no trailing slash |

This is the only frontend variable the code actually reads. The `VITE_ELEVENLABS_API_KEY` and `VITE_API_URL` names in README.md are stale.

## Local development

Quick start:

```bash
bash scripts/dev-start.sh
```

This activates `backend/.venv`, deletes `echo.db` for a fresh session, starts uvicorn on port 8000, and starts Vite on port 5173.

Manual backend:

```bash
cd backend
source .venv/bin/activate        # or create with: python -m venv .venv
pip install -r requirements.txt  # dev extras: -r requirements-dev.txt
uvicorn main:app --port 8000 --reload
```

Manual frontend:

```bash
cd frontend
npm install
npm run dev
```

In dev, Vite proxies `/api` and `/audio` to `localhost:8000`, so `VITE_API_ORIGIN` can stay unset. API docs live at `http://localhost:8000/docs`. Alternative full stack via `docker compose up` (uses a named volume for SQLite).

## Verification commands

```bash
# Backend unit tests (7 tests: 5 scoring + 2 TTS cache)
cd backend && .venv/bin/python -m pytest tests/ -q

# Backend syntax check
.venv/bin/python -m py_compile main.py scoring.py whisper_service.py \
  kokoro_service.py elevenlabs_service.py database.py models.py util.py

# Frontend type check and build
cd frontend && npx tsc --noEmit && npm run build

# Local health check
curl http://localhost:8000/health
```

Playwright smoke tests against the live site live in `scripts/test_webapp.py` and the load checks in `scripts/test_practice_load.py` and `scripts/test_progress_load.py`. Details on the deploy-time test suite are in [DEPLOY.md](./DEPLOY.md).

## Production limitations

These are known limitations of the current demo.

### Ephemeral SQLite on Cloud Run

No persistent volume is mounted on the Cloud Run service, so `echo.db` lives in the container filesystem. Any instance recycle or cold start wipes sessions and progress. `docker-compose.yml` persists the DB locally with a named volume, but the Cloud Run deploys do not. The audit explicitly accepted this for the demo.

### Caller-supplied, unauthenticated user IDs

There is no auth anywhere. The service is deployed with `--allow-unauthenticated`, and `user_id` is just a string the caller picks. `api.ts` defaults to `web-user-001` and the endpoint defaults to `web-user`. Anyone who guesses another user's ID can read or overwrite that progress.

### Public, expensive ML endpoints

`/api/practice/analyze`, `/api/transcribe`, and `/api/tts` are open, unauthenticated, and unpaced. Every call can load and run a torch-based Whisper transcription or a TTS generation on Cloud Run CPU, which costs money and is trivially abusable as a denial-of-service or billing vector. The only guard is a 10 MB upload cap.

### Heavy cold starts

`min-instances` is 0. A cold start loads torch, the faster-whisper model, three Kokoro pipelines, and espeak-ng, which regularly takes 30 seconds or more (documented in DEPLOY.md troubleshooting). The image is built with `--memory=4Gi` (2 CPU) via cloudbuild/deploy.sh; the Doppler-based inner script defaults higher to 8Gi/4 CPU. Suggested mitigations, `WHISPER_MODEL_SIZE=tiny` and `min-instances=1`, are covered in DEPLOY.md.

### Runtime model availability and readiness

The backend image installs faster-whisper but does not bundle its model files. `WhisperService` downloads the selected model during process startup. If that download fails, `main.py` catches the error and starts without STT; `/health` still returns `status: healthy`. Its database flag is also constant rather than a database probe. Production needs a pinned model baked into the image and a readiness check that fails unless required services and persistence can perform real work.

### CI checks masked by failure-tolerant commands

The GitHub Actions workflow reports green even when checks did not actually run or failed:

- Frontend lint: `npm run lint 2>/dev/null || echo "No lint script configured"` masks lint failures, and `package.json` has no lint script.
- Backend types: `python -m mypy ... || true` always exits 0.
- Backend deploy job uses `continue-on-error: true`, so a failed Cloud Run deploy does not fail CI.
- `pip install -r requirements.txt --no-deps 2>&1 | tail -5` pipes without `pipefail`, so an install failure is hidden by `tail`.

Green CI therefore proves type check and unit tests ran, but not lint, mypy, or the backend deploy.

### Other gaps

- `streak_days` is never computed; it is schema-only and always 0.
- TTS audio cache is ephemeral and regenerates after cold starts.
- Scoring is text-only Levenshtein similarity, not phoneme comparison; the recorded audio itself is not scored.
- Mandarin tone scoring is client-side via Web Audio pitch extraction in `frontend/src/lib/mandarin/`, independent of the backend scorer.
