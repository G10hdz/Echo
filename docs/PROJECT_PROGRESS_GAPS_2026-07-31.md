# Echo project progress and gap audit

**Audit date:** 2026-07-31  
**Audited checkout:** `main` at `49264b2`  
**Remote comparison:** local `HEAD` equals `origin/main`. The sync added design prototypes and a PR notification workflow, not runtime application code.

## Bottom line

Echo is a working demo/MVP slice, not a complete product. The React frontend compiles, the core practice-to-result flow is wired to a FastAPI backend, and progress is stored in SQLite. The largest remaining work is connecting the product surfaces already present, making the Mandarin path real and safe, and implementing the newer Fresco product flows that currently exist only as static HTML designs.

The live frontend returned HTTP 200 during this audit. The live backend `/health` request returned HTTP 500, so the deployed end-to-end flow is currently **not verified healthy**.

## Verification performed

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Frontend production build | **Pass** | `npm.cmd run build`; TypeScript and Vite completed. Output: 851.16 kB JS (255.15 kB gzip), with Vite's >500 kB chunk warning. |
| Backend syntax | **Pass** | `python -m py_compile` passed for all backend modules. |
| Backend unit tests | **Blocked locally** | The checkout has no backend virtualenv; system Python lacks `pytest` and `python-Levenshtein`. The 2026-07-18 report says 7 tests passed then, but that is historical, not a current run. |
| Git state | **Synced; clean except audit artifacts** | `HEAD` equals `origin/main` at `49264b2`. `.codex/` and this report are untracked. |
| GitHub Actions | **Latest listed runs pass** | Latest main workflow listed on 2026-07-24. `deploy-backend` uses `continue-on-error: true`, so a green workflow does not prove a successful backend deploy. |
| Live frontend | **Reachable** | `https://echo-pronunciation.netlify.app/` returned HTTP 200. This does not prove it serves the latest commit. |
| Live backend | **Failing at audit time** | `https://echo-backend-527601165113.us-central1.run.app/health` returned HTTP 500. |
| Browser/E2E regression scripts | **Not run** | Python Playwright and the backend runtime dependencies are not installed in this checkout. |

## What is built in runtime code

| Area | Status | What is actually present |
| --- | --- | --- |
| App shell and routing | **Built** | Routes for Home, Practice, Progress, Settings, Onboarding, Mandarin Practice, and Results in `frontend/src/App.tsx`. |
| Onboarding | **UI built, disconnected** | A 3-step flow persists selections to `echo_onboarding`, but practice does not read them. |
| Home | **Built** | Language selector, progress summary, daily goal, and recent sessions. Progress depends on the fixed demo user. |
| English practice | **Core flow built** | Immediate bundled fallback sentence, microphone recording, `/api/practice/analyze`, Results navigation, retry/error UI. |
| Results | **Built, transient** | Score ring, word breakdown, and next actions. Data exists only in router state. |
| Progress | **Built** | Zero-state-first rendering, chart, totals, and recent sessions from `/api/progress/{user_id}`. |
| Settings and theme | **UI built, partially effective** | Theme persists and works. Language, level, and voice persist but do not drive practice requests. |
| Mandarin | **Prototype/partial** | Sentence loading, pinyin, recording, contour rendering, and fallback scoring exist. Pitch-based per-syllable scoring is not reachable. |
| Backend API | **Implemented, runtime unverified locally** | Health, transcription, scoring, TTS, session start/complete/analyze, sentences, progress, and audio serving in `backend/main.py`. |
| Persistence | **Demo-grade** | SQLite stores sessions, progress totals, and sentences. Docker Compose mounts a persistent local volume. |
| Speech services | **Implemented with optional availability** | Whisper, ElevenLabs, and Kokoro load non-blockingly. The full live service currently fails its health request. |
| Deployment | **Configured, not healthy end-to-end** | Netlify + Cloud Run workflow exists. Frontend is reachable; backend health returned 500. |
| Expanded Fresco product flows | **Designed only** | Synced HTML prototypes now exist for Library, Review, History, Profile, Audio/Privacy, and revised Onboarding; none has a React runtime route. |

## Confirmed gaps, ranked

### P0 — restore a verifiable deployed core flow

1. **Live backend health is failing.** `/health` returned HTTP 500. Diagnose Cloud Run logs/startup before treating the demo as deployable. A green workflow is insufficient because `.github/workflows/echo-cd.yml` allows backend deployment failure.
2. **Public expensive endpoints have no authentication or rate limiting.** `/api/transcribe`, `/api/tts`, and `/api/practice/analyze` can consume speech/LLM-style resources. CORS is not access control. Add the smallest server-side protection before public production use.

