# Echo — AI Pronunciation Coach

> Real-time pronunciation feedback powered by Whisper STT, word-level phonetic scoring, and ElevenLabs TTS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](backend/requirements.txt)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](frontend/package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](backend/main.py)

---

## What it does

Echo helps language learners improve pronunciation through an instant listen → speak → score loop:

1. **Get a sentence** — curated by CEFR level (A1–C2)
2. **Record yourself** — in-browser microphone with live waveform visualization
3. **See word-level feedback** — 🟢 correct / 🟠 partial / 🔴 incorrect, per word
4. **Hear correct pronunciation** — ElevenLabs neural TTS playback
5. **Track your progress** — score history, streak, and flagged-words dashboard

---

## Architecture

```
Browser (React 19 + Vite)
  │  MediaRecorder API → audio blob
  │  Canvas API → live waveform
  ▼
FastAPI  ─  /api/practice/analyze  (single round-trip)
  ├── ffmpeg           audio normalization → 16 kHz WAV
  ├── faster-whisper   speech-to-text transcription
  ├── EchoScorer       word-level Levenshtein scoring
  └── ElevenLabs TTS   correct-pronunciation audio
  ▼
SQLite   session history & progress tracking
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **STT** | `faster-whisper` (CTranslate2, ROCm/CUDA) |
| **Scoring** | `python-Levenshtein` — word-level, 3-tier threshold |
| **TTS** | ElevenLabs API (`eleven_multilingual_v2`) |
| **Backend** | FastAPI — async, graceful-degradation design |
| **Frontend** | React 19 + TypeScript + Tailwind v4 + TanStack Query |
| **Database** | SQLite + SQLAlchemy |
| **Deploy** | Google Cloud Run (backend) + Netlify (frontend) |

---

## Scoring Algorithm

Three-tier word-level scoring:

```python
for each (expected_word, actual_word):
    sim = levenshtein_ratio(expected_word, actual_word)
    if sim >= 0.85:   status = "correct"    # 🟢
    elif sim >= 0.60: status = "partial"    # 🟠
    else:             status = "incorrect"  # 🔴
```

Overall score = sequence-level Levenshtein ratio (handles insertions, deletions, substitutions across the full sentence). Next: WhisperX word-confidence scores → phoneme-level DTW alignment.

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt

export ELEVENLABS_API_KEY=your_key_here   # optional — falls back to Kokoro TTS
export WHISPER_MODEL_SIZE=base            # base | small | medium

python main.py          # → http://localhost:8000
# GET /health shows which services are active
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_ORIGIN=http://localhost:8000" > .env.local
npm run dev             # → http://localhost:5173
```

---

## Cloud Deployment

```bash
# Backend → Google Cloud Run (uses Doppler for secrets)
./scripts/cloud-run-deploy.sh

# Frontend → Netlify (set VITE_API_ORIGIN to Cloud Run URL)
cd frontend && npm run build   # upload dist/
```

Key env vars:

| Variable | Description |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ECHO_CORS_ORIGINS` | Comma-separated allowed browser origins |
| `WHISPER_MODEL_SIZE` | `base` (default) / `small` / `medium` |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service status (whisper, tts, scorer, db) |
| `POST` | `/api/practice/analyze` | Full pipeline: audio → transcription → score → TTS |
| `POST` | `/api/transcribe` | STT only |
| `POST` | `/api/score` | Scoring only (text → text) |
| `POST` | `/api/tts` | TTS only |
| `GET` | `/api/sentences` | Practice sentences by level + language |
| `GET` | `/api/progress/{user_id}` | User stats + session history |

---

## Project Structure

```
Echo/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── scoring.py           # EchoScorer — Levenshtein engine
│   ├── whisper_service.py   # faster-whisper STT wrapper
│   ├── kokoro_service.py    # Kokoro TTS (local fallback)
│   ├── database.py          # SQLAlchemy models + queries
│   └── models.py            # Pydantic request/response schemas
├── frontend/src/
│   ├── pages/               # PracticePage, ProgressPage
│   ├── components/          # MicRecorder, ScoreDisplay, ProgressChart
│   ├── hooks/               # useMicrophone (MediaRecorder + canvas waveform)
│   └── services/api.ts      # typed fetch client with retry + backoff
├── scripts/
│   └── cloud-run-deploy.sh  # Doppler + gcloud build + deploy
└── Dockerfile
```

---

## Roadmap

- [x] Phase 1 — Telegram bot MVP (Whisper + Levenshtein + Kokoro TTS)
- [x] Phase 2 — React web app + FastAPI backend
- [x] Phase 2.1 — ElevenLabs TTS integration
- [ ] Phase 3 — WhisperX word-confidence scoring
- [ ] Phase 4 — Phoneme-level DTW alignment (ELSA-grade)
- [ ] Phase 5 — React Native mobile

---

## Acknowledgments

- [ElevenLabs](https://elevenlabs.io/) — neural TTS voices
- [ELSA Speak](https://elsaspeak.com/) — inspiration for phoneme-level scoring
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — STT engine
- [Kokoro TTS](https://github.com/hexgrad/kokoro) — local TTS fallback
