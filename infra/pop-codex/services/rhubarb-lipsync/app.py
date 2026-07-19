"""Rhubarb Lip Sync HTTP wrapper.

Audio in → visemes JSON out (Preston Blair 13 shapes).
Uses Rhubarb binary (DanielSWolf/rhubarb-lip-sync, GPL).

POST /align  form: audio=@file.wav
GET  /health
"""
import os
import tempfile
import subprocess
import urllib.request
import tarfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="Echo Rhubarb Lipsync", version="1.0.0")

RHUBARB_VERSION = "1.14.0"
RHUBARB_URL = (
    "https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/"
    f"{RHUBARB_VERSION}/rhubarb-lip-sync-{RHUBARB_VERSION}-linux.zip"
)
RHUBARB_BIN = Path("/opt/rhubarb/rhubarb")


def _ensure_binary() -> str:
    if RHUBARB_BIN.exists() and os.access(RHUBARB_BIN, os.X_OK):
        return str(RHUBARB_BIN)
    RHUBARB_BIN.parent.mkdir(parents=True, exist_ok=True)
    import zipfile
    tmp = Path("/tmp/rhubarb.zip")
    print(f"downloading rhubarb {RHUBARB_VERSION}...")
    urllib.request.urlretrieve(RHUBARB_URL, str(tmp))
    with zipfile.ZipFile(tmp) as z:
        z.extractall("/opt/")
    # find the binary
    candidates = list(Path("/opt").rglob("rhubarb"))
    if not candidates:
        raise RuntimeError("rhubarb binary not found in archive")
    src = candidates[0]
    if src != RHUBARB_BIN:
        src.rename(RHUBARB_BIN)
    RHUBARB_BIN.chmod(0o755)
    return str(RHUBARB_BIN)


@app.get("/health")
async def health():
    try:
        binary = _ensure_binary()
        return {"status": "ok", "binary": binary, "version": RHUBARB_VERSION}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "error": str(e)[:200]},
        )


@app.post("/align")
async def align(audio: UploadFile = File(...)):
    binary = _ensure_binary()
    suffix = os.path.splitext(audio.filename or ".wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(await audio.read())
        tmp = f.name
    try:
        proc = subprocess.run(
            [binary, "-f", "json", "--quiet", tmp],
            capture_output=True, text=True, timeout=30,
        )
        if proc.returncode != 0:
            raise HTTPException(500, f"Rhubarb failed: {proc.stderr[:300]}")
        import json
        return json.loads(proc.stdout)
    finally:
        os.unlink(tmp)
