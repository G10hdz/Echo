"""edge-tts caching proxy.

POST /tts?text=...&language=en&voice=...
GET  /audio/<hash>.mp3
GET  /health

Files cached forever on disk. Provider is Microsoft Edge Read-Aloud
(same neural voices as Azure, free, no API key).
"""
import os
import hashlib
import tempfile
from pathlib import Path
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse, RedirectResponse

app = FastAPI(title="Echo edge-tts proxy", version="1.0.0")

CACHE_DIR = Path(os.environ.get("CACHE_DIR", "/cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_VOICES = {
    "en": "en-US-AriaNeural",
    "es": "es-MX-DaliaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
}


def _cache_key(text: str, voice: str) -> str:
    return hashlib.sha1(f"{voice}:{text}".encode()).hexdigest()[:16]


@app.get("/health")
async def health():
    return {"status": "ok", "cache_files": len(list(CACHE_DIR.glob("*.mp3")))}


@app.post("/tts")
async def tts(
    text: str = Form(...),
    language: str = Form("en"),
    voice: str | None = Form(None),
):
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(500, "edge-tts not installed")
    voice_name = voice or DEFAULT_VOICES.get(language, DEFAULT_VOICES["en"])
    key = _cache_key(text, voice_name)
    path = CACHE_DIR / f"{key}.mp3"
    if not path.exists():
        communicate = edge_tts.Communicate(text, voice_name)
        await communicate.save(str(path))
    return FileResponse(path, media_type="audio/mpeg",
                        headers={"X-Cache-Key": key, "X-Voice": voice_name})


@app.get("/audio/{key}.mp3")
async def serve_cached(key: str):
    path = CACHE_DIR / f"{key}.mp3"
    if not path.exists():
        raise HTTPException(404, "not cached")
    return FileResponse(path, media_type="audio/mpeg")
