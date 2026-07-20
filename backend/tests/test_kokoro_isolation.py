"""Verify per-language pipeline isolation in KokoroService."""

import sys
import types
from unittest.mock import MagicMock, patch


def _setup_fakes(pipeline_lang_codes=None):
    """Install fake modules for espeakng_loader, phonemizer, kokoro."""
    if pipeline_lang_codes is None:
        pipeline_lang_codes = {"a", "e"}

    # espeakng_loader
    esl = MagicMock()
    esl.get_library_path.return_value = "/fake/lib"
    esl.get_data_path.return_value = "/fake/data"
    sys.modules["espeakng_loader"] = esl

    # phonemizer.backend.espeak.wrapper
    pw = types.ModuleType("phonemizer")
    pw.backend = types.ModuleType("phonemizer.backend")
    pw.backend.espeak = types.ModuleType("phonemizer.backend.espeak")
    pw.backend.espeak.wrapper = types.ModuleType("phonemizer.backend.espeak.wrapper")
    pw.backend.espeak.wrapper.EspeakWrapper = MagicMock()
    sys.modules["phonemizer"] = pw
    sys.modules["phonemizer.backend"] = pw.backend
    sys.modules["phonemizer.backend.espeak"] = pw.backend.espeak
    sys.modules["phonemizer.backend.espeak.wrapper"] = pw.backend.espeak.wrapper

    # kokoro
    fake_kokoro = types.ModuleType("kokoro")
    calls = []

    class FakeKPipeline:
        def __init__(self, lang_code=None, repo_id=None):
            calls.append(lang_code)
            if lang_code not in pipeline_lang_codes:
                raise ImportError(f"no pipeline for {lang_code}")

    fake_kokoro.KPipeline = FakeKPipeline
    fake_kokoro._calls = calls
    sys.modules["kokoro"] = fake_kokoro

    return fake_kokoro


def _cleanup():
    for m in ("kokoro", "phonemizer", "phonemizer.backend",
              "phonemizer.backend.espeak", "phonemizer.backend.espeak.wrapper",
              "espeakng_loader"):
        sys.modules.pop(m, None)


def test_failed_lang_does_not_remove_others():
    """zh failure must leave en and es intact."""
    try:
        fake_kokoro = _setup_fakes(pipeline_lang_codes={"a", "e"})
        import importlib
        import kokoro_service as ks_mod
        importlib.reload(ks_mod)

        svc = ks_mod.KokoroService()

        assert "en" in svc.pipelines, f"expected en, got {list(svc.pipelines)}"
        assert "es" in svc.pipelines, f"expected es, got {list(svc.pipelines)}"
        assert "zh" not in svc.pipelines
        assert len(svc.pipelines) == 2
    finally:
        _cleanup()


def test_generate_falls_back_to_any_available_pipeline():
    """Requesting an unknown language should pick first available."""
    try:
        fake_kokoro = _setup_fakes(pipeline_lang_codes={"a"})
        import importlib
        import kokoro_service as ks_mod
        importlib.reload(ks_mod)

        svc = ks_mod.KokoroService()
        pipeline = svc.pipelines.get("nope") or next(iter(svc.pipelines.values()))
        assert pipeline is not None
        assert "en" in svc.pipelines
    finally:
        _cleanup()
