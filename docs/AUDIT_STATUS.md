# Audit 2026-07-18 — Estado de ejecución

**Agente:** zai-coding-plan/glm-5.2 (OpenCode, workhorse tier)
**Plan ejecutado:** docs/AUDIT_2026-07-18.md — ciclos C1..C6
**C7 y C8:** NO ejecutados (revisión flagship / humana, fuera de scope).

---

## Ciclos completados

| Ciclo | Commit | Hash |
|---|---|---|
| C1 — Fix scoring zh + tests | `fix(scoring): mandarin grade TypeError + first regression tests` | `3c93380` |
| C2 — Whisper respeta idioma | `fix(stt): pass practice language to whisper instead of hardcoded en` | `77ee57c` |
| C3 — Cache TTS determinista | `fix(tts): deterministic language-scoped cache filenames` | `6bb29e3` |
| C4 — CI/CD honesto | `fix(ci): propagate image between steps, unmask test failures, mount TTS secret` | `585ef44` |
| C5 — docker-compose + DB path | `fix(dev): docker-compose port mapping and persistent sqlite path` | `5148cf2` |
| C6 — Limpieza drift/dead code | `chore: remove dead code, dedupe configs, fix stale demo URL` | `b6838b6` |

Todos los commits con trailer `Co-Authored-By: zai-coding-plan/glm-5.2`.

---

## Gates corridos

### Backend (python 3 venv local + python-Levenshtein + pytest)
- `python -m py_compile main.py scoring.py whisper_service.py kokoro_service.py elevenlabs_service.py database.py models.py util.py` → OK
- `python -m pytest tests/ -q` → **7 passed** (5 scoring + 2 tts_cache)

### Frontend (Node 20, node_modules preexistentes)
- `npx tsc --noEmit` → sin errores

### CI workflow
- `python -c "import yaml; yaml.safe_load(open('.github/workflows/echo-cd.yml'))"` → YAML_OK

---

## Desviaciones del plan

1. **C3 — Extracción a `backend/util.py`** (opción preferida por el doc). Se creó `util.py` con
   `tts_cache_name(text, language, provider)` y se importó en `main.py` en lugar de definir el
   helper en el propio `main.py`. Razón: el doc habilita explícitamente esta opción para evitar
   que los tests importen `main.py` (que cargaría whisper/torch).
   Se añadió un parámetro `provider` explícito (default `"kk"`) y un test extra
   `test_cache_name_provider_scoped` además del requerido por el doc.

2. **C5 — `database.py`**: el módulo sigue leyendo la variable solo al importar
   (`DATABASE_PATH = Path(os.environ.get("ECHO_DB_PATH", "echo.db"))`). El default arg
   `db_path: Path = DATABASE_PATH` del `__init__` se evaluaba en el momento de la definición
   de la clase en el plan original, así que esto no cambia comportamiento; mantiene
   compatibilidad con `DatabaseManager(db_path=...)`.

3. **C6 — `.netlify/netlify.toml`**: `git rm --cached` ya echo; el archivo sigue en el
   working tree porque `.netlify/` está en `.gitignore` (no se volvió a trackear).

4. Sin uso de `deploy.sh`, `cloudbuild.yaml`, sin tocar `.env`, sin nuevas dependencias
   runtime (solo `pytest` dev, `python-Levenshtein` y `pyyaml` en venv local para gates).

---

## Pendiente (fuera de scope C1..C6)

- **C7** (upload limit): revisión flagship obligatoria — no ejecutado.
- **C8** (demo readiness, gcloud, Netlify, streaks): humano + flagship — no ejecutado.
- **F7** (SQLite efímero en Cloud Run): aceptado para demo; documentado en audit.
- **F9** (streaks fake): decisión de producto pendiente en C8.
