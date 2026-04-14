"""Pydantic models for Echo API contracts"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class WordScore(BaseModel):
    """Score for a single word"""
    word: str
    status: str  # "correct", "partial", "incorrect", "missed"
    confidence: Optional[float] = None
    said: Optional[str] = None


class TranscribeRequest(BaseModel):
    """Request for audio transcription"""
    pass  # Audio comes as multipart file upload


class TranscribeResponse(BaseModel):
    """Response from audio transcription"""
    text: str
    words: List[dict] = []  # Word-level timestamps/confidence
    language: str = "en"


class ScoreRequest(BaseModel):
    """Request for pronunciation scoring"""
    expected: str = Field(..., description="Target sentence text")
    actual: str = Field(..., description="What user actually said")


class ScoreResponse(BaseModel):
    """Response from pronunciation scoring"""
    overall_score: int = Field(..., ge=0, le=100)
    grade: str  # A, B, C, D, F
    words: List[WordScore]
    flagged: List[WordScore] = []


class TTSRequest(BaseModel):
    """Request for TTS generation"""
    text: str
    voice: Optional[str] = "af_heart"
    language: Optional[str] = "en"


class TTSResponse(BaseModel):
    """Response from TTS generation"""
    audio_url: str
    text: str


class PracticeSession(BaseModel):
    """Practice session record"""
    id: Optional[int] = None
    user_id: str
    target_sentence: str
    actual_transcription: Optional[str] = None
    score: Optional[int] = None
    grade: Optional[str] = None
    flagged_words: Optional[str] = None
    language: str = "en"
    level: str = "A1"
    timestamp: Optional[datetime] = None


class ProgressResponse(BaseModel):
    """User progress statistics"""
    user_id: str
    level: str
    total_sessions: int
    avg_score: float
    streak_days: int
    total_words_practiced: int
    last_practice: Optional[datetime] = None
    recent_sessions: List[dict] = []


class SentenceRecord(BaseModel):
    """Practice sentence from library"""
    id: int
    text: str
    language: str
    level: str
    topic: Optional[str] = None
    times_practiced: int = 0
