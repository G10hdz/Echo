"""Kokoro TTS service for Echo"""

import os
import sys
from pathlib import Path
from typing import Optional


class KokoroService:
    """Generates pronunciation audio using Kokoro TTS"""

    # Voice mapping by language
    VOICES = {
        "en": "af_heart",      # English female
        "es": "ef_dora",       # Spanish female
        "zh": "zf_xiaoxiao"    # Chinese female
    }

    def __init__(self):
        self.pipelines: dict = {}
        self._init_kokoro()

    def _init_kokoro(self):
        """Initialize Kokoro TTS"""
        try:
            # Configure espeak-ng (required for Kokoro)
            import espeakng_loader
            espeakng_loader.make_library_available()

            from phonemizer.backend.espeak.wrapper import EspeakWrapper
            EspeakWrapper._ESPEAK_LIBRARY = str(espeakng_loader.get_library_path())
            EspeakWrapper._ESPEAK_DATA_PATH = str(espeakng_loader.get_data_path())

            os.environ['PHONEMIZER_ESPEAK_LIBRARY'] = str(espeakng_loader.get_library_path())
            os.environ['PHONEMIZER_ESPEAK_DATA_PATH'] = str(espeakng_loader.get_data_path())

            from kokoro import KPipeline

            # Build one pipeline per language. A missing extra (e.g. misaki[zh])
            # must not take down the languages that DID load — English is the
            # primary demo language and has to survive a broken zh install.
            lang_codes = {"en": "a", "es": "e", "zh": "z"}
            self.pipelines = {}
            for lang, code in lang_codes.items():
                try:
                    self.pipelines[lang] = KPipeline(lang_code=code, repo_id='hexgrad/Kokoro-82M')
                except Exception as e:
                    print(f"⚠️  Kokoro {lang} pipeline unavailable: {e}")

            if self.pipelines:
                print(f"✅ Kokoro TTS initialized ({', '.join(self.pipelines)})")
            else:
                print("⚠️  Kokoro TTS: no pipelines available")

        except ImportError as e:
            print(f"⚠️  Kokoro not available: {e}")
            self.pipelines = {}
        except Exception as e:
            print(f"⚠️  Kokoro init error: {e}")
            self.pipelines = {}

    async def generate(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        language: str = "en"
    ) -> str:
        """
        Generate TTS audio for text
        Returns: output_path (wav file)
        """
        if not self.pipelines:
            raise RuntimeError("Kokoro pipelines not available")

        pipeline = self.pipelines.get(language) or next(iter(self.pipelines.values()))
        voice_name = voice or self.VOICES.get(language, "af_heart")

        print(f"🔊 Generating TTS: '{text[:50]}...' (voice={voice_name})")

        # Generate audio
        gen = list(pipeline(text, voice=voice_name))

        if not gen:
            raise RuntimeError("TTS generation produced no output")

        # Get first result (single sentence)
        result = gen[0]

        # Save audio
        import soundfile as sf
        # kokoro >=0.9.4 Result has no .sr; Kokoro-82M output is fixed 24 kHz
        sf.write(output_path, result.audio, getattr(result, "sr", 24000))

        print(f"✅ Audio saved to {output_path}")
        return output_path
