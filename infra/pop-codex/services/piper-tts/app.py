"""Piper TTS HTTP wrapper.
Onnx-only, fast on CPU (~0.1s/sentence). Pre-downloads voices on first start.

POST /tts  form: text=...&language=en|es|zh&voice=<optional>
GET  /voices
GET  /health
"""
import os
import io
import wave
import tempfile
import subprocess
from pathlib import Path
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
import urllib.request

app = FastAPI(title="Echo Piper TTS", version="1.0.0")

VOICES_DIR = Path(os.environ.get("PIPER_VOICES_DIR", "/voices"))
VOICES_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_VOICES = {
    "en": os.environ.get("PIPER_VOICE_EN", "en_US-amy-medium"),
    "es": os.environ.get("PIPER_VOICE_ES", "es_MX-ald-medium"),
    "zh": os.environ.get("PIPER_VOICE_ZH", "cmn_hans-cn-xiaoxiao-medium"),
}

VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang}/{lang_code}/{quality}/{voice}.onnx"
VOICE_JSON = "https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang}/{lang_code}/{quality}/{voice}.onnx.json"

LANG_MAP = {
    "en": ("en_US", "en_US"),
    "es": ("es_MX", "es_MX"),
    "zh": ("cmn_hans", "cmn_Hans"),
}


def _voice_path(voice: str, language: str) -> Path:
    return VOICES_DIR / f"{voice}.onnx"


def _ensure_voice(voice: str, language: str) -> Path:
    path = _voice_path(voice, language)
    if path.exists():
        return path
    lang_dir, lang_code = LANG_MAP.get(language, LANG_MAP["en"])
    quality = "medium" if "medium" in voice else "high" if "high" in voice else "low"
    base = VOICE_BASE.format(lang=lang_code.lower().split("_")[0], lang_code=lang_code, quality=quality, voice=voice)
    json_url = VOICE_JSON.format(lang=lang_code.lower().split("_")[0], lang_code=lang_code, quality=quality, voice=voice)
    VOICES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"downloading {voice} from {base}")
    urllib.request.urlretrieve(base, str(path))
    urllib.request.urlretrieve(json_url, str(path) + ".json")
    return path


def _ensure_piper_binary() -> str:
    """Piper ships a portable binary. Download once."""
    bin_path = Path("/opt/piper/piper")
    if bin_path.exists() and os.access(bin_path, os.X_OK):
        return str(bin_path)
    bin_path.parent.mkdir(parents=True, exist_ok=True)
    # Latest release as of writing; pin for reproducibility.
    url = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
    import tarfile
    tmp_tar = Path("/tmp/piper.tar.gz")
    urllib.request.urlretrieve(url, str(tmp_tar))
    with tarfile.open(tmp_tar) as t:
        t.extractall("/opt/")
    bin_path.chmod(0o755)
    return str(bin_path)


@app.get("/health")
async def health():
    return {"status": "ok", "voices_loaded": len(list(VOICES_DIR.glob("*.onnx")))}


@app.get("/voices")
async def list_voices():
    return {"voices": [p.stem for p in VOICES_DIR.glob("*.onnx")]}


@app.post("/tts")
async def tts(
    text: str = Form(...),
    language: str = Form("en"),
    voice: str | None = Form(None),
):
    if language not in DEFAULT_VOICES:
        raise HTTPException(400, f"Unsupported language: {language}")
    voice_name = voice or DEFAULT_VOICES[language]
    voice_path = _ensure_voice(voice_name, language)
    piper_bin = _ensure_piper_binary()

    out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    out.close()
    try:
        proc = subprocess.run(
            [piper_bin, "-m", str(voice_path), "-f", out.name, "--quiet"],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=30,
        )
        if proc.returncode != 0:
            raise HTTPException(500, f"Piper failed: {proc.stderr.decode()[:300]}")
        return FileResponse(out.name, media_type="audio/wav",
                            headers={"X-Voice": voice_name})
    except Exception:
        os.unlink(out.name)
        raise
