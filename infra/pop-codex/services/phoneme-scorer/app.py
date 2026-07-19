"""Phoneme-level pronunciation scorer.

Compares user audio against canonical IPA from epitran.
Uses wav2vec2 phoneme recognition (Facebook espeak-cv-ft, multilingual).
Returns per-phoneme status + IPA diff so the frontend can show
"you said /ʃ/ instead of /s/".
"""
import os
import io
import tempfile
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import epitran

MODEL_ID = "facebook/wav2vec2-lv-kt-espeak-cv-ft"
SAMPLE_RATE = 16000

app = FastAPI(title="Echo phoneme scorer", version="1.0.0")

_model = None
_processor = None
_epitran: dict[str, epitran.Epitran] = {}


def _load():
    global _model, _processor
    if _model is None:
        cache = os.environ.get("MODEL_CACHE", "/models")
        _processor = Wav2Vec2Processor.from_pretrained(MODEL_ID, cache_dir=cache)
        _model = Wav2Vec2ForCTC.from_pretrained(MODEL_ID, cache_dir=cache)
        _model.eval()
    if not _epitran:
        for code in ("eng-Latn", "spa-Latn", "cmn-Hans"):
            try:
                _epitran[code] = epitran.Epitran(code)
            except Exception as e:
                print(f"epitran {code} failed: {e}")


def _epi_code(language: str) -> str:
    return {"en": "eng-Latn", "es": "spa-Latn", "zh": "cmn-Hans"}.get(language, "eng-Latn")


def _audio_to_tensor(path: str) -> torch.Tensor:
    wav, sr = torchaudio.load(path)
    if wav.shape[0] > 1:
        wav = wav.mean(dim=0, keepdim=True)
    if sr != SAMPLE_RATE:
        wav = torchaudio.functional.resample(wav, sr, SAMPLE_RATE)
    return wav.squeeze(0)


def _recognize_phonemes(wav: torch.Tensor) -> str:
    with torch.no_grad():
        input_values = _processor(wav, sampling_rate=SAMPLE_RATE, return_tensors="pt").input_values
        logits = _model(input_values).logits
        predicted_ids = torch.argmax(logits, dim=-1)
        return _processor.batch_decode(predicted_ids)[0]


def _diff_phonemes(expected: str, actual: str) -> dict:
    """Lightweight IPA diff: position-by-position match. Not Levenshtein-perfect
    but enough to flag the first divergence point for UI highlighting."""
    e = expected.replace(" ", "").strip()
    a = actual.replace(" ", "").strip()
    pairs = []
    for i in range(max(len(e), len(a))):
        if i < len(e) and i < len(a):
            pairs.append({
                "expected": e[i],
                "actual": a[i],
                "match": e[i] == a[i],
            })
        elif i < len(e):
            pairs.append({"expected": e[i], "actual": None, "match": False})
        else:
            pairs.append({"expected": None, "actual": a[i], "match": False})
    matches = sum(1 for p in pairs if p["match"])
    score = int(100 * matches / max(len(pairs), 1))
    flagged = [p for p in pairs if not p["match"]]
    return {"score": score, "pairs": pairs, "flagged": flagged[:10]}


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/score")
async def score(
    audio: UploadFile = File(...),
    expected_text: str = Form(...),
    language: str = Form("en"),
):
    _load()
    if language not in ("en", "es", "zh"):
        raise HTTPException(400, f"Unsupported language: {language}")
    suffix = os.path.splitext(audio.filename or ".wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(await audio.read())
        tmp = f.name
    try:
        wav = _audio_to_tensor(tmp)
        actual_ipa = _recognize_phonemes(wav).strip()
        epi = _epitran.get(_epi_code(language))
        expected_ipa = epi.transliterate(expected_text) if epi else expected_text
        return {
            "language": language,
            "expected_text": expected_text,
            "expected_ipa": expected_ipa,
            "actual_ipa": actual_ipa,
            **_diff_phonemes(expected_ipa, actual_ipa),
        }
    finally:
        os.unlink(tmp)


if __name__ == "__main__":
    import uvicorn
    _load()
    uvicorn.run(app, host="0.0.0.0", port=8000)
