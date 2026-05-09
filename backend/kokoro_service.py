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
        self.pipeline = None
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

            # Load default pipeline (English)
            self.pipeline_en = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
            self.pipeline_es = KPipeline(lang_code='e', repo_id='hexgrad/Kokoro-82M')
            self.pipeline_zh = KPipeline(lang_code='z', repo_id='hexgrad/Kokoro-82M')

            self.pipelines = {
                "en": self.pipeline_en,
                "es": self.pipeline_es,
                "zh": self.pipeline_zh
            }

            print("✅ Kokoro TTS initialized")

        except ImportError as e:
            print(f"⚠️  Kokoro not available: {e}")
            self.pipeline = None
            self.pipelines = {}
        except Exception as e:
            print(f"⚠️  Kokoro init error: {e}")
            self.pipeline = None
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

        pipeline = self.pipelines.get(language, self.pipelines["en"])
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
        sf.write(output_path, result.audio, result.sr)

        print(f"✅ Audio saved to {output_path}")
        return output_path

    async def generate_words(
        self,
        words: list,
        output_dir: str,
        language: str = "en"
    ) -> list:
        """Generate TTS audio for multiple words (for practice)"""
        audio_files = []

        for word in words:
            output_path = os.path.join(output_dir, f"{word}.wav")
            await self.generate(
                text=word,
                output_path=output_path,
                language=language
            )
            audio_files.append(output_path)

        return audio_files
