# Echo — Development Roadmap

**Live:** https://echo-pronunciation.netlify.app/
**Design system:** Clinical Sublime (Positronica family) — Lavender + Orbitron + Inter
**Stitch project:** `projects/3137471133853841416`

---

## Screen Inventory

### Shipped (in code)
| Screen | File | Status |
|--------|------|--------|
| Practice | `frontend/src/pages/PracticePage.tsx` | ✅ Live |
| Progress | `frontend/src/pages/ProgressPage.tsx` | ✅ Live |
| Settings | `frontend/src/pages/SettingsPage.tsx` | ✅ Live |

### Designed in Stitch (pending implementation)
| Screen | Stitch ID | Priority |
|--------|-----------|----------|
| Home / Dashboard | `projects/3137471133853841416` | P0 |
| Onboarding — Level Select | `screens/9590317558ed4f35a47e57a15ced1a88` | P0 |
| Session Results | `screens/6eaa1ac535d844eb8635cf3ccd05bd98` | P1 |

### Missing / Future screens
| Screen | Notes | Priority |
|--------|-------|----------|
| Auth / Login | Email + Google OAuth | P1 |
| User Profile | Stats, achievements, streak history | P2 |
| Leaderboard | Community rankings by language + level | P3 |
| Mandarin Pronunciation (ZH) | Tone practice, pinyin overlay, stroke animation | Future |

---

## Phase 0: Design System Migration ✅

**Completed 2026-05-16**

- Migrated from "Warm Editorial" (terracotta/cream/serif) → "Clinical Sublime" (Positronica family)
- Token swap: lavender `#6B5BA6` primary, `#C4B5E3` brand, ghost borders, lavender glows
- Font swap: DM Serif Display + Be Vietnam Pro → **Orbitron** (headlines) + **Inter** (body)
- Glassmorphism cards: `backdrop-filter: blur(8px)` + ghost border `rgba(196,181,227,0.25)`
- Dot-grid background via `radial-gradient` (lavender 20% opacity)
- Scrollbar: 6px lavender, no rounding (Positronica spec)
- Dark mode: deep purple-black `#0D0B14` base with lavender surfacing

---

## Phase 1: Missing Screens Implementation (P0-P1)

### 1.1 Home / Dashboard Page
**Impact: Critical | Effort: Medium**

New `HomePage.tsx` — first screen after app load:
- Left collapsed sidebar (icon-only, 64px) with lavender active strip
- Terminal label `> ECHO // PRONUNCIATION INTELLIGENCE`
- Hero: Orbitron streak counter + `START SESSION` CTA (lavender gradient)
- Language selector: EN / ES pill switcher (active=lavender, ghost=inactive)
- Stats row: 3 glass cards — Sessions Today, Accuracy %, Words Mastered
- Gradient divider: lavender→pink→lavender
- Recent Sessions list: flag + date + score chip + replay, 24px spacing, no dividers

**Design reference:** Stitch `projects/3137471133853841416`

### 1.2 Onboarding Flow (3 steps)
**Impact: Critical | Effort: Medium**

New `OnboardingPage.tsx` — first-run experience:
- Step progress bar (3 dots, lavender→pink gradient connector)
- Step 1: Language selection (EN, ES, FR, DE, IT, PT, JP, ZH-future)
- Step 2: Level selection A1–C2 (active card: solid lavender + glow) — **Stitch designed** `screens/9590317558ed4f35a47e57a15ced1a88`
- Step 3: Voice preference (Female Native / Male Native pills)
- Center glass panel: `backdrop-filter: blur(8px)`, white 85% opacity, ghost border
- Terminal label `> CALIBRATION PROTOCOL 0X / 03`
- Back ghost button + CONTINUE lavender gradient button

### 1.3 Session Results Page
**Impact: High | Effort: Medium**

New `ResultsPage.tsx` — shown after analyzing pronunciation:
- Terminal label `> SESSION COMPLETE // YYYY-MM-DD`
- SVG circular progress ring (lavender stroke, ghost track) with Orbitron score %
- Stats chips row: Words Practiced, Streak +N, Best Word — glass cards with pulse particles
- Gradient divider
- Waveform comparison panel: target (lavender) vs user (pink) SVG overlays with terminal labels + ghost replay buttons
- Phoneme breakdown: horizontal chip row, color-coded bottom border (green/gold/pink)
- Actions: `PRACTICE AGAIN` (lavender gradient) + `HOME` (ghost)

**Design reference:** Stitch `screens/6eaa1ac535d844eb8635cf3ccd05bd98`

---

## Phase 2: Core Components Polish

### 2.1 Recording Button Redesign
**Impact: High | Effort: Medium**

- Idle: 80px circle, lavender ghost border, soft lavender glow
- Hover: 4px lift + glow intensifies to 40% opacity
- Recording: 3 concentric ripple rings (CSS keyframe, staggered), pink pulse particle
- Processing: spinner morphing from mic icon, lavender color
- Success: brief green flash, transitions to results

### 2.2 Waveform Comparison Component
**Impact: Critical | Effort: High**

