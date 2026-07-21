# Echo — Intern Testing Guide

**App:** Echo — AI-powered pronunciation practice app
**Live URL:** https://echo-pronunciation.netlify.app/
**Local URL:** http://localhost:5173 (frontend) + http://localhost:8000 (backend)
**Repo:** `C:\Users\ASUSTUF\Desktop\Echo`

This guide walks you through every feature of Echo. Follow each section in order,
check off every box, and report bugs using the template at the end.

---

## 0. What is Echo?

Echo helps users practice pronunciation by:

1. Showing a target sentence (English, Spanish, or Mandarin Chinese)
2. Recording the user reading the sentence aloud
3. Transcribing the recording with Whisper AI (speech-to-text)
4. Scoring pronunciation by comparing the transcription against the target
5. Generating reference audio with TTS (text-to-speech) so the user can hear the correct pronunciation
6. Tracking progress over time (sessions, accuracy, streaks)

**Tech stack:**

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- Backend: FastAPI (Python) + SQLite + faster-whisper + ElevenLabs/Kokoro TTS
- Design system: "Clinical Sublime" — lavender primary, Orbitron + Inter fonts, glassmorphism cards

---

## 1. Environment Setup

### 1.1 Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Git installed (`git --version`)
- [ ] A working microphone (built-in or external)
- [ ] Chrome, Firefox, or Edge browser (latest version)
- [ ] ffmpeg installed on the system (`ffmpeg -version`) — required by backend for audio conversion

### 1.2 Clone & Install

```bash
# Clone the repo (if not already done)
git clone <repo-url> Echo
cd Echo

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies (use a virtual environment)
cd backend
python -m venv .venv

# Activate virtual env:
# Windows (Git Bash):
source .venv/Scripts/activate
# Windows (PowerShell):
# .venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
# Note: torch/torchaudio install with CPU index:
pip install -r requirements.txt --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple
cd ..
```

### 1.3 Environment Variables

**Frontend** — create `frontend/.env`:

```
VITE_API_ORIGIN=http://localhost:8000
```

- If testing against the deployed backend instead of local, use:
  `VITE_API_ORIGIN=https://echo-backend-527601165113.us-central1.run.app`

**Backend** — create `backend/.env` (copy from `backend/.env.example`):

```
# Optional but recommended for TTS testing:
ELEVENLABS_API_KEY=your_key_here

# Whisper model size: base | small | medium
WHISPER_MODEL_SIZE=base

# Allowed browser origins (must include your frontend URL)
ECHO_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# SQLite database path (relative to backend/ dir)
ECHO_DB_PATH=echo.db
```

- [ ] Frontend `.env` created
- [ ] Backend `.env` created
- [ ] (Optional) ElevenLabs API key added — without it, TTS uses Kokoro (local fallback) or is disabled

### 1.4 Start Development Servers

Use the provided script:

```bash
bash scripts/dev-start.sh
```

Or start manually in two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
source .venv/Scripts/activate   # or .venv/bin/activate on macOS/Linux
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

- [ ] Backend running at `http://localhost:8000`
- [ ] Frontend running at `http://localhost:5173`
- [ ] Open `http://localhost:8000/health` in browser — should return JSON with `status: "healthy"`

### 1.5 Health Check Verification

Open `http://localhost:8000/health` in your browser. You should see:

```json
{
  "status": "healthy",
  "version": "0.2.0",
  "services": {
    "whisper": true,
    "elevenlabs_tts": true or false,
    "kokoro_tts": true or false,
    "scorer": true,
    "database": true
  }
}
```

