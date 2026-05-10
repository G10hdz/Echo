"""ElevenLabs TTS service for Echo"""

import os
import asyncio
from pathlib import Path
from typing import Optional


# ElevenLabs voice IDs — verified via GET /v1/voices
# Rachel: clear American English, ideal for pronunciation coaching
VOICE_MAP = {
    "en": "21m00Tcm4TlvDq8ikWAM",   # Rachel — natural American English
    "es": "AZnzlk1XvdvUeBnXmlld",   # Domi — clear Spanish-accented
}

DEFAULT_MODEL = "eleven_multilingual_v2"


class ElevenLabsService:
    """Generates pronunciation audio using ElevenLabs API"""

    def __init__(self):
        self.api_key = os.environ.get("ELEVENLABS_API_KEY", "")
        self.client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            print("ElevenLabs: no ELEVENLABS_API_KEY set")
            return
        try:
            from elevenlabs.client import ElevenLabs
            self.client = ElevenLabs(api_key=self.api_key)
            print("ElevenLabs TTS service loaded")
        except ImportError as e:
            print(f"ElevenLabs not available (install 'elevenlabs'): {e}")
        except Exception as e:
            print(f"ElevenLabs init error: {e}")

    @property
    def available(self) -> bool:
        return self.client is not None

    async def generate(
        self,
        text: str,
        output_path: str,
        language: str = "en",
        voice_id: Optional[str] = None,
    ) -> str:
        """
        Generate TTS audio and write to output_path (WAV).
        Returns output_path on success.
        """
        if not self.client:
            raise RuntimeError("ElevenLabs client not initialized")

        vid = voice_id or VOICE_MAP.get(language, VOICE_MAP["en"])

        # Run blocking SDK call in thread pool
        audio_bytes = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: b"".join(
                self.client.text_to_speech.convert(
                    voice_id=vid,
                    text=text,
                    model_id=DEFAULT_MODEL,
                    output_format="pcm_16000",   # 16 kHz mono PCM — directly usable
                )
            ),
        )

        # Write raw PCM → WAV with header
        _write_pcm_wav(audio_bytes, output_path, sample_rate=16000)
        return output_path


def _write_pcm_wav(pcm_bytes: bytes, path: str, sample_rate: int = 16000) -> None:
    """Wrap raw 16-bit mono PCM in a minimal WAV header."""
    import struct
    n_channels = 1
    bits = 16
    byte_rate = sample_rate * n_channels * bits // 8
    block_align = n_channels * bits // 8
    data_size = len(pcm_bytes)

    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, n_channels, sample_rate,
                            byte_rate, block_align, bits))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(pcm_bytes)
