# Voice Practice App (ELSA-like)

> Created: 2026-04-12 | Status: **Architecture Complete** ✅ | Next: Phase 1 Implementation

## Full Architecture Plan
📄 See: `Echo_Architecture_Plan.md` - Complete with Mermaid diagrams, Stitch UI design, and mobile app deployment strategy.

**Project Summary:**
- **Phase 1:** Metis Telegram Bot (MVP - Start here)
- **Phase 2:** React + FastAPI Web App
- **Phase 3:** React Native Mobile Apps (Play Store + App Store)
- **Phase 4:** Advanced Features (phoneme scoring, adaptive difficulty)

**Stitch UI Design:** https://stitch.withgoogle.com/projects/3633717535729093290

## Goal
Build a pronunciation practice app (like ELSA Speak) using existing local AI tools.

## Current Stack (Already Running)
- **TTS:** Kokoro + Piper (English `af_heart`, Spanish `ef_dora`)
- **STT:** Whisper (via Handy desktop app / Python `faster-whisper`)
- **LLM:** Ollama (`qwen2.5-coder:7b`, `phi3:mini`, `qwen2.5:14b`)
- **Bot:** Metis (Telegram bot with LangGraph + 9 routes)
- **Kokoro voices:** af_heart (EN), ef_dora (ES), zf_xiaoxiao/zm_yunxi (ZH)

## Architecture

```
┌─────────────────────────────────────────┐
│         ELSA-like Pronunciation App     │
├─────────────────────────────────────────┤
│ 1. Show sentence (reading practice)     │
│ 2. User speaks → record/send audio      │
│ 3. Whisper → transcribe what they said  │
│ 4. WhisperX → word-level alignment      │
│ 5. Compare expected vs actual words     │
│ 6. Score pronunciation + flag errors   │
│ 7. Kokoro TTS → play correct version    │
│ 8. Track progress over time             │
└─────────────────────────────────────────┘
```

## Implementation Options

### Option A: Metis Telegram Skill (Fastest)
- Add `/practice` command to Metis
- Send voice message → Metis transcribes with Whisper
- Compares to target text, scores accuracy
- Sends back score + Kokoro TTS audio of correct pronunciation
- Uses existing LangGraph routing + Telegram bot infrastructure

### Option B: Standalone Web App
- React frontend (could extend UIGen)
- FastAPI backend for Whisper + Kokoro
- Browser microphone recording
- Progress tracking dashboard

### Option C: CLI Tool
- Python script using `sounddevice` + `faster-whisper`
- Terminal-based practice sessions
- Quickest to build, less polished UX

## Tech Details

### Whisper Transcription
- Use `faster-whisper` (optimized, GPU-capable)
- Model: `medium` for good accuracy/speed balance
- `whisper-rs` for Rust-native option

### WhisperX (Word-level Alignment)
- GitHub: `m-bain/whisperX`
- Provides word-level timestamps + confidence scores
- Can detect mispronounced words by low confidence
- Requires GPU for best performance

### Scoring Algorithm
```python
# Compare expected vs actual transcription
expected = "The comfortable chair was by the window"
actual = whisper_transcribe(audio_file)

# Word-level comparison
expected_words = expected.lower().split()
actual_words = actual.lower().split()

# Levenshtein distance for mispronunciation detection
score = word_similarity(expected_words, actual_words)
flagged = find_mispronounced(expected_words, actual_words)
```

### TTS Feedback
- Use Kokoro with `af_heart` (English) or `ef_dora` (Spanish)
- Play correct pronunciation of flagged words
- Loop: user retries → new score

## Voice Input Methods

| Platform | STT Method |
|----------|-----------|
| Desktop (PC) | Handy (global hotkey) |
| Telegram | Voice messages → Whisper |
| Phone (Xiaoxin Pad) | Gboard voice typing (built-in) |
| Web App | Browser MediaRecorder API |

## Phone Limitations
- Handy is desktop-only (Tauri + system hotkeys)
- Android can't run Tauri apps
- Workaround: Gboard dictation or Whisper.cpp via Termux
- For full integration: Telegram voice messages → Metis → Whisper

## Dependencies Needed (Python)
```
faster-whisper
whisperx
silero-vad
sounddevice (for recording)
levenshtein (for scoring)
# Kokoro already installed ✅
```

## Tasks
- [ ] Choose implementation option (A/B/C)
- [ ] Install Whisper + WhisperX in Metis venv
- [ ] Implement transcription pipeline
- [ ] Build scoring/alignment logic
- [ ] Integrate with Kokoro TTS for feedback
- [ ] Add Telegram bot commands
- [ ] Test with English and Spanish practice sessions
- [ ] Add progress tracking

## Notes
- Kokoro inference ~3-5s per sentence on Ryzen 5 5600G (CPU)
- Whisper medium should run on GPU (AMD RX 6700 XT) if supported
- Consider `openai-whisper` if GPU acceleration works better
- VAD (Silero) to filter silence before transcription
