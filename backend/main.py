"""Echo - FastAPI Backend for Pronunciation Practice App"""

import os
import subprocess
import uuid
import tempfile
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from models import (
    ScoreRequest, ScoreResponse,
    TTSRequest, TTSResponse,
    ProgressResponse,
    AnalyzeResponse
)
from scoring import EchoScorer
from database import DatabaseManager

# ─── Optional AI services with graceful degradation ───
WHISPER_AVAILABLE = False
KOKORO_AVAILABLE = False
whisper_service = None
kokoro_service = None

try:
    from whisper_service import WhisperService
    whisper_service = WhisperService()
    WHISPER_AVAILABLE = True
    print("Whisper STT service loaded")
except Exception as e:
    print(f"Whisper not available (non-blocking): {e}")

try:
    from kokoro_service import KokoroService
    kokoro_service = KokoroService()
    if kokoro_service.pipelines:
        KOKORO_AVAILABLE = True
        print("Kokoro TTS service loaded")
    else:
        print("Kokoro imported but pipelines not available")
except Exception as e:
    print(f"Kokoro not available (non-blocking): {e}")

# ─── Configuration ───
AUDIO_DIR = Path("audio_cache")
AUDIO_DIR.mkdir(exist_ok=True)

FFMPEG_PATH = "ffmpeg"

# ─── Core services (always available) ───
scorer = EchoScorer()
db_manager = DatabaseManager()


def convert_audio_to_wav(input_path: str) -> str:
    """Convert any audio format to 16kHz mono WAV using ffmpeg."""
    output_path = str(Path(input_path).with_suffix("")) + "_converted.wav"
    try:
        subprocess.run(
            [FFMPEG_PATH, "-y", "-i", input_path,
             "-acodec", "pcm_s16le", "-ac", "1", "-ar", "16000",
             output_path],
            capture_output=True, text=True, timeout=30, check=True
        )
        return output_path
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Audio conversion timed out")
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Audio conversion failed (exit {e.returncode}): {e.stderr.splitlines()[-1] if e.stderr else 'unknown error'}"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="ffmpeg is not installed on the server"
        )


# ─── Application ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Echo backend starting...")
    print(f"  Whisper STT: {'available' if WHISPER_AVAILABLE else 'unavailable'}")
    print(f"  Kokoro TTS:  {'available' if KOKORO_AVAILABLE else 'unavailable'}")
    print(f"  Scorer:      always available")
    print(f"  Database:    always available")
    yield
    print("Echo backend shutting down...")


app = FastAPI(
    title="Echo API",
    description="Pronunciation practice backend",
    version="0.2.0",
    lifespan=lifespan
)