Already partially built in `WaveComparison.tsx`. Redesign to Clinical Sublime:
- SVG-based (not canvas) for crisp rendering
- Target wave: lavender `#C4B5E3`, full opacity
- User wave: pink `#A85880`, 80% opacity overlay
- Divergence areas: gold highlight where >20% apart
- Animated stroke-dasharray reveal on mount
- Ghost replay buttons with terminal labels `> TARGET` / `> YOUR RECORDING`

### 2.3 Score Display Redesign
**Impact: High | Effort: Medium**

- Circular SVG progress ring replacing flat badge
- Phoneme tiles: color-coded borders instead of background fills
- Expand-on-click: IPA transcription + tip panel (glass card)
- Confetti: `<canvas>` particle burst in lavender/pink/gold for scores >90%

---

## Phase 3: Layout & Sidebar

### 3.1 Sidebar Refinements
**Impact: Medium | Effort: Low**

- Collapsed state (64px) with icon-only + tooltip (terminal-label style)
- Active indicator: left lavender strip (2px, no rounded corners)
- Glassmorphism on scroll: `backdrop-filter: blur(16px)` when content scrolls behind
- Mobile: bottom sheet drawer instead of overlay

### 3.2 Practice Page Layout
**Impact: Medium | Effort: Medium**

- Single-column centered on mobile
- Sentence card as visual hero (large Orbitron text for target sentence)
- Recording controls as floating central element
- Score panel: slide up from bottom on mobile (drawer), side panel on desktop

---

## Phase 4: Animations

### 4.1 Recording Experience Flow
- Pre-record: sentence card dims, recorder focuses
- Recording: waveform canvas expands with lavender glow
- Post-record: collapse recorder → slide in analyze button
- Analysis: lavender spinning indicator
- Results: score count-up animation (Orbitron numbers)

### 4.2 Page Transitions
- Fade + 8px Y-slide on route change
- Staggered card entrance (each card 50ms offset)
- Skeleton shimmer: diagonal lavender gradient, not grey

---

## Phase 5: Advanced Features

### 5.1 Comparison Playback
- Synced A/B playback (target vs user)
- Scrubber on waveform panel
- Keyboard: `T` = play target, `R` = play recording, `Space` = toggle

### 5.2 Real-time Pitch Feedback
- Web Audio API pitch detection during recording
- Color-coded pitch contour overlay on waveform
- Reference pitch line from target audio analysis

### 5.3 Auth & User Accounts
- Google OAuth + email/password
- Persist progress, streak, settings to backend
- Profile page with heatmap (GitHub-style daily practice calendar)

---

## Future: Mandarin Pronunciation (ZH)

> Planned feature — not scoped yet. Adding here for visibility.

Mandarin is tonally complex and requires specialized UI:
- **Tone indicators:** Visual overlay of 4 tones (tone marks + color coding: 1=lavender, 2=pink, 3=gold, 4=green)
- **Pinyin overlay:** Show pinyin romanization below each character
- **Stroke order animation:** Optional SVG stroke-order animation on character tap
- **Tone practice mode:** Dedicated mode for drilling tone 1-4 discrimination
- **Pitch contour comparison:** Essential for tonal languages — compare user pitch curve to native reference
- **HSK vocabulary sets:** Graded word lists (HSK 1–6) for structured practice
- **Zhuyin support (optional):** Alternative phonetic system for Traditional Chinese users

**Dependencies before scoping:**
- Audio analysis backend must support tonal language pitch extraction
- Need Mandarin TTS native voice (ElevenLabs or Azure Cognitive)
- Pinyin rendering library (e.g., `pinyin-pro`)

---

## Impact vs Effort Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Home / Dashboard | Critical | Medium | P0 |
| Onboarding Flow | Critical | Medium | P0 |
| Session Results Page | High | Medium | P1 |
| Recording Button Redesign | High | Medium | P1 |
| Waveform Component (Clinical Sublime) | Critical | High | P1 |
| Score Display Redesign | High | Medium | P1 |
| Auth / Login | High | High | P2 |
| Sidebar Refinements | Medium | Low | P2 |
| Practice Page Layout | Medium | Medium | P2 |
| Recording Experience Flow | High | Medium | P2 |
| Comparison Playback | High | Medium | P3 |
| Profile + Heatmap | Medium | Medium | P3 |
| Leaderboard | Medium | High | P3 |
| Real-time Pitch Feedback | Medium | High | P4 |
| Mandarin (ZH) Support | High | Very High | Future |

---

## Milestones

### v0.2 — Missing Screens (current sprint)
- [ ] HomePage.tsx implementation
- [ ] OnboardingPage.tsx (3-step flow)
- [ ] ResultsPage.tsx
- [ ] Router setup (React Router v6)

### v0.3 — Components Polish
- [ ] Recording button redesign
- [ ] Waveform component Clinical Sublime update
- [ ] Score display with SVG ring

### v0.4 — Animations & Flow
- [ ] Page transitions
- [ ] Recording experience full flow
- [ ] Skeleton loaders update

### v1.0 — Auth + Persistence
- [ ] Google OAuth
- [ ] User profile + streak persistence
- [ ] Deploy backend API (currently static frontend only)
