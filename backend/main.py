"""Echo - FastAPI Backend for Pronunciation Practice App"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from models import (
    TranscribeRequest, TranscribeResponse,
    ScoreRequest, ScoreResponse,
    TTSRequest, TTSResponse,
    PracticeSession, ProgressResponse
)
from whisper_service import WhisperService
from scoring import EchoScorer
from kokoro_service import KokoroService
from database import DatabaseManager

# Configuration
AUDIO_DIR = Path("audio_cache")
AUDIO_DIR.mkdir(exist_ok=True)

# Global services
whisper_service = None
scorer = None
kokoro_service = None
db_manager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global whisper_service, scorer, kokoro_service, db_manager

    print("🚀 Starting Echo backend services...")

    # Initialize services
    whisper_service = WhisperService()
    scorer = EchoScorer()
    kokoro_service = KokoroService()
    db_manager = DatabaseManager()

    print("✅ All services initialized")

    yield

    # Cleanup on shutdown
    print("🛑 Shutting down Echo backend services...")


app = FastAPI(
    title="Echo API",
    description="Pronunciation practice backend",
    version="0.1.0",
    lifespan=lifespan
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve cached audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "whisper": whisper_service is not None,
            "scorer": scorer is not None,
            "kokoro": kokoro_service is not None,
            "database": db_manager is not None
        }
    }


@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (wav/ogg/mp3)")
):
    """
    Transcribe audio using Whisper STT
    Returns transcription text and optional word-level confidence
    """
    try:
        # Save uploaded audio
        audio_path = AUDIO_DIR / audio.filename
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)

        # Transcribe
        result = await whisper_service.transcribe(str(audio_path))

        return TranscribeResponse(
            text=result["text"],
            words=result.get("words", []),
            language=result.get("language", "en")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.post("/api/score", response_model=ScoreResponse)
async def score_pronunciation(request: ScoreRequest):
    """
    Score pronunciation by comparing expected vs actual text
    Returns word-level scoring with color-coded feedback
    """
    try:
        result = scorer.score(
            expected=request.expected,
            actual=request.actual
        )

        return ScoreResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


@app.post("/api/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """
    Generate correct pronunciation audio using Kokoro TTS
    Returns audio file URL
    """
    try:
        audio_filename = f"tts_{hash(request.text)}.wav"
        audio_path = AUDIO_DIR / audio_filename

        # Generate TTS
        await kokoro_service.generate(
            text=request.text,
            output_path=str(audio_path),
            voice=request.voice or "af_heart",
            language=request.language or "en"
        )

        return TTSResponse(
            audio_url=f"/audio/{audio_filename}",
            text=request.text
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@app.post("/api/practice/start")
async def start_practice_session(
    user_id: str = Form(...),
    target_sentence: str = Form(...),
    language: str = Form(default="en"),
    level: str = Form(default="A1")
):
    """Start a new practice session"""
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
    """Complete a practice session and save results"""
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


@app.get("/api/progress/{user_id}", response_model=ProgressResponse)
async def get_progress(user_id: str):
    """Get user progress statistics"""
    try:
        progress = db_manager.get_user_progress(user_id)
        return ProgressResponse(**progress)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@app.get("/api/sentences")
async def get_sentences(
    level: str = "A1",
    language: str = "en",
    limit: int = 10
):
    """Get practice sentences by level and language"""
    try:
        sentences = db_manager.get_sentences(
            level=level,
            language=language,
            limit=limit
        )
        return {"sentences": sentences}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sentences: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