# ─── CORS ───
_cors = os.environ.get("ECHO_CORS_ORIGINS", "").strip()
_allow_origins = ([o.strip() for o in _cors.split(",") if o.strip()]
                  if _cors else ["http://localhost:5173", "http://localhost:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


# ─── Health ───
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.2.0",
        "services": {
            "whisper": WHISPER_AVAILABLE,
            "kokoro": KOKORO_AVAILABLE,
            "scorer": True,
            "database": True
        }
    }


# ─── Transcribe ───
@app.post("/api/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (any format ffmpeg can decode)")
):
    """Transcribe audio using Whisper STT (if available)."""
    if not WHISPER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Whisper STT is not available. Install faster-whisper and torch."
        )

    raw_path = AUDIO_DIR / f"raw_{uuid.uuid4().hex[:8]}{Path(audio.filename or 'audio').suffix or '.webm'}"
    try:
        content = await audio.read()
        raw_path.write_bytes(content)

        wav_path = convert_audio_to_wav(str(raw_path))
        result = await whisper_service.transcribe(wav_path)

        return {
            "text": result["text"],
            "words": result.get("words", []),
            "language": result.get("language", "en")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if raw_path.exists():
            raw_path.unlink(missing_ok=True)
        converted = Path(str(raw_path).rsplit(".", 1)[0] + "_converted.wav")
        if converted.exists():
            converted.unlink(missing_ok=True)


# ─── Score ───
@app.post("/api/score", response_model=ScoreResponse)
async def score_pronunciation(request: ScoreRequest):
    """Score pronunciation by comparing expected vs actual text."""
    try:
        result = scorer.score(expected=request.expected, actual=request.actual)
        return ScoreResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


# ─── TTS ───
@app.post("/api/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Generate correct pronunciation audio using Kokoro TTS."""
    if not KOKORO_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Kokoro TTS is not available. Install kokoro, phonemizer, and espeakng-loader."
        )

    try:
        text_hash = str(abs(hash(request.text)))
        audio_filename = f"tts_{text_hash}.wav"
        audio_path = AUDIO_DIR / audio_filename

        if not audio_path.exists():
            await kokoro_service.generate(
                text=request.text,
                output_path=str(audio_path),
                voice=request.voice or "af_heart",
                language=request.language or "en"
            )

        return TTSResponse(audio_url=f"/audio/{audio_filename}", text=request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


# ─── Practice Session Management ───
@app.post("/api/practice/start")
async def start_practice_session(
    user_id: str = Form(...),
    target_sentence: str = Form(...),
    language: str = Form(default="en"),
    level: str = Form(default="A1")
):
    """Start a new practice session."""
    try:
        session = db_manager.create_session(
            user_id=user_id,
            target_sentence=target_sentence,
            language=language,
            level=level
        )
        return {"session_id": session.id, "target": target_sentence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")


@app.post("/api/practice/complete")
async def complete_practice_session(
    session_id: int = Form(...),
    score: int = Form(...),
    grade: str = Form(...),
    transcription: str = Form(...),
    flagged_words: str = Form(default="")
):
    """Complete a practice session and save results."""
    try:
        db_manager.complete_session(
            session_id=session_id,
            score=score,
            grade=grade,
            transcription=transcription,
            flagged_words=flagged_words
        )
        return {"status": "success", "message": "Session saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete session: {str(e)}")


# ─── Progress & Sentences ───
@app.get("/api/progress/{user_id}", response_model=ProgressResponse)
async def get_progress(user_id: str):
    """Get user progress statistics."""
    try:
        progress = db_manager.get_user_progress(user_id)
        return ProgressResponse(**progress)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@app.get("/api/sentences")
async def get_sentences(level: str = "A1", language: str = "en", limit: int = 10):
    """Get practice sentences by level and language."""
    try:
        sentences = db_manager.get_sentences(level=level, language=language, limit=limit)
        return {"sentences": sentences}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sentences: {str(e)}")


# ─── Merged Analyze Endpoint ───
@app.post("/api/practice/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(..., description="Recorded audio"),
    expected_text: str = Form(..., description="Target sentence the user should say"),
    user_id: str = Form(default="web-user"),
    language: str = Form(default="en"),
    level: str = Form(default="A1")
):
    """
    Full practice pipeline in one call:
    1. Convert audio with ffmpeg
    2. Start a practice session
    3. Transcribe with Whisper (if available, else return empty)
    4. Score pronunciation
    5. Generate TTS audio (if Kokoro available)
    6. Save the session results
    """
    raw_path = AUDIO_DIR / f"raw_{uuid.uuid4().hex[:8]}{Path(audio.filename or 'audio').suffix or '.webm'}"
    transcription_text = ""
    words = []
    detected_language = language
    tts_url = None

    try:
        content = await audio.read()
        raw_path.write_bytes(content)

        wav_path = convert_audio_to_wav(str(raw_path))

        # 1. Start session
        session = db_manager.create_session(
            user_id=user_id,
            target_sentence=expected_text,
            language=language,
            level=level
        )

        # 2. Transcribe
        if WHISPER_AVAILABLE and whisper_service:
            result = await whisper_service.transcribe(wav_path)
            transcription_text = result.get("text", "")
            words = result.get("words", [])
            detected_language = result.get("language", language)
        else:
            transcription_text = ""

        # 3. Score
        if transcription_text:
            score_result = scorer.score(expected=expected_text, actual=transcription_text)
        else:
            score_result = None

        # 4. TTS
        audio_filename = None
        if KOKORO_AVAILABLE and kokoro_service:
            try:
                text_hash = str(abs(hash(expected_text)))
                audio_filename = f"tts_{text_hash}.wav"
                audio_path = AUDIO_DIR / audio_filename
                if not audio_path.exists():
                    await kokoro_service.generate(
                        text=expected_text,
                        output_path=str(audio_path),
                        voice="af_heart" if language == "en" else "ef_dora",
                        language=language
                    )
                tts_url = f"/audio/{audio_filename}"
            except Exception as tts_err:
                print(f"TTS generation failed (non-blocking): {tts_err}")

        # 5. Save session
        if score_result:
            flagged_str = ",".join(f["word"] for f in score_result.get("flagged", []))
            db_manager.complete_session(
                session_id=session.id,
                score=score_result["overall_score"],
                grade=score_result["grade"],
                transcription=transcription_text,
                flagged_words=flagged_str
            )
        else:
            db_manager.complete_session(
                session_id=session.id,
                score=0,
                grade="N/A",
                transcription=transcription_text,
                flagged_words=""
            )

        return {
            "session_id": session.id,
            "transcription": transcription_text,
            "words": words,
            "language": detected_language,
            "score": score_result,
            "tts_url": tts_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if raw_path.exists():
            raw_path.unlink(missing_ok=True)
        converted = Path(str(raw_path).rsplit(".", 1)[0] + "_converted.wav")
        if converted.exists():
            converted.unlink(missing_ok=True)


# ─── Startup ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
