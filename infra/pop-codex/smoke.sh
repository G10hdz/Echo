#!/usr/bin/env bash
# Verify all services respond correctly.
set -euo pipefail
cd "$(dirname "$0")"
source .env

PASS=0
FAIL=0

check() {
  local name="$1" url="$2"
  if curl -fsS "$url" >/dev/null 2>&1; then
    echo "  ✅ $name ($url)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name ($url)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Health checks ==="
check kokoro   "http://127.0.0.1:${KOKORO_PORT:-5315}/health"
check whisper  "http://127.0.0.1:${WHISPER_PORT:-5316}/health"
check scorer   "http://127.0.0.1:${SCORER_PORT:-5317}/health"
check rhubarb  "http://127.0.0.1:${RHUBARB_PORT:-5318}/health"
check piper    "http://127.0.0.1:${PIPER_PORT:-5319}/health"
check edge     "http://127.0.0.1:${EDGE_PROXY_PORT:-5320}/health"

echo ""
echo "=== Functional smoke (TTS / STT / visemes) ==="

# TTS via edge proxy (always works)
if curl -fsS -X POST "http://127.0.0.1:${EDGE_PROXY_PORT:-5320}/tts" \
    -F "text=hello world" -F "language=en" -o /tmp/echo_smoke.mp3; then
  echo "  ✅ edge-tts: $(wc -c </tmp/echo_smoke.mp3) bytes"
  PASS=$((PASS + 1))
else
  echo "  ❌ edge-tts failed"
  FAIL=$((FAIL + 1))
fi

# TTS via piper
if curl -fsS -X POST "http://127.0.0.1:${PIPER_PORT:-5319}/tts" \
    -F "text=hello world" -F "language=en" -o /tmp/echo_smoke_piper.wav; then
  echo "  ✅ piper-tts: $(wc -c </tmp/echo_smoke_piper.wav) bytes"
  PASS=$((PASS + 1))
else
  echo "  ❌ piper-tts failed"
  FAIL=$((FAIL + 1))
fi

# Rhubarb visemes on the piper output
if curl -fsS -X POST "http://127.0.0.1:${RHUBARB_PORT:-5318}/align" \
    -F "audio=@/tmp/echo_smoke_piper.wav" -o /tmp/echo_smoke_visemes.json; then
  cues=$(python3 -c "import json;d=json.load(open('/tmp/echo_smoke_visemes.json'));print(len(d.get('mouthCues',[])))" 2>/dev/null || echo "?")
  echo "  ✅ rhubarb: $cues mouthCues"
  PASS=$((PASS + 1))
else
  echo "  ❌ rhubarb failed"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
exit $FAIL
