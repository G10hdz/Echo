# Echo Handoff

**Owner:** Engineering
**Last updated:** 2026-08-13
**Review cadence:** After every production deploy

## Current production state

- Frontend: Netlify. Confirm `VITE_API_ORIGIN` points to the `echo-api` service URL before releasing frontend changes.
- Active backend: Cloud Run service `echo-api`, revision `echo-api-00010-gvg`, receiving 100% of traffic.
- Legacy backend: `echo-backend` remains deployed but is not the target service. Do not change traffic or frontend configuration to it without an explicit migration.
- Runtime: 8 GiB memory, 4 CPU, `min-instances=0`.
- Secrets: `ELEVENLABS_API_KEY` now comes from Secret Manager secret `echo-elevenlabs-key`. The previous plaintext Cloud Run environment variable was removed.
- STT: Whisper `base` is baked into the container image. It no longer downloads from Hugging Face during a Cloud Run cold start.

## Recent change

Commit `0704f43` adds the Whisper model during image build. Its image is deployed as `whisper-baked-20260812` to `echo-api`.

Verify after any deploy:

```bash
gcloud run services describe echo-api --project=positronica-labs --region=us-central1 --format='value(status.latestReadyRevisionName,status.url)'
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="echo-api"' --project=positronica-labs --limit=30 --freshness=15m --format='value(textPayload)' | rg 'Whisper model loaded|Whisper not available'
```

Expected: a ready revision and `Whisper model loaded on cpu`. Do not treat HTTP `/health` alone as proof that transcription works.

## TTS decision

ElevenLabs is not the right default for a beginner product: it adds variable external API cost to a public endpoint. The app has a local Kokoro fallback, but it currently fails at startup and raises the Cloud Run memory and cold-start cost because it loads three language pipelines.

Move the default TTS provider to Google Cloud Text-to-Speech Standard voices:

1. Enable `texttospeech.googleapis.com` in `positronica-labs`.
2. Use the Cloud Run service account with `roles/texttospeech.user`.
3. Add a small provider for English, Spanish, and Mandarin Standard voices.
4. Cache generated audio as the current `/audio` route does.
5. Keep ElevenLabs only behind an explicit premium setting, then rotate its key in ElevenLabs and add the new version to `echo-elevenlabs-key` before deleting the old key.

Google TTS Standard has a 4 million-character monthly free tier and then costs $4 per million characters. It supports the product languages. See the official [pricing](https://cloud.google.com/text-to-speech/pricing) and [voice list](https://cloud.google.com/text-to-speech/docs/voices).

## Known production risks

- The API is public and unthrottled. `/api/practice/analyze`, `/api/transcribe`, and `/api/tts` can be abused for CPU or provider spend.
- SQLite and generated audio are on Cloud Run's ephemeral filesystem. Sessions, progress, and cache disappear when an instance is recycled.
- `min-instances=0` means cold starts remain possible. Whisper is available, but startup is still heavy.
- Kokoro logs a startup failure. It is not a dependable fallback until fixed or removed.
- Frontend/backend deployment is manual coordination. Confirm CORS and `VITE_API_ORIGIN` after any endpoint change.

## Next operator checklist

1. Open a PR for `fix/preload-whisper-model` and obtain a second-person review before merge.
2. Confirm Netlify points at `echo-api` and test `/api/transcribe` with a short recording.
3. Implement Google Cloud TTS, deploy it, and test English, Spanish, and Mandarin reference audio.
4. Rotate the ElevenLabs key and remove the provider unless premium TTS is intentionally retained.
5. Add authentication or rate limiting before promoting the public demo.
6. Replace Cloud Run SQLite with managed persistent storage before relying on progress data.

## Rollback

To roll back the Whisper-baked revision:

```bash
gcloud run services update-traffic echo-api --project=positronica-labs --region=us-central1 --to-revisions=echo-api-00009-nsh=100
```

Then inspect Cloud Run logs and restore traffic to the latest ready revision only after the cause is understood.
