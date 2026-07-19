"""Small helpers shared by main.py and tests (no heavy imports)."""
import hashlib


def tts_cache_name(text: str, language: str, provider: str = "kk") -> str:
    """Stable, language- and provider-scoped TTS cache filename."""
    key = hashlib.sha1(f"{provider}:{language}:{text}".encode()).hexdigest()[:16]
    return f"tts_{key}.wav"
