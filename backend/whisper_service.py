"""Whisper STT service for Echo"""

import os
from typing import Dict, Optional, List
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None


class WhisperService:
    """Handles audio transcription using faster-whisper"""

    def __init__(self, model_size: str = "medium", device: str = "auto"):
        self.model_size = model_size
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load Whisper model"""
        if WhisperModel is None:
            raise RuntimeError("faster-whisper not installed")

        # Try CUDA first (works with AMD ROCm if configured)
        device = "cuda" if self._check_gpu() else "cpu"

        print(f"🎤 Loading Whisper {self.model_size} on {device}...")
        self.model = WhisperModel(
            self.model_size,
            device=device,
            compute_type="int8" if device == "cpu" else "float16"
        )
        print(f"✅ Whisper model loaded on {device}")

    def _check_gpu(self) -> bool:
        """Check if GPU is available"""
        try:
            import torch
            return torch.cuda.is_available()
        except:
            return False

    async def transcribe(self, audio_path: str) -> Dict:
        """
        Transcribe audio file
        Returns: {"text": str, "words": [{"word": str, "start": float, "end": float}], "language": str}
        """
        if not self.model:
            raise RuntimeError("Whisper model not loaded")

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            word_timestamps=True,
            language="en",  # Default to English, can be auto-detected
            vad_filter=True  # Filter silence
        )

        text_parts = []
        words = []

        for segment in segments:
            text_parts.append(segment.text)

            for word in segment.words or []:
                words.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.probability
                })

        return {
            "text": " ".join(text_parts).strip(),
            "words": words,
            "language": info.language
        }

    async def transcribe_with_language(
        self,
        audio_path: str,
        language: str = "auto"
    ) -> Dict:
        """Transcribe with specific language"""
        if not self.model:
            raise RuntimeError("Whisper model not loaded")

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            word_timestamps=True,
            language=language if language != "auto" else None,
            vad_filter=True
        )

        text_parts = []
        words = []

        for segment in segments:
            text_parts.append(segment.text)
            for word in segment.words or []:
                words.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.probability
                })

        return {
            "text": " ".join(text_parts).strip(),
            "words": words,
            "language": info.language
        }
