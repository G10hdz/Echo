# Echo

**English** · [Español](README.es.md)

Practice pronunciation against real sentences, get a per-word score, and hear how it should sound. The browser records you; a small FastAPI backend transcribes, scores, and synthesizes reference audio.

**Live demo:** https://echo-pronunciation.netlify.app/

> The demo is public and has no accounts. Sessions and progress live on an ephemeral Cloud Run filesystem and can vanish when the instance recycles.

## What you can do

- Pick a language (English, Spanish, Mandarin) and a CEFR level on the home screen
- Record yourself reading a sentence, get a score with word-by-word breakdown
- Play the reference audio and compare waveforms
- Practice Mandarin with pinyin overlay and per-syllable tone feedback
- Track streaks and accuracy on the progress page

## How it works

1. The React SPA captures audio in the browser ([`frontend/src/hooks/useMicrophone.ts`](frontend/src/hooks/useMicrophone.ts)) and posts it to `POST /api/practice/analyze` in [`backend/main.py`](backend/main.py).
2. The backend converts the upload with ffmpeg, transcribes it with faster-whisper ([`backend/whisper_service.py`](backend/whisper_service.py)), and scores it against the target sentence ([`backend/scoring.py`](backend/scoring.py)). Mandarin is scored per character and per tone, client-side.
3. Reference audio comes from ElevenLabs when a key is configured, otherwise local Kokoro TTS ([`backend/elevenlabs_service.py`](backend/elevenlabs_service.py), [`backend/kokoro_service.py`](backend/kokoro_service.py)). WAVs are cached under `/audio`.
4. Sessions land in SQLite ([`backend/database.py`](backend/database.py)) and feed the progress page.

## Run it locally

You need Node 20+, Python 3.11+, and ffmpeg.

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt   # includes torch; expect a large download
cp .env.example .env              # ELEVENLABS_API_KEY optional, falls back to Kokoro

cd ../frontend
npm install
cd ..

bash scripts/dev-start.sh         # backend :8000, frontend :5173
```

Open http://localhost:5173. Without `VITE_API_ORIGIN`, the Vite dev server proxies `/api` and `/audio` to the local backend. API docs at http://localhost:8000/docs.

## Structure

| Folder | What's inside |
| --- | --- |
| `frontend/` | React 19 + TypeScript + Vite SPA (Tailwind, react-router, TanStack Query, Recharts, Framer Motion) |
| `backend/` | FastAPI service: transcription, scoring, TTS, SQLite persistence |
| `scripts/` | `dev-start.sh`, Cloud Run deploy, smoke and load tests |
| `docs/` | [ARCHITECTURE](docs/ARCHITECTURE.md), [DEPLOY](docs/DEPLOY.md), [HANDOFF](docs/HANDOFF.md), [TESTING_GUIDE](docs/TESTING_GUIDE.md) |

## Tests

```sh
cd backend && python -m pytest tests/ -q          # scoring + TTS cache unit tests
cd frontend && npx tsc --noEmit && npm run build  # typecheck + build
```

CI runs the typecheck, unit tests, and a gitleaks secret scan on every push and PR.

## Deployment

- Frontend auto-deploys to Netlify from `main` (`netlify.toml`).
- Backend deploys to Cloud Run from `.github/workflows/echo-cd.yml`, authenticated with Workload Identity Federation — no long-lived keys. Setup in [docs/DEPLOY.md](docs/DEPLOY.md).

## Design

Clinical Sublime design system (Positronica family): lavender primary, Orbitron + Inter, glassmorphism, dark mode. Tokens in `frontend/src/index.css`.

## Credits

- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — transcription
- [Kokoro](https://github.com/hexgrad/kokoro) — local TTS
- [ElevenLabs](https://elevenlabs.io) — cloud TTS

## License

[MIT](LICENSE)
