# Echo — Pronunciation Practice

**Live:** https://echo-pronunciation.netlify.app/

An AI-powered pronunciation practice app. Record your voice, get instant analysis, and improve your pronunciation through visual waveform comparison and phoneme-level feedback.

---

## What it does

- Record your pronunciation of target sentences
- Compare your waveform against a native speaker reference
- Get a score with phoneme-level breakdown (correct / partial / missed)
- Track progress over time with session history and streaks
- Supports English and Spanish (Mandarin planned)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom design tokens |
| Design system | Clinical Sublime (Positronica family) |
| Charts | Recharts |
| Icons | Lucide React |
| Audio | Web Audio API |
| TTS | ElevenLabs API |
| Deployment | Netlify |

---

## Design System

Echo uses the **Clinical Sublime** design system — part of the Positronica Labs design family.

- **Colors:** Lavender `#C4B5E3` primary, biological pink accent, synthetic green, quantum gold
- **Typography:** Orbitron (headlines, uppercase) + Inter (body)
- **Surfaces:** Pure white background with lavender dot-grid, glassmorphism cards (`blur(8px)`)
- **Borders:** Ghost borders (`rgba(196, 181, 227, 0.25)`) — no solid 1px lines
- **Shadows:** Lavender ambient glows only — no grey box-shadows
- **Corners:** Sharp (`sm`/`md` radius) — lab-grade precision aesthetic
- **Scrollbar:** 6px lavender, no rounding

Dark mode fully supported via `data-theme="dark"` and `prefers-color-scheme`.

---

## Screens

| Screen | Status | Notes |
|--------|--------|-------|
| Practice | ✅ Live | Main pronunciation recording + analysis |
| Progress | ✅ Live | Session history, accuracy charts |
| Settings | ✅ Live | Language, level, voice, dark mode |
| Home / Dashboard | 🎨 Designed | Streak, stats, recent sessions — pending impl |
| Onboarding | 🎨 Designed | 3-step language + level setup — pending impl |
| Session Results | 🎨 Designed | Post-session score + waveform — pending impl |

**Stitch designs:** `projects/3137471133853841416`

---

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

Requires `.env` in `frontend/`:
```
VITE_ELEVENLABS_API_KEY=your_key_here
VITE_API_URL=http://localhost:8000
```

---

## Project Structure

```
Echo/
├── frontend/
│   ├── src/
│   │   ├── components/       # MicRecorder, WaveComparison, ScoreDisplay, Sidebar
│   │   ├── pages/            # PracticePage, ProgressPage, SettingsPage
│   │   ├── hooks/            # useMicrophone
│   │   ├── contexts/         # ThemeContext
│   │   └── index.css         # Design token definitions
│   └── index.html            # Orbitron + Inter font imports
├── backend/                  # FastAPI (WIP)
├── ROADMAP.md                # Full feature roadmap + Stitch screen IDs
└── netlify.toml              # Deployment config
```

---

## Roadmap Highlights

- **v0.2** — Home, Onboarding, Results pages implementation
- **v0.3** — Recording button redesign, waveform Clinical Sublime update
- **v0.4** — Page transitions, recording experience animations
- **v1.0** — Auth, user accounts, backend persistence
- **Future** — Mandarin (ZH) with tone indicators, pinyin overlay, pitch contour comparison

See [ROADMAP.md](./ROADMAP.md) for full details.

---

## Deployment

Hosted on Netlify. Auto-deploys from `main` branch.

```bash
# Manual deploy
npm run build
# Netlify picks up dist/ automatically
```

Config: [`netlify.toml`](./netlify.toml) — build from `frontend/`, publish `frontend/dist/`.
