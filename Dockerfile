FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 espeak-ng libespeak-ng1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get autoremove -y && apt-get clean

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV WHISPER_MODEL_SIZE=base
ENV PIP_NO_CACHE_DIR=1

# Install all deps with PyTorch CPU-only index as primary.
# This ensures torch/torchaudio resolve to +cpu wheels
# and kokoro/transformers pull from the same CPU torch.
COPY backend/requirements.txt .
RUN pip install \
    -r requirements.txt \
    --index-url https://download.pytorch.org/whl/cpu \
    --extra-index-url https://pypi.org/simple

# Bake Whisper into the image so Cloud Run cold starts do not download from Hugging Face.
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

COPY backend/ .

RUN mkdir -p /app/audio_cache && chmod 777 /app/audio_cache

EXPOSE 8080

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]