### P1 — close the existing core product loop

1. **Preferences do not affect practice.** Onboarding writes `echo_onboarding`; Settings writes `echo_settings`; English and Mandarin practice hard-code `userId`, language, and level. The selected voice is never sent. Home's language choice is transient. Use one settings record and read it at the practice boundary.
2. **Identity is a fixed shared demo user.** Home, Practice, Mandarin, and Progress all use `web-user-001`. There is no account/auth ownership boundary, so this cannot safely support multiple users.
3. **Streaks never change.** `streak_days` is created and displayed but never calculated or updated in `backend/database.py`.
4. **Results are not durable.** `/results` depends on React Router state; refresh/direct navigation loses the session. The backend returns a session ID but exposes no session-detail endpoint for recovery or sharing.
5. **Mandarin pitch scoring is not connected.** `scoreTones()` requires `syllableBoundaries` to use pitch, but no caller provides them, so it always falls back to pinyin comparison. The UI implies tone analysis stronger than the code delivers.
6. **Mandarin microphone cleanup leaks work/resources.** It opens a second media stream for pitch extraction, discards the returned cleanup without invoking it, and does not stop that stream's tracks. Repeated recordings can leave the interval and microphone active.
7. **New Fresco screens are designs only.** Library, Review Queue, History, Profile/Goals, and Audio/Privacy are now present under `design/`, but there are no runtime routes/pages. The current topbar exposes only Home, Practice, and Progress.
8. **Mobile navigation disappears.** Below 640 px the nav links are hidden with no menu/replacement. Settings and Mandarin are also absent from the current topbar at all widths.
9. **Current automated coverage is too narrow.** Backend tests cover scoring and cache naming only. No committed frontend unit tests cover settings wiring, routing, results recovery, streak calculation, or Mandarin resource cleanup. Browser scripts require an unprovisioned Playwright environment.

### P2 — remove drift and reduce maintenance noise

1. **README and ROADMAP are materially stale.** They describe React 18, Clinical Sublime/lavender, backend WIP/static-only deployment, Mandarin planned, and Home/Onboarding/Results pending. Current code uses React 19, the teal/amber Fresco system, a deployed backend, Mandarin runtime code, and all three routes.
2. **Setup documentation names the wrong frontend environment variables.** README documents `VITE_API_URL` and a frontend ElevenLabs key; runtime code reads `VITE_API_ORIGIN`, while ElevenLabs belongs to the backend.
3. **There is dormant code and one unused runtime dependency.** `WaveComparison.tsx` is not rendered, five exported API wrappers have no callers, and React Query wraps the app without any query/mutation usage. Keep `WaveComparison` only if the next Results implementation uses it as the remote design roadmap says.
4. **The frontend ships one large initial chunk.** The 851 kB minified build warning is not a blocker for the demo, but route-level lazy loading becomes worthwhile once the P0/P1 flow is stable.
5. **Unknown routes render an empty layout.** There is no catch-all route or not-found redirect.

## Recommended next slice

Do one narrow release slice:

1. Diagnose and restore `/health` and one real `/api/practice/analyze` request.
2. Replace the two preference records and hard-coded practice constants with one `loadSettings()` path.
3. Fix Mandarin cleanup; label tone scoring as fallback until boundaries are implemented.
4. Add three runnable regressions: settings affect sentence query, results recover by session ID, and repeated Mandarin recordings release resources.

After that, implement **Library → exercise detail → Practice → durable Results → Review**. That closes one real user loop before adding Profile, achievements, reminders, or monetization.

## Ponytail cleanup opportunities

- `delete:` React Query provider and dependency while there are no `useQuery`/`useMutation` callers. Replacement: direct API calls already used by every page. [`frontend/src/App.tsx`, `frontend/package.json`]
- `delete:` unused standalone API wrappers (`transcribeAudio`, `scorePronunciation`, `generateTTS`, `startPracticeSession`, `completePracticeSession`) until a caller exists. Replacement: the merged analyze endpoint already powers practice. [`frontend/src/services/api.ts`]
- `yagni:` keep `WaveComparison` only when the planned durable Results page imports it; otherwise it is a large dormant component. [`frontend/src/components/WaveComparison.tsx`]

**Net:** roughly -100 lines and -1 dependency immediately possible, excluding `WaveComparison` because the current remote roadmap explicitly plans to reuse it.
