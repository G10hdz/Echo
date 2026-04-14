# Echo Phase 2 - Web App Implementation

> FastAPI Backend + React Frontend | Status: **Ready for Testing** ✅

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Echo Web App                        │
├─────────────────┬─────────────────┬─────────────────┤
│   React Frontend│   FastAPI Backend│   AI Services   │
│   (Port 5173)   │   (Port 8000)   │                 │
│                 │                 │                 │
│ • Practice Page │ • /transcribe   │ • Whisper GPU   │
│ • Progress Dash │ • /score        │ • WhisperX align│
│ • MicRecorder   │ • /tts          │ • Kokoro TTS    │
│ • ScoreDisplay  │ • /progress     │ • Silero VAD    │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Project Structure

```
Echo/
├── backend/
│   ├── main.py              # FastAPI app with all endpoints
│   ├── models.py            # Pydantic schemas
│   ├── database.py          # SQLite manager with seeded sentences
│   ├── whisper_service.py   # faster-whisper STT wrapper
│   ├── scoring.py           # Levenshtein scoring engine
│   ├── kokoro_service.py    # Kokoro TTS integration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MicRecorder.tsx    # Browser mic + waveform
│   │   │   ├── ScoreDisplay.tsx   # Color-coded word feedback
│   │   │   ├── SentenceCard.tsx   # Target sentence display
│   │   │   ├── ProgressChart.tsx  # Stats + Recharts graph
│   │   │   └── Sidebar.tsx        # Navigation layout
│   │   ├── hooks/
│   │   │   └── useMicrophone.ts   # MediaRecorder API hook
│   │   ├── pages/
│   │   │   ├── PracticePage.tsx   # Main practice UI
│   │   │   └── ProgressPage.tsx   # Progress dashboard
│   │   ├── services/
│   │   │   └── api.ts             # API client functions
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── App.tsx                # Router + layout
│   │   └── main.tsx               # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── Echo_Architecture_Plan.md
```

---

## Quick Start

### Backend Setup

1. **Create virtual environment** (or add to existing Echo venv):
```bash
cd /home/gio/Vscode-projects/Echo/backend
python -m venv .venv
source .venv/bin/activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

**Note:** You'll need:
- `faster-whisper` (already in Metis venv?)
- `whisperx` (optional, for word-level alignment)
- `python-Levenshtein` (scoring)
- Kokoro dependencies (from `~/Tools/tts-tools/`)

3. **Run backend**:
```bash
python main.py
```
Server starts at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies** (already done ✅):
```bash
cd /home/gio/Vscode-projects/Echo/frontend
npm install
```

2. **Run dev server**:
```bash
npm run dev
```
App starts at: `http://localhost:5173`

Vite proxies `/api` and `/audio` to backend automatically.

---

## API Endpoints

### Health Check
```
GET /health
```

### Transcribe Audio
```
POST /api/transcribe
Content-Type: multipart/form-data
Body: { audio: File }

Response: {
  text: "The comfortable chair was near the door",
  words: [{ word, start, end, confidence }],
  language: "en"
}
```

### Score Pronunciation
```
POST /api/score
Content-Type: application/json
Body: { expected: string, actual: string }

Response: {
  overall_score: 85,
  grade: "B+",
  words: [{ word, status, confidence, said }],
  flagged: [{ word, status, said }]
}
```

### Generate TTS
```
POST /api/tts
Content-Type: application/json
Body: { text, voice?, language? }

Response: {
  audio_url: "/audio/tts_123456.wav",
  text: "The comfortable chair..."
}
```

### Practice Session Management
```
POST /api/practice/start
POST /api/practice/complete
GET /api/progress/{user_id}
GET /api/sentences?level=A1&language=en&limit=10
```

---

## Design System

**Stitch Project**: [Echo Web - Pronunciation Practice Dashboard](https://stitch.withgoogle.com/projects/3771791534703244333)

### Key Design Principles
- **"The Sonic Landscape"** - Editorial, premium aesthetic
- **No-Line Rule** - Use background shifts instead of borders
- **Glass & Gradient** - Indigo gradient for CTAs, glassmorphism for overlays
- **Tonal Depth** - Surface containers create layered depth

### Colors
- Primary: `#5755a9` (Indigo)
- Primary Container: `#bdbaff`
- Surface: `#faf8ff` (purple-tinted white)
- Score: 🟢 `#22c55e`, 🟠 `#f59e0b`, 🔴 `#ef4444`

### Typography
- Headlines: **Manrope** (geometric, tech-premium)
- Body: **Be Vietnam Pro** (warm, legible)

---

## Practice Flow

1. User lands on `/` (Practice page)
2. System loads random sentence from library (by level + language)
3. User reads sentence aloud
4. Click "Start Recording" → browser requests mic permission
5. Real-time waveform visualizer shows audio input
6. Click "Stop" → audio blob captured
7. Click "Analyze My Pronunciation" → sends to backend
8. Backend pipeline:
   - Whisper transcribes audio
   - Scoring engine compares expected vs actual
   - Kokoro generates correct pronunciation audio
   - Session saved to SQLite
9. Frontend displays:
   - Overall score + grade badge
   - Word-by-word color-coded feedback
   - Flagged words summary
   - "Listen to Correct Pronunciation" button
10. User can retry flagged words or get new sentence

---

## Database

SQLite database (`echo.db`) auto-created on first run.

### Tables
- `users` - User accounts (Telegram + Web)
- `practice_sessions` - Practice history
- `user_progress` - Aggregated stats
- `sentence_library` - 25 seeded sentences (EN + ES, A1-B2)

### Schema
See `backend/database.py` for full implementation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TS + Vite + Tailwind v4 |
| **State** | TanStack Query (server state) |
| **Routing** | React Router v7 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | FastAPI + Python 3.12 |
| **STT** | faster-whisper (medium model) |
| **Scoring** | python-Levenshtein |
| **TTS** | Kokoro (af_heart EN, ef_dora ES) |
| **Database** | SQLite + SQLAlchemy |
| **GPU** | AMD RX 6700 XT (ROCm if available) |

---

## Next Steps

- [ ] Test backend with real audio files
- [ ] Verify Whisper model loads on GPU
- [ ] Test Kokoro TTS generation
- [ ] End-to-end practice flow test
- [ ] Add authentication (JWT like UIGen)
- [ ] Add settings page (level, language selection)
- [ ] WhisperX integration for word-level confidence
- [ ] Deploy backend to VPS for mobile app testing

---

## Known Issues

- [ ] CSS build hanging (Tailwind v4 import issue - using custom CSS for now)
- [ ] User ID hardcoded (needs auth integration)
- [ ] Level/language selectors not yet implemented

---

## Screenshots (Stitch Designs)

1. **Practice Screen**: https://stitch.withgoogle.com/projects/3771791534703244333/screens/[screen-id]
2. **Progress Dashboard**: https://stitch.withgoogle.com/projects/3771791534703244333/screens/[screen-id]

---

**Created**: 2026-04-14
**Status**: Phase 2 implementation complete, ready for integration testing