- [ ] `scorer` is `true`
- [ ] `database` is `true`
- [ ] At least one TTS service (`elevenlabs_tts` or `kokoro_tts`) is `true`
- [ ] `whisper` is `true` (if `false`, transcription won't work — note this)

> **If Whisper is false:** The app will still function but `/api/transcribe` and the transcription step of `/api/practice/analyze` will return empty text. Scoring will produce 0. This is a known degradation mode.

---

## 2. First-Run Experience (Onboarding)

**Goal:** Verify the onboarding flow works for new users.

**Steps:**

1. Open `http://localhost:5173` in a fresh browser tab
2. Clear localStorage if you've visited before:
   - Open DevTools (F12) → Application → Local Storage → `http://localhost:5173`
   - Delete all keys (especially `echo_onboarded` and `echo_onboarding`)
   - Or run in Console: `localStorage.clear()`
3. Refresh the page

**Expected:** You should be redirected to `/onboarding` — a 3-step calibration flow.

### 2.1 Step 1 — Language Selection

- [ ] Page shows "> CALIBRATION PROTOCOL 01 / 03" terminal label
- [ ] 3 progress dots at top (first is highlighted lavender)
- [ ] Language options displayed: English, Español, Français, Deutsch, Italiano, Português, 日本語
- [ ] Clicking a language highlights it (lavender background + glow)
- [ ] "CONTINUE" button is disabled until a language is selected
- [ ] Select English → click CONTINUE

### 2.2 Step 2 — Level Selection

- [ ] Page shows "> CALIBRATION PROTOCOL 02 / 03"
- [ ] Second progress dot is now highlighted
- [ ] Connector line between dots 1 and 2 is gradient-filled
- [ ] Levels displayed: A1 (Beginner) through C2 (Proficient)
- [ ] Clicking a level fills it with solid lavender + glow
- [ ] "BACK" button works — returns to Step 1, previous selection preserved
- [ ] Select A1 → click CONTINUE

### 2.3 Step 3 — Voice Preference

- [ ] Page shows "> CALIBRATION PROTOCOL 03 / 03"
- [ ] Third progress dot highlighted
- [ ] Two voice options: "Female Native" and "Male Native"
- [ ] Selecting a voice highlights it
- [ ] "FINISH" button appears (replaces CONTINUE on last step)
- [ ] Click FINISH → redirected to Home page (`/`)

### 2.4 Onboarding Gate

- [ ] After finishing onboarding, `localStorage` has `echo_onboarded` = `"true"`
- [ ] `echo_onboarding` contains JSON with selected language, level, and voice
- [ ] Refreshing the page does NOT redirect to onboarding again
- [ ] Navigating directly to `/onboarding` still works (can redo onboarding)

---

## 3. Home / Dashboard Page

**Route:** `/`

**Goal:** Verify the dashboard shows user stats, streak, and provides navigation.

- [ ] Terminal label "> ECHO // PRONUNCIATION INTELLIGENCE" displayed
- [ ] Streak counter (large Orbitron number) shows a number (0 if no sessions)
- [ ] Language selector pills: EN, ES, 中文
- [ ] Clicking a language pill highlights it lavender
- [ ] "START SESSION" button (lavender gradient with glow)
- [ ] Clicking START SESSION with EN selected → navigates to `/practice`
- [ ] Clicking START SESSION with 中文 selected → navigates to `/practice/zh`
- [ ] Three stat cards: Sessions Today, Accuracy %, Words Mastered
- [ ] Stats show "—" while loading, then actual values
- [ ] Gradient divider line visible
- [ ] "Recent Sessions" section header
- [ ] If no sessions exist: "No sessions yet. Start practicing!" message
- [ ] If sessions exist: list of recent sessions with flag, sentence text, date, score chip, chevron arrow

**Edge cases to test:**

- [ ] With no sessions (fresh DB): streak = 0, sessions today = 0, accuracy = 0%, words = 0
- [ ] Complete a practice session, return to Home → stats should update

---

## 4. Practice Page (English/Spanish)

**Route:** `/practice`

**Goal:** Verify the core pronunciation practice flow end-to-end.

### 4.1 Sentence Loading

- [ ] Page loads with a loading skeleton (shimmer card)
- [ ] After loading, a practice sentence appears in the SentenceCard component
- [ ] Sentence card shows the target sentence text
- [ ] Sentence card shows level badge (A1) and language flag
- [ ] "New Sentence" button (or similar) loads a different random sentence
- [ ] Multiple "New Sentence" clicks produce different sentences (randomized)

### 4.2 Recording — Microphone Permission

- [ ] Mic/record button is visible (large circular button, lavender ghost border)
- [ ] Empty state message: "Record your voice to see your score"
- [ ] Clicking record button triggers browser microphone permission prompt
- [ ] Allow microphone permission
- [ ] If permission denied: an error message should appear (graceful failure)

### 4.3 Recording — Active State

- [ ] While recording: button changes to a "Stop" state (square icon or red dot)
- [ ] Duration timer counts up (format MM:SS)
- [ ] Live waveform animation (SVG bars moving) — bars respond to voice input
- [ ] Speak into the mic — waveform bars should fluctuate
- [ ] Stay silent — bars should be minimal/flat

### 4.4 Recording — Stop & Playback

- [ ] Click stop button → recording stops
- [ ] Duration timer freezes
- [ ] "Analyze My Pronunciation" button appears (lavender, with Sparkles icon)
- [ ] A playback button appears to listen to your recording before analyzing
- [ ] Click playback → audio plays back through speakers
- [ ] "Reset" option clears the recording and returns to empty state

### 4.5 Analyze — Happy Path

**Prerequisite:** Whisper and at least one TTS service must be available.

- [ ] Record yourself saying the target sentence clearly
- [ ] Click "Analyze My Pronunciation"
- [ ] Button shows spinner + "Analyzing..." while processing
- [ ] After processing (may take 2-10 seconds): redirected to `/results` page

### 4.6 Analyze — Error Cases

- [ ] **No audio recorded:** Analyze button should not appear (or be disabled)
- [ ] **Whisper unavailable:** Processing completes but score will be 0, transcription empty — check that the app doesn't crash
- [ ] **Backend down:** Error toast appears with message and "Dismiss" button
- [ ] **Recording too long (>10MB):** Backend returns 413 error — error toast shown
- [ ] **Network timeout:** API service retries (up to 2 times with exponential backoff)

---

## 5. Session Results Page

**Route:** `/results` (only accessible after a practice session, state passed via router)

**Goal:** Verify the results display is accurate and actionable.

- [ ] Terminal label "> SESSION COMPLETE // YYYY-MM-DD" (today's date)
- [ ] Circular SVG progress ring with overall score percentage
- [ ] Ring animates from 0 to score value (stroke-dashoffset animation)
- [ ] Score percentage displayed in center (Orbitron font)
- [ ] Letter grade (A+ to F) displayed below percentage
- [ ] Three stat chips: Words Practiced, Correct, Flagged
- [ ] Gradient divider
- [ ] "Word Breakdown" section: chips for each word, color-coded:
  - Green border = correct
  - Gold/yellow border = partial
  - Red/pink border = incorrect
  - Grey border = missed or extra
- [ ] Target sentence displayed in a card with Play icon
- [ ] "PRACTICE AGAIN" button (lavender gradient) → navigates to `/practice`
- [ ] "HOME" button (ghost border) → navigates to `/`

**Edge cases:**

- [ ] Navigate to `/results` directly without a session: "No session data" message + "Go to Practice" button
- [ ] Perfect score (100%): all word chips should be green/correct

---

## 6. Mandarin Chinese Practice Page

**Route:** `/practice/zh`

**Goal:** Verify Mandarin-specific features (pinyin overlay, tone visualization).

### 6.1 Sentence & Pinyin

- [ ] Sentence loads from the `zh` sentence library (e.g., "你好我是学生")
- [ ] PinyinOverlay component appears below the sentence
- [ ] Pinyin romanization shown above/below each character
- [ ] Tone marks visible on pinyin (e.g., nǐ hǎo)

### 6.2 Recording & Tone Analysis

- [ ] Recording works the same as English practice page
- [ ] After analyzing, if pitch extraction succeeded: ToneVisualization component appears
- [ ] ToneVisualization shows per-syllable tone scores
- [ ] Expected vs detected tone numbers shown for each character
- [ ] If pitch extraction failed (no pitch contour): falls back to pinyin-based scoring (still shows result)

### 6.3 Scoring

- [ ] CJK scoring works at character level (not word level)
- [ ] Perfect match: 100% score, grade A+
- [ ] One wrong character: partial/incorrect status on that character, lower score
- [ ] Missing characters: marked as "missed"
- [ ] Extra characters: marked as "extra" with "+" prefix

---

## 7. Progress Page

**Route:** `/progress`

**Goal:** Verify progress tracking and statistics display.

- [ ] Page title "Your Progress" with subtitle
- [ ] Loading skeleton appears while fetching data
- [ ] Stat cards display: Total Sessions, Average Score, Streak Days, Words Practiced
- [ ] ProgressChart (Recharts) shows accuracy over time
- [ ] Recent sessions list (up to 10 items) with sentence, score, grade, timestamp
- [ ] If error: "Could not load your progress" message

**Data verification:**

- [ ] After completing 1 session: Total Sessions = 1
- [ ] After completing multiple sessions: Average Score reflects average of all scores
- [ ] Words Practiced increments by word count of target sentences practiced
- [ ] Recent sessions sorted by most recent first

**Edge case:**

- [ ] Fresh DB (no sessions): all stats = 0, recent sessions empty, chart shows nothing/loading

---

## 8. Settings Page

**Route:** `/settings`

**Goal:** Verify settings persistence and dark mode toggle.

### 8.1 Language & Level

- [ ] "Language & Level" section present
- [ ] Practice Language dropdown: English, Spanish, Chinese, French
- [ ] Changing language saves immediately ("Settings saved" toast appears)
- [ ] Difficulty Level dropdown: A1 through C2
- [ ] Refresh page → selected settings persist (stored in localStorage key `echo_settings`)

### 8.2 Voice Settings

- [ ] "Voice Settings" section present
- [ ] TTS Voice dropdown: System Default + Alloy, Echo, Fable, Onyx, Nova, Shimmer
- [ ] Selecting a voice saves to settings

### 8.3 Appearance — Dark Mode

- [ ] "Appearance" section present
- [ ] Dark Mode toggle button
- [ ] Clicking toggle switches to dark theme immediately
- [ ] Background changes to deep purple-black (`#0D0B14`)
- [ ] All text, cards, borders remain readable in dark mode
- [ ] Refresh page → dark mode persists (stored in localStorage key `echo_dark_mode`)
- [ ] `data-theme="dark"` attribute applied to `<html>` element

### 8.4 Actions

- [ ] "Save Settings" button → saves + shows "Settings saved" toast
- [ ] "Reset to Defaults" button → reverts language to English, level to A1, voice to System Default
- [ ] Settings persist across page refreshes

---

## 9. Navigation & Sidebar

**Goal:** Verify routing and sidebar behavior.

- [ ] Sidebar visible on all pages except onboarding (desktop)
- [ ] Sidebar shows: Home, Practice, 中文 Practice, Progress, Settings
- [ ] Active page highlighted with lavender text + background
- [ ] `aria-current="page"` on active nav link
- [ ] Clicking each nav item navigates to correct route
- [ ] User name "User" and "Free Plan" shown at top of sidebar
- [ ] Dark mode toggle button at bottom of sidebar
- [ ] "Echo v0.1.0" version label at bottom

### 9.1 Mobile Sidebar

- [ ] On viewport < 768px: hamburger menu icon appears (top-left)
- [ ] Sidebar is hidden (off-canvas, slides from left)
- [ ] Clicking hamburger opens sidebar as overlay
- [ ] Overlay backdrop (semi-transparent) clickable to close
- [ ] Clicking a nav item closes the sidebar
- [ ] Dark mode toggle in mobile sidebar works

### 9.2 Page Transitions

- [ ] Navigating between pages: fade + slight Y-slide animation
- [ ] No flash of unstyled content (FOUC)
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL navigation works (e.g., pasting `/settings` in address bar)

---

## 10. Design System Verification

**Goal:** Confirm the Clinical Sublime design system is consistently applied.

### 10.1 Colors

- [ ] Primary lavender (`#C4B5E3` / `#6B5BA6`) used for active states, buttons, accents
- [ ] Biological pink accent for user waveforms and some CTAs
- [ ] Pure white background with lavender dot-grid pattern (light mode)
- [ ] Deep purple-black `#0D0B14` (dark mode)
- [ ] Ghost borders (`rgba(196, 181, 227, 0.25)`) — no solid 1px lines on cards
- [ ] Lavender ambient glow shadows — no grey box-shadows
- [ ] Score chips color-coded: green (correct), gold (partial), red (incorrect), grey (missed)

### 10.2 Typography

- [ ] Orbitron font for headlines/headers (uppercase, geometric)
- [ ] Inter font for body text
- [ ] Terminal labels in monospace style (uppercase, `tracking-[0.2em]`)

### 10.3 Components

- [ ] Glassmorphism cards: `backdrop-filter: blur(8px)` + ghost border
- [ ] Scrollbar: 6px lavender, no rounding
- [ ] Corners: sharp/small radius (lab-grade precision aesthetic)
- [ ] Buttons: lavender gradient for primary, ghost border for secondary

---

## 11. Backend API Testing

**Goal:** Verify each backend endpoint individually.

Use `http://localhost:8000/docs` (FastAPI Swagger UI) for interactive testing, or use curl/Postman.

### 11.1 GET /health

```bash
curl http://localhost:8000/health
```

- [ ] Returns 200 with `status: "healthy"`
- [ ] All service flags present (whisper, elevenlabs_tts, kokoro_tts, scorer, database)

### 11.2 GET /api/sentences

```bash
curl "http://localhost:8000/api/sentences?level=A1&language=en&limit=5"
```

- [ ] Returns 200 with `sentences` array
- [ ] Each sentence has: id, text, language, level, topic, times_practiced
- [ ] `level=A1` returns only A1 sentences
- [ ] `language=en` returns only English sentences
- [ ] `limit=3` returns max 3 sentences
- [ ] Randomized order (different results on repeated calls)
- [ ] Test with `language=es` — returns Spanish sentences
- [ ] Test with `language=zh` — returns Mandarin sentences

### 11.3 POST /api/score

```bash
curl -X POST http://localhost:8000/api/score \
  -H "Content-Type: application/json" \
  -d '{"expected": "The weather is beautiful today", "actual": "The weather is beautiful today"}'
```

- [ ] Perfect match → `overall_score: 100`, `grade: "A+"`, all words "correct"
- [ ] Partial match (one word different) → score < 100, one word "incorrect" or "partial"
- [ ] Empty actual → `overall_score: 0`, `grade: "F"`, all words "missed"
- [ ] Extra words in actual → marked as "extra" with `+` prefix

### 11.4 POST /api/practice/start

```bash
curl -X POST http://localhost:8000/api/practice/start \
  -F "user_id=test-intern" \
  -F "target_sentence=Hello world" \
  -F "language=en" \
  -F "level=A1"
```

- [ ] Returns 200 with `session_id` (integer) and `target` ("Hello world")
- [ ] Session created in database (check SQLite)

### 11.5 POST /api/practice/complete

```bash
curl -X POST http://localhost:8000/api/practice/complete \
  -F "session_id=1" \
  -F "score=85" \
  -F "grade=B+" \
  -F "transcription=Hello world" \
  -F "flagged_words=world"
```

- [ ] Returns 200 with `status: "success"`, `message: "Session saved"`
- [ ] User progress updated (total_sessions incremented, avg_score recalculated)

### 11.6 GET /api/progress/{user_id}

```bash
curl http://localhost:8000/api/progress/test-intern
```

- [ ] Returns 200 with progress object
- [ ] Fields: user_id, level, total_sessions, avg_score, streak_days, total_words_practiced, last_practice, recent_sessions
- [ ] For a new user: all zeros, empty recent_sessions
- [ ] After completing sessions: values update correctly

### 11.7 POST /api/practice/analyze (Full Pipeline)

This is the most important endpoint. Use a WAV/WEBM audio file:

```bash
curl -X POST http://localhost:8000/api/practice/analyze \
  -F "audio=@recording.webm" \
  -F "expected_text=The weather is beautiful today" \
  -F "user_id=test-intern" \
  -F "language=en" \
  -F "level=A1"
```

- [ ] Returns 200 with: session_id, transcription, words, language, score (or null), tts_url (or null)
- [ ] `transcription` contains Whisper's text output
- [ ] `score.overall_score` is 0-100 integer
- [ ] `score.grade` is A+/A/B+/B/C/D/F
- [ ] `score.words` array with word-level status
- [ ] `tts_url` is `/audio/tts_<hash>.wav` (if TTS available)
- [ ] Accessing `tts_url` via `http://localhost:8000/audio/tts_<hash>.wav` plays the audio

**Edge cases:**

- [ ] Missing `audio` field → 422 validation error
- [ ] Missing `expected_text` → 422 validation error
- [ ] Audio file > 10MB → 413 error
- [ ] Invalid audio format → 400 error (ffmpeg conversion fails)
- [ ] Whisper unavailable → transcription is empty, score is null

### 11.8 POST /api/transcribe (Standalone)

```bash
curl -X POST http://localhost:8000/api/transcribe \
  -F "audio=@recording.wav" \
  -F "language=en"
```

- [ ] Returns 200 with text, words (timestamps), language
- [ ] If Whisper unavailable → 503 error

### 11.9 POST /api/tts (Standalone)

```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

- [ ] Returns 200 with `audio_url` and `text`
- [ ] Accessing `audio_url` plays TTS audio
- [ ] Same text cached (second call returns same URL without regenerating)
- [ ] If no TTS service available → 503 error

---

## 12. Cross-Browser Testing

Test the app in at least 3 browsers:

- [ ] **Chrome** (latest) — all features work
- [ ] **Firefox** (latest) — all features work
- [ ] **Edge** (latest) — all features work
- [ ] (Optional) **Safari** — note any issues (Safari has stricter autoplay policies)

**Specific cross-browser checks:**

- [ ] Microphone access works in all browsers
- [ ] MediaRecorder API produces playable audio
- [ ] Web Audio API (waveform visualization) renders
- [ ] CSS `backdrop-filter: blur(8px)` (glassmorphism) renders in all browsers
- [ ] CSS custom properties (design tokens) applied correctly
- [ ] `prefers-color-scheme` media query respected (system dark/light mode)

---

## 13. Responsive Design Testing

Use Chrome DevTools device toolbar (F12 → Toggle device toolbar).

### 13.1 Viewports to Test

- [ ] **Mobile 375×812** (iPhone 12/13) — layout stacks, sidebar hidden, hamburger menu works
- [ ] **Mobile 390×844** (iPhone 14) — same checks
- [ ] **Tablet 768×1024** (iPad) — sidebar visible, content reflows
- [ ] **Desktop 1280×800** — full layout, sidebar + content
- [ ] **Desktop 1920×1080** — content centered, max-width applied (`var(--content-max)`)

### 13.2 Checks Per Viewport

- [ ] No horizontal scroll/overflow (check `body.scrollWidth <= window.innerWidth`)
- [ ] Text is readable at all sizes
- [ ] Buttons are tappable on mobile (min 44×44px touch target)
- [ ] Cards don't overflow container width
- [ ] Recording controls are centered and accessible
- [ ] Pinyin overlay (Mandarin) doesn't break layout on narrow screens

---

## 14. Accessibility Testing

### 14.1 Keyboard Navigation

- [ ] Can navigate entire app with Tab key only
- [ ] Focus order is logical (top-to-bottom, left-to-right)
- [ ] Focus visible (focus ring on buttons, links, inputs)
- [ ] Can activate buttons with Enter/Space
- [ ] Can close mobile sidebar with Escape (if implemented) or by clicking overlay

### 14.2 ARIA & Semantics

- [ ] All interactive elements have appropriate `aria-label` or visible text
- [ ] Icons that are decorative have `aria-hidden="true"`
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Sidebar has `role="navigation"` and `aria-label="Main navigation"`
- [ ] `<main>` landmark exists (`id="main-content"`)
- [ ] Skip nav link present (`.skip-nav` class — "Skip to main content")
- [ ] Active nav links have `aria-current="page"`

### 14.3 Screen Reader (Optional)

- [ ] Run with NVDA (Windows) or VoiceOver (macOS)
- [ ] Page structure announced correctly (headings, landmarks)
- [ ] Button labels are descriptive
- [ ] Score results are announced
- [ ] Recording state changes announced (if using `aria-live`)

### 14.4 Reduced Motion

- [ ] Set OS preference to "Reduce motion"
- [ ] App should respect `prefers-reduced-motion` media query
- [ ] Animations minimized or removed

---

## 15. Performance Testing

### 15.1 Page Load

- [ ] Initial page load < 3 seconds on broadband
- [ ] Lighthouse Performance score > 80 (run in Chrome DevTools)
- [ ] No render-blocking resources in `<head>`
- [ ] Fonts (Orbitron + Inter) load efficiently (use `font-display: swap`)

### 15.2 API Response Times

- [ ] GET /api/sentences < 200ms
- [ ] GET /api/progress < 300ms
- [ ] POST /api/score < 100ms
- [ ] POST /api/practice/analyze < 15 seconds (includes Whisper transcription + TTS generation)
- [ ] POST /api/tts < 5 seconds (first call, uncached) / < 100ms (cached)

### 15.3 Frontend

- [ ] No React "key" warnings in console
- [ ] No "useEffect" dependency warnings
- [ ] No memory leaks (check DevTools Memory tab after navigations)
- [ ] Waveform animation doesn't cause jank (check Performance tab)

---

## 16. Error Handling & Edge Cases

### 16.1 Network Errors

- [ ] Turn off backend → frontend shows error toast (not white screen)
- [ ] Turn off internet → API calls fail with error toast
- [ ] Backend returns 500 → error toast shown with message
- [ ] Backend returns 503 (service unavailable) → error toast with message

### 16.2 Audio Edge Cases

- [ ] Record 0 seconds (immediate stop) → analyze shows error or empty result
- [ ] Record 60+ seconds → should work (max ~10MB)
- [ ] Record background noise only → transcription may be empty/garbage, score low
- [ ] Whisper produces wrong transcription → score reflects the mismatch (low score)

### 16.3 Data Edge Cases

- [ ] Very long target sentence (>100 words) → scoring still works
- [ ] Special characters in sentence → scoring handles correctly
- [ ] Unicode (accented characters, CJK) → displays and scores correctly
- [ ] Empty sentence library for a level/language → 404 or empty array (graceful)

### 16.4 localStorage Edge Cases

- [ ] Clear all localStorage → onboarding flow triggers again
- [ ] Corrupt settings JSON → falls back to defaults (loadSettings has try/catch)
- [ ] Storage quota exceeded → app doesn't crash

---

## 17. Automated Test Suite

### 17.1 Backend Unit Tests (pytest)

Located in `backend/tests/`:

```bash
cd backend
source .venv/Scripts/activate
pytest tests/ -v
```

- [ ] `test_scoring.py::test_en_perfect` — perfect English match → 100/A+
- [ ] `test_scoring.py::test_en_partial` — extra word detected
- [ ] `test_scoring.py::test_zh_perfect` — perfect Mandarin match → 100/A+
- [ ] `test_scoring.py::test_zh_partial` — character mismatch detected
- [ ] `test_scoring.py::test_zh_empty_actual` — empty input → 0/F
- [ ] `test_tts_cache.py::test_cache_name_stable_and_language_scoped` — cache names deterministic
- [ ] `test_tts_cache.py::test_cache_name_provider_scoped` — different providers = different cache files
- [ ] All tests pass (7 total)

### 17.2 Playwright Web App Tests

Located in `scripts/test_webapp.py`:

```bash
pip install playwright
playwright install chromium
python scripts/test_webapp.py --url http://localhost:5173
```

The suite runs 6 test groups:

- [ ] **Page Load & Core Rendering** — HTTP 200, React mounted, no JS errors
- [ ] **Practice Page** — sidebar, sentence card, mic button, listen button present
- [ ] **Navigation** — can navigate to /progress, /settings, and back
- [ ] **API Connectivity** — /api/sentences and /api/progress return 2xx
- [ ] **Responsive Layout** — no horizontal overflow at 375px, 768px, 1280px
- [ ] **Accessibility Basics** — images have alt text, `<main>` landmark present
- [ ] All tests pass (0 failures in summary)
- [ ] Screenshots saved to `/tmp/echo_*.png`

To test against the live deployment:

```bash
python scripts/test_webapp.py  # defaults to https://echo-pronunciation.netlify.app/
```

---

## 18. End-to-End Manual Test Flow (Smoke Test)

Complete this full flow to verify the entire app works end-to-end:

1. [ ] Start backend + frontend dev servers
2. [ ] Open `http://localhost:5173` in Chrome
3. [ ] Complete onboarding (English, A1, Female Native)
4. [ ] Land on Home page — verify streak = 0, no recent sessions
5. [ ] Click "START SESSION"
6. [ ] On Practice page — wait for sentence to load
7. [ ] Read the sentence aloud, record for ~5 seconds
8. [ ] Stop recording
9. [ ] Click "Analyze My Pronunciation"
10. [ ] Wait for results page to load
11. [ ] Verify score percentage, grade, word breakdown chips
12. [ ] Click "PRACTICE AGAIN"
13. [ ] Complete 2 more sessions with different sentences
14. [ ] Navigate to Progress page — verify 3 sessions, average score, recent sessions list
15. [ ] Navigate to Home — verify streak = 1 (or more), sessions today = 3, updated stats
16. [ ] Navigate to Settings — change language to Spanish
17. [ ] Toggle dark mode — verify all pages look correct in dark mode
18. [ ] Navigate to 中文 Practice — verify Mandarin page loads with pinyin overlay
19. [ ] Record and analyze a Mandarin sentence (if you can read some Chinese)
20. [ ] Refresh page — verify settings persist (dark mode + Spanish)
21. [ ] Open a new tab, paste `http://localhost:5173` — verify onboarding is skipped

---

## 19. Bug Report Template

When you find a bug, copy and fill this template:

```
### Bug: [Short title]

**Date:** YYYY-MM-DD
**Tester:** [Your name]
**Environment:**
  - Browser: [Chrome 120 / Firefox 121 / etc.]
  - OS: [Windows 11 / macOS 14 / etc.]
  - URL: [http://localhost:5173/... or live URL]
  - Backend health: [whisper=true, kokoro=true, etc.]

**Steps to reproduce:**
1.
2.
3.

**Expected result:**

**Actual result:**

**Severity:** [Critical / High / Medium / Low]
  - Critical: App crashes, data loss, security issue
  - High: Core feature broken, no workaround
  - Medium: Feature broken but workaround exists
  - Low: Cosmetic, minor annoyance

**Screenshots/Recordings:** [Attach if possible]

**Console errors:** [Copy any JS errors from DevTools Console]

**Network errors:** [Copy any failed API calls from DevTools Network tab]
```

---

## 20. Sign-Off Checklist

Before declaring testing complete:

- [ ] All sections 1-18 reviewed
- [ ] All automated tests pass (pytest + Playwright)
- [ ] Smoke test (Section 18) completed successfully
- [ ] Cross-browser testing done (at least Chrome + Firefox)
- [ ] Responsive testing done (mobile + tablet + desktop)
- [ ] Dark mode verified on all pages
- [ ] Accessibility basics verified
- [ ] All bugs documented using the template
- [ ] Backend health check confirmed all services available
- [ ] Screenshots from Playwright test suite reviewed

---

## Appendix A: API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check + service status |
| GET | `/api/sentences?level=A1&language=en&limit=10` | Get practice sentences |
| POST | `/api/score` | Score expected vs actual text (JSON body) |
| POST | `/api/tts` | Generate TTS audio (JSON body) |
| POST | `/api/transcribe` | Transcribe audio file (multipart) |
| POST | `/api/practice/start` | Start a session (form data) |
| POST | `/api/practice/complete` | Complete a session (form data) |
| POST | `/api/practice/analyze` | Full pipeline: transcribe + score + TTS + save |
| GET | `/api/progress/{user_id}` | Get user progress stats |
| GET | `/audio/{filename}` | Serve cached TTS audio files |
| GET | `/docs` | FastAPI Swagger UI (interactive API docs) |

## Appendix B: Key File Locations

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app, all endpoints |
| `backend/scoring.py` | Levenshtein-based pronunciation scoring |
| `backend/database.py` | SQLite DB manager + sentence library |
| `backend/models.py` | Pydantic models for API contracts |
| `backend/whisper_service.py` | Whisper STT wrapper |
| `backend/kokoro_service.py` | Kokoro local TTS fallback |
| `backend/elevenlabs_service.py` | ElevenLabs cloud TTS |
| `backend/tests/` | Pytest unit tests |
| `frontend/src/App.tsx` | Router + layout + error boundary |
| `frontend/src/pages/` | All page components |
| `frontend/src/components/` | Reusable UI components |
| `frontend/src/services/api.ts` | Frontend API client |
| `frontend/src/types/index.ts` | TypeScript type definitions |
| `frontend/src/hooks/useMicrophone.ts` | Microphone recording hook |
| `frontend/src/contexts/ThemeContext.tsx` | Dark mode context |
| `scripts/test_webapp.py` | Playwright end-to-end test suite |
| `scripts/dev-start.sh` | Dev server startup script |

## Appendix C: Scoring Logic Reference

The scoring engine (`backend/scoring.py`) works as follows:

1. **For English/Spanish (Latin script):** Splits text into words, compares word-by-word using Levenshtein ratio.
2. **For Mandarin Chinese (CJK):** Segments text into individual characters, compares character-by-character.

**Status thresholds (per word/character):**

| Similarity | Status | Color |
|------------|--------|-------|
| >= 0.85 | correct | Green |
| 0.60 - 0.84 | partial | Gold/Yellow |
| < 0.60 | incorrect | Red |
| (expected word not found) | missed | Grey |
| (extra word in actual) | extra | Grey |

**Grade mapping (overall score):**

| Accuracy | Grade |
|----------|-------|
| >= 95% | A+ |
| 90-94% | A |
| 85-89% | B+ |
| 75-84% | B |
| 65-74% | C |
| 50-64% | D |
| < 50% | F |

## Appendix D: Sentence Library

The backend seeds a sentence library on first run. Available sentences:

- **English A1-A2:** 10 sentences (weather, food, travel, daily, conversation, education, work)
- **English B1-B2:** 10 sentences (home, teamwork, technology, business, environment)
- **Spanish A1:** 5 sentences (greeting, intro, home, food, animals)
- **Mandarin A1:** 10 sentences (greeting, weather, food, home, daily, intro, animals, people)

All sentences are stored in the `sentence_library` SQLite table and can be queried via `GET /api/sentences`.
