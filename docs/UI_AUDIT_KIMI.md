# Auditoría UI/UX del front — Echo

**Fecha:** 2026-07-19
**Alcance:** `frontend/` completo (React 19 + TypeScript + Vite + Tailwind, ~6.700 líneas en `src/`)
**Profundidad:** funcional + visual, más radar competitivo y propuesta de rediseño
**Método:** análisis estático del 100% del código fuente, verificación de claims clave, `npx tsc --noEmit` (limpio, sin errores). No hubo click-through en runtime: los hallazgos de comportamiento se derivan del código, no de una sesión en el navegador.
**Relación con auditorías previas:** `docs/AUDIT_2026-07-18.md` cubrió backend/CI/DevOps (ciclos C1–C6). Este documento cubre solo el front. No se solapan.

---

## 1. Resumen ejecutivo

Echo tiene **dos problemas de fondo, no uno de superficie**:

1. **Funcional:** la app finge más de lo que entrega. El flujo principal EN/ES sí funciona contra el backend real (grabar → analizar → score), pero los ajustes que el usuario configura (idioma, nivel, voz) **no llegan a ninguna parte**, el scoring de tonos de mandarín **no mide pronunciación** (compara un diccionario contra sí mismo), y cada grabación **fuga recursos del navegador** (`AudioContext`, streams de mic, intervalos) hasta que la captura se rompe.
2. **Visual:** el front vive **a medio camino entre dos design systems**. `index.css` implementa Clinical Sublime con fidelidad (tokens light/dark completos, dot-grid, glass, glows lavanda, cero hex en los `.tsx`), pero `tailwind.config.ts` sigue siendo el sistema anterior (slate/terracota/DM Serif) y envenena radios, fuentes y deja restos terracota hardcodeados. Tres bugs estructurales rompen cosas visibles: un token inexistente (`--warm-gold`), un menú móvil con ancho 0 y un toggle de tema claro que no puede ganar al OS oscuro.

**Conteo de hallazgos:**

| | Crítico | Alto | Medio | Bajo |
|---|---|---|---|---|
| Funcional | 4 | 6 | 6 | 4 |
| Visual | 5 | 7 | 10 | 6 |

**Veredicto en una frase:** la base de tokens es sólida y pulcra, pero hay que arreglar los 4 críticos funcionales y los 3 estructurales visuales **antes** de cualquier retoque cosmético — y decidir de una vez si mandarín y `WaveComparison` son producto o son deuda.

---

## 2. Cómo funciona hoy (mapa funcional)

Lo que el código hace de verdad, no lo que dice el README:

- **Onboarding** (`/onboarding`): gate forzado vía `localStorage.echo_onboarded` (`App.tsx:97-107`). 3 pasos (idioma, nivel, voz) que se guardan en `echo_onboarding`… **y nadie lee jamás**.
- **Home** (`/`): stats y sesiones recientes desde `GET /api/progress/web-user-001` (backend real en Cloud Run). Selector de idioma donde **solo `zh` cambia el destino** (`/practice/zh`); elegir ES navega a `/practice` con `language='en'` fijo.
- **Practice** (`/practice`): pide UNA frase a `GET /api/sentences?level=A1&language=en` (nivel e idioma **hardcodeados**), graba con `MediaRecorder`, sube a `POST /api/practice/analyze`. El score **sí viene del backend** (no hay números aleatorios en el flujo principal). Al recibirlo, navega a `/results`.
- **Practice ZH** (`/practice/zh`): extrae pitch en el navegador con YIN (`usePitchExtraction.ts`, 349 líneas), pero ese pitch **solo dibuja el gráfico** — no puntúa (ver F1).
- **Progress** (`/progress`): historial + gráfica Recharts desde el backend. Botón "Retry" sin handler.
- **Settings** (`/settings`): guarda en `echo_settings` con validación (bien), pero **solo SettingsPage lee esos settings**.
- **Results** (`/results`): pantalla post-sesión. Convive con un bloque de resultados inline en Practice que es **código muerto** (ver F7).

Desincronización de documentación detectada: el README dice React 18 (es React 19, `package.json:15`) y marca Home/Onboarding/Results como "🎨 Designed — pending impl" cuando **ya están implementadas y enrutadas**.

---

## 3. Qué falla — auditoría funcional

### Críticos

**F1 · El scoring de tonos de mandarín nunca usa el pitch que extrae**
`pages/MandarinPracticePage.tsx:112` llama `scoreTones(text, transcription, contour)` con 3 argumentos, pero la rama "pitch" de `lib/mandarin/toneScoring.ts:123` exige un 4º parámetro `syllableBoundaries` que **nadie calcula ni pasa en todo el codebase**. La condición es siempre falsa → `method` es siempre `'pinyin-fallback'`. Las 349 líneas del pipeline YIN solo sirven para pintar el contorno.
*Fix:* calcular límites de sílaba desde el contour (o eliminar la rama pitch y dejar de prometer tono real).

**F2 · El fallback de tonos compara el diccionario contra sí mismo**
`lib/mandarin/toneScoring.ts:53-109`: convierte a pinyin la frase esperada y la transcripción usando **el mismo diccionario local** (`pinyinParser.ts:73-104`). Si la transcripción coincide con el texto, todos los tonos dan 100% aunque el usuario los haya dicho al revés. El scoring de tonos mide si Whisper transcribió bien los caracteres, **no la pronunciación tonal**. Es la promesa central del modo mandarín y hoy es teatro.
*Fix:* decisión de producto — o scoring tonal real (pitch por sílaba + boundaries), o etiquetar honestamente el modo como "transcripción + contorno visual".

**F3 · Cada grabación mandarín deja un `setInterval` vivo para siempre**
`lib/mandarin/usePitchExtraction.ts:257` crea un intervalo de 200 ms cuyo `clearInterval` solo existe en el cleanup devuelto por `startExtraction`. `MandarinPracticePage.tsx:82-84` llama `stopExtraction()` (que NO limpia el intervalo) y pone el cleanup a `null` **sin invocarlo**. Cada grabación añade un intervalo eterno copiando arrays cada 200 ms.
*Fix:* invocar el cleanup guardado en `stopExtractionRef.current` antes de anularlo.

**F4 · `AudioContext` sin cerrar en cada grabación**
`hooks/useMicrophone.ts:87` crea `new AudioContext()` en una variable local que no se guarda en ningún ref → imposible de cerrar. Chrome limita los contextos concurrentes (~6): tras varias grabaciones, la captura deja de funcionar. Además no hay cleanup al desmontar: si el usuario navega con la sidebar mientras graba, `MediaRecorder`, stream de mic y el intervalo del timer (`:114`) siguen vivos.
*Fix:* guardar el contexto en ref, cerrarlo en `stopRecording`/`resetRecording` y en un `useEffect` de desmontaje.

### Altos

**F5 · Doble `getUserMedia` y stream de mic que nunca se libera (ZH)**
`MandarinPracticePage.tsx:75` pide un stream y `useMicrophone.ts:79` pide **otro**: dos capturas simultáneas. `stopExtraction` (`usePitchExtraction.ts:275-281`) desconecta nodos pero nunca llama `track.stop()` → el indicador de mic del navegador queda encendido al terminar.

**F6 · Permiso de micrófono denegado = fallo silencioso**
`components/MicRecorder.tsx:174-177`: `onClick` sin `await` ni `.catch()`; `useMicrophone.ts:120-123` hace `console.error` y re-lanza → *unhandled promise rejection* y el botón simplemente "no funciona", sin mensaje. No existe UI para permiso denegado. En un producto cuyo core es el micrófono, este es el error más caro de conversión.

**F7 · El bloque de resultados de Practice es inalcanzable**
`pages/PracticePage.tsx:71-79`: al llegar `result.score` se navega a `/results` y se hace `return` — `setScore` jamás recibe un valor. Todo el bloque de resultados inline (`:256-286`: `ScoreDisplay`, retry, reset) es código muerto. En `MandarinPracticePage.tsx:102-133` pasa al revés: `setScore` sí se llama pero se navega inmediatamente a `/results`, así que `ScoreDisplay` + `ToneVisualization` solo se ven cuando el backend **no** devuelve score. Los dos flujos son mutuamente excluyentes por accidente.
*Fix:* elegir un único lugar para los resultados (recomendado: inline en Practice, ver §6) y borrar el otro.

**F8 · Settings se guardan pero no se aplican a nada**
`PracticePage.tsx:33-35` y `MandarinPracticePage.tsx:47-49` hardcodean `userId='web-user-001'`, `level='A1'`, `language='en'/'zh'`. Nadie llama `loadSettings()` fuera de `SettingsPage.tsx:130`. El idioma, nivel y voz elegidos no afectan a frases, análisis ni TTS; el `voiceId` no viaja en ninguna petición.

**F9 · El selector de idioma de Home engaña al usuario**
`pages/HomePage.tsx:16,96`: elegir "ES" + START SESSION navega a `/practice`, donde `language='en'` está fijo → practicas inglés. El estado tampoco persiste al volver.

**F10 · MIME type falso en el audio**
`useMicrophone.ts:101` construye el blob como `audio/wav` pero `MediaRecorder` produce WebM/Opus; `api.ts:248` lo sube como `recording.webm` y `transcribeAudio` (`api.ts:85`) como `recording.wav`. El backend recibe contenido WebM con metadatos WAV — decodificación a merced de la tolerancia del servidor.

### Medios

**F11 · Onboarding guarda datos que nadie lee y ofrece idiomas no soportados**
`OnboardingPage.tsx:49` escribe `echo_onboarding`; ningún archivo lo lee. Ofrece fr/de/it/pt/ja (`:9-13`) cuando `SUPPORTED_LANGUAGES` (`types/index.ts:84`) solo admite en/es/zh/fr, y sus voces 'female/male' no coinciden con las de Settings (alloy/echo/fable…). Desincronización garantizada.

**F12 · Botones y elementos muertos**
- `ProgressPage.tsx:302-308`: "Retry" por sesión sin `onClick`.
- `HomePage.tsx:172-199`: tarjetas de sesiones con `cursor-pointer` + chevron pero sin handler (parecen clicables, no lo son).
- `Sidebar.tsx:11` + `App.tsx:225`: `<Sidebar />` sin props → `userName='User'`, `streakDays=0` → el bloque de racha (`:53-68`) nunca se muestra; "Free Plan" es texto fijo.
- `SentenceCard.tsx:93`: "Listen to Correct Pronunciation" solo aparece cuando ya hay `ttsUrl`, que llega **después** de analizar → no puedes oír el modelo antes de grabar, que es cuando sirve. `generateTTS` no se invoca en ningún flujo.
- `vite.config.ts:9-17`: proxy a `localhost:8000` muerto — `api.ts:15` usa origen absoluto (Cloud Run) salvo `VITE_API_ORIGIN`; en dev las llamadas van a producción.

**F13 · `WaveComparison` es un componente muerto de 618 líneas**
No se importa en ningún archivo (verificado por grep). Dentro: `generateDemoWaveform` (`:59-72`) inventa ondas con `Math.random()`, `playBoth` (`:179`) tiene la condición duplicada `targetAudioUrl && targetAudioUrl`, y `URL.createObjectURL` en render (`:611`) sin revoke. Es —paradójicamente— el diferenciador del producto según el radar (§5), y está desconectado.

**F14 · Dependencias y API declaradas sin uso**
`@tanstack/react-query` configurado en `App.tsx:16-23` sin un solo `useQuery`/`useMutation`. En `api.ts`, `transcribeAudio`, `scorePronunciation`, `generateTTS`, `startPracticeSession` y `completePracticeSession` no tienen llamadores (con sus tipos asociados). `lib/mandarin/pinyinData.ts` entero sin importar.

**F15 · Estados vacíos sin manejar**
Si el backend devuelve 0 frases (`PracticePage.tsx:44-46`, `MandarinPracticePage.tsx:60-62`): pantalla con área de grabación activa, sin frase y sin mensaje. No hay ruta `*` en `App.tsx` → cualquier URL rara renderiza el layout con el main vacío.

**F16 · Race condition al pedir nueva frase durante el análisis**
`loadSentence` no cancela el `analyzePronunciation` en vuelo: si el usuario pide otra frase mientras se analiza, cuando resuelve navega a `/results` con el score viejo. No hay `AbortController` en `fetchWithRetry` (`api.ts:38-81`; el chequeo de `AbortError` de `:68` es código muerto).

### Bajos

- **F17** · `HomePage.tsx:179`: la bandera de cada sesión reciente usa el idioma del selector actual, no el de la sesión (el tipo ni siquiera lo incluye).
- **F18** · `MicRecorder.tsx:67-68`: deps de `useEffect` suprimidas con eslint-disable; `setBarHeights` cada frame re-renderiza 48 `motion.rect` a 60 fps. Keys por índice en `HomePage.tsx:173` y `ProgressPage.tsx:278`. `icon: any` en `ProgressChart.tsx:32`. `duration` del pitch contour mal calculada (`usePitchExtraction.ts:297` → ~0.0002 s). `ScriptProcessorNode` deprecado (`:237`). Breakpoint inline de 769px en `Sidebar.tsx:165` vs `md:` = 768px.
- **F19** · Persistencia: 4 claves (`echo_onboarded`, `echo_onboarding`, `echo_dark_mode`, `echo_settings`). `loadSettings` valida bien (JSON corrupto no rompe). Riesgos: `echo_onboarding` nunca se fusiona con `echo_settings`; `OnboardingGate` lee localStorage sin reactividad; settings se guardan en cada cambio → el botón "Save Settings" es redundante.
- **F20** · Copy inconsistente: Settings dice "requires ElevenLabs API key" pero las voces listadas (alloy, echo, fable, onyx, nova, shimmer) son nombres de OpenAI TTS; el front nunca gestiona ninguna key — si falta, `tts_url` llega null y el botón de escuchar desaparece sin explicación.

---

## 4. Qué está feo — auditoría visual (Clinical Sublime)

Contexto: `index.css` define el sistema con bastante fidelidad (tokens light/dark completos, dot-grid lavanda, `.card` glass con `blur(8px)`, glows lavanda `--shadow-*`, scrollbar 6px, skip-nav, reduced-motion). **Cero hex hardcodeados en los `.tsx`** — la disciplina de tokens existe. Lo que falla:

### Críticos (rompen funcionalidad visible)

**V1 · Token inexistente `--warm-gold`**
Usado en `ScoreDisplay.tsx:63` y `ToneVisualization.tsx:49`; no está definido en ningún archivo (verificado). El anillo de score para 50–69 pts queda con `stroke` inválido (SVG cae a negro → invisible en dark) y "Weak" hereda color. **Los scores medios se renderizan rotos.**

**V2 · Menú móvil con ancho 0**
`index.css:630-636` fija `--sidebar-width: 0px` en ≤768px y `Sidebar.tsx:152` usa esa misma var como `width` del `aside` → el drawer móvil se abre con 0px. Además, mismatch de breakpoint: Tailwind `md:` = 768px pero el `<style>` inline usa `@media (min-width: 769px)` (`Sidebar.tsx:165`): a exactamente 768px el sidebar está oculto mientras `main` ya tiene margen.

**V3 · El toggle "Light" no puede ganar al OS dark**
Los tokens oscuros se aplican vía `@media (prefers-color-scheme: dark)` sobre `:root` (`index.css:131-205`); `ThemeContext.tsx:24` pone `data-theme="light"` pero **no existe ningún bloque `[data-theme="light"]`** que revierta esos tokens. Un usuario con macOS oscuro ve siempre el tema oscuro aunque pulse "Light". El botón de Settings miente.
*Fix:* envolver los tokens claros en `:root:not([data-theme="dark"])` y los oscuros solo en `[data-theme="dark"]` + media query sin `data-theme` explícito.

**V4 · Botones gradiente con `color: 'white'` fijo — ilegibles en dark**
`HomePage.tsx:97-102` (START SESSION), `ResultsPage.tsx:204-209` (PRACTICE AGAIN), `OnboardingPage.tsx:221-227` (CONTINUE). En dark, `--primary` pasa a `#C4B5E3` y `--accent` a `#E8A5C8` (claros): texto blanco ≈ **1.9:1**. El `.btn-primary` del CSS sí usa `var(--on-primary)`; estos tres hechos a mano, no.

**V5 · Glows terracota de un design system muerto**
`rgba(196, 93, 62, …)` (= `#C45D3E`, terracota del sistema anterior) hardcodeado en `PracticePage.tsx:232-234`, `MandarinPracticePage.tsx:286-288`, `MicRecorder.tsx:187-195` (verificado). El `--accent` actual es rosa `#A85880`: botón rosa con halo naranja, visiblemente desafinado, e ignora el dark mode.

### Altos

- **V6 · `tailwind.config.ts` pertenece a otro design system.** Primary `#2d3142` "Deep Slate", accent `#c45d3e` "Terracotta", fuentes `DM Serif Display`/`Be Vietnam Pro` (**no cargadas** en `index.html`), escala de radios `md: 0.75rem / xl: 1.5rem` que colisiona con `--radius-md: 0.375rem`. Las clases `rounded-lg/xl` resuelven a la escala vieja.
- **V7 · Esquinas redondeadas contra el spec "casi rectas".** `rounded-xl` (= **24px** con la config vieja) en CTAs y paneles (7 archivos); `rounded-full` masivo en pills/badges. Estética "pill friendly" en un sistema "lab-grade sharp".
- **V8 · Iconos blancos fijos sobre tokens que se aclaran en dark.** `MicRecorder.tsx:220,256` (`fill="white"`): en dark, `--accent` = `#E8A5C8` → ≈1.9:1, invisible. Las clases `.badge-*` (`index.css:510-525`) repiten la trampa (hoy sin uso).
- **V9 · SettingsPage con colores crudos slate + sombra gris** (`:264-268`: `bg-slate-700 text-white` / `bg-slate-100`, `hover:shadow-md`). Rompe tokens y la regla "sin box-shadows grises".
- **V10 · Sombras grises/negras fuera de tokens** en `MicRecorder.tsx:187-190` y `ScoreDisplay.tsx:179`, existiendo `--shadow-sm/md/lg` lavanda.
- **V11 · Focus visible por debajo de WCAG:** `:focus-visible` global = `2px solid #C4B5E3` sobre blanco ≈ **1.9:1** (mínimo 3:1 para indicadores).
- **V12** · (= F17) Bandera incorrecta en sesiones recientes.

### Medios

- **V13 · Lavanda `#C4B5E3` como texto pequeño (≈1.9:1 sobre blanco):** pinyin de tono 1 a 11px (`PinyinOverlay.tsx:64-66` + `toneColors.ts:9`), labels en `ToneVisualization.tsx:306-326`, prefijo de `.terminal-label`. Tono 3 `#D4AF37` ≈ 2.1:1. Los 5 colores de tono son hex fijos que **no cambian con el tema**.
- **V14 · Acento rosa como texto pequeño al límite:** nav activo `#A85880` sobre `#E8E0F5` ≈ 3.7:1 en `text-sm` (falla AA 4.5) — `Sidebar.tsx:83-84`, `ProgressPage.tsx:302-307`.
- **V15 · Utilidades del design system muertas o reimplementadas:** `.terminal-label`, `.badge-*`, `.status-particle`, `.gradient-divider`, `.surface-*` no se usan en ningún `.tsx`; las páginas rehacen el terminal-label a mano con `font-mono` (3 archivos). El glass de `.card` se duplica inline en `HomePage.tsx:126-130` y `ResultsPage.tsx:113-117`.
- **V16 · `border-outline-variant` no existe como clase Tailwind** (`SettingsPage.tsx:58`) → el separador cae a currentColor: línea sólida al color del texto, violación directa de la No-Line rule.
- **V17** · (= F13) `WaveComparison.tsx` muerto; su docblock aún describe "terracotta tint / deep slate".
- **V18 · Tipografía: fuentes fantasma y jerarquía rota.** `--font-mono` apunta a JetBrains Mono **no cargada** → cae a monospace genérico. Home no tiene `<h1>` (el hero es un `<p>` Orbitron). `SentenceCard.tsx:81-88` pone la frase objetivo en Orbitron, que **no tiene glifos CJK** → en mandarín cae a fallback (también `PinyinOverlay.tsx:77`).
- **V19 · Anchos y grids inconsistentes:** `max-w-2xl` (4 páginas) vs `max-w-4xl` (Settings) vs `max-w-7xl` (Progress, que además supera `--content-max` 1200px y el wrapper lo recorta). `grid-cols-3` sin prefijo en `HomePage.tsx:113` y `ResultsPage.tsx:100` → 3 columnas aplastadas en 360px.
- **V20 · Touch targets <44px:** hamburguesa ~36px, pills de idioma ~36px, Back/Continue ~36px, chips ~28px. El propio token `--touch-target-small: 36px` (`index.css:127`) institucionaliza el incumplimiento de WCAG 2.5.5.
- **V21 · Estados vacíos/carga inconsistentes:** skeletons bien en Practice/Progress; Home usa `'—'`; empty state rico en Practice vs texto plano en `ProgressChart.tsx:149-153`. `ProgressPage` duplica el bloque de header 4 veces (`:34-144`) — ya divergirá.
- **V22 · `prefers-reduced-motion` a medias:** el CSS global y los chequeos JS de MicRecorder/ScoreDisplay/ToneVisualization están bien, pero las transiciones de página de framer-motion (`App.tsx:84-94`) y los `whileHover` las ignoran.

### Bajos

- **V23** · Track del anillo de resultados casi invisible (`ResultsPage.tsx:65`, `rgba(196,181,227,0.15)`).
- **V24** · Dot-grid dark duplicado y contradictorio (`index.css:309-313` 0.08 vs `:639-643` 0.07).
- **V25** · Print CSS oculta **todos** los `button` (`index.css:680-686`), incluidos los de contenido.
- **V26** · Favicon por defecto de Vite (`index.html:5`).
- **V27** · Idiomas de Onboarding ≠ Home (= F11).
- **V28** · Emojis-bandera sin `role="img"`/`aria-label` (`HomePage.tsx:179`, `OnboardingPage.tsx:126`).

### Lo que ya está bien (no tocar)

Tokens completos light/dark; cero hex en `.tsx`; dot-grid + glass + glows lavanda implementados; scrollbar spec; skip-nav; aria-labels amplios en botones de icono; `aria-pressed`/`aria-current` correctos; skeletons en las páginas de datos; validación defensiva de `echo_settings`; `tsc --noEmit` limpio.

---

## 5. Radar competitivo

Cuatro referencias elegidas tras ver el front: el líder de scoring por fonema (**ELSA**), el premium de acento (**BoldVoice**), el híbrido humano+IA multi-idioma (**Speechling**) y la referencia de waveform+fonemas (**Say It**, Oxford).

### ELSA Speak — el líder de scoring
Coaching de pronunciación inglesa con ASR propio entrenado en habla no nativa. Evaluación inicial → plan personalizado por fonemas débiles → drills diarios con palabras coloreadas verde/amarillo/rojo y desglose por fonema; reviews reportan **waveforms lado a lado** para comparar con el nativo ([pronounce.tv](https://pronounce.tv/blog/best-pronunciation-apps-2024)). Scoring 0–100% + pronunciación/fluidez/entonación, tracking por los 44 sonidos del inglés. Diseño gamificado y denso ("can feel clinical"). Freemium agresivo: ~$60–160/año según fuente/región, $299 lifetime. Desde 2024–25, tutor conversacional con LLM. **Solo inglés** (UK en Premium).
- **Copiar:** la evaluación inicial que genera un "mapa de fonemas problemáticos" — convierte feedback en plan, no en nota.
- **Echo ya gana en:** bilingüe EN/ES desde el día 1, waveform como protagonista limpio (no feature enterrada), gratis.

### BoldVoice — el premium cinematográfico
Acento para profesionales (5M+ usuarios, 4.8★, ronda de $21M en dic-2025 según [fundz](https://app.fundz.net/fundings/wellocution-inc-funding-round-8d843b)). Bucle: video-lección de coach de acento de Hollywood → drills → scoring IA por fonema, con foco en ritmo/estrés/entonación. Features virales: Accent Oracle y Accent Filter. Diseño limpio y premium; el storytelling "coaches de Hollywood" es su activo fuerte. ~$120–150/año, **solo acento americano**, sin comparación visual de onda.
- **Copiar:** personalizar drills según la L1 del usuario (errores típicos ES→EN, EN→ES) — barato de implementar, se percibe como magia.
- **Echo ya gana en:** waveform superpuesto (BoldVoice da score + texto), gratis vs. ~$150/año.

### Speechling — el híbrido humano + IA
Coaching en **13 idiomas** (EN US/UK, ES castellano y latam, ZH, FR, DE…) con feedback de coach humano en ~24 h, SRS y Audio Journal coloreado por estado (verde/amarillo/marrón/azul). Scoring cualitativo, sin desglose por fonema ni visualización acústica. Diseño consistentemente descrito como anticuado y con curva de aprendizaje ([reviews](https://multilingualmastery.com/speechling-review/)). Freemium generoso: gratis con 10 correcciones/mes; $19.99/mes ilimitado.
- **Copiar:** el Audio Journal con código de color valida el historial+rachas de Echo; añadir el estado "regrabado tras corrección".
- **Echo ya gana en:** feedback instantáneo (vs. 24 h), desglose por fonema, visualización, diseño — su punto débil más citado.

### Say It (Oxford University Press) — la referencia waveform
Diccionario de pronunciación: 70.000+ palabras UK/US, IPA, **soundwave del modelo + overlay de tu grabación** ("Hear the Oxford model, see the soundwave, then record and compare" — [OUP](https://elt.oup.com/catalogue/items/global/pronunciation/9780194270014)), chart IPA interactivo, tests por nivel. Estética de diccionario digital; las visuales "abruma[n] a principiantes". $13.49/mes o $105.99/año. Solo palabras aisladas, sin frases ni conversación.
- **Copiar:** el waveform como *kicker* de marketing ("see your accent"); un chart IPA interactivo es contenido-moat barato.
- **Echo ya gana en:** frases completas, desglose correcto/parcial/fallido, rachas e historial — loop de hábito, no diccionario.

### Panorama 2025–2026
El nicho "AI pronunciation scoring" se estima en ~$412M (2024) → ~$1.730M (2033), CAGR ~17% ([researchintelo](https://researchintelo.com/report/ai-pronunciation-scoring-market) — fiabilidad media, úsese como orden de magnitud). Tendencias: (1) feedback a nivel de fonema = estándar mínimo; (2) LLMs para práctica conversacional "unscripted" (ELSA ya lo tiene); (3) commoditización del assessment vía APIs (Azure Pronunciation Assessment, SpeechAce, ELSA API) — un indie puede **comprar el motor** en vez de construirlo; (4) capital entrando (BoldVoice, $21M); (5) **el hueco abierto: nadie combina multi-idioma + visualización acústica + minimalismo premium + gratis**, y el mandarín con tonos/pinyin sigue mal servido por los cuatro.

### Tabla comparativa

| | Feedback | Scoring | Idiomas | Precio | Diseño | Diferenciador |
|---|---|---|---|---|---|---|
| **ELSA Speak** | Fonemas coloreados, waveforms, tutor LLM | 0–100% + fluidez/entonación, 44 sonidos | Solo EN (UK en Premium) | Freemium; ~$60–160/año | Gamificado, denso, "clínico" | ASR propio entrenado en habla no nativa |
| **BoldVoice** | IA por fonema + videos Hollywood | Por fonema + dashboard, ritmo/estrés | Solo EN americano | Trial 7 días; ~$120–150/año | Limpio, cinematográfico | Coaches Hollywood + Accent Oracle/Filter |
| **Speechling** | Coach humano ~24 h + IA básica | Cualitativo; journal coloreado | 13 (EN, ES×2, ZH…) | Gratis (10 corr./mes); $19.99/mes | Anticuado, curva de aprendizaje | Humano barato + multi-idioma real |
| **Say It (OUP)** | Soundwave + overlay, chart IPA | Rating por palabra/sonido | EN UK + US | Trial (100 palabras); $105.99/año | Sobrio, "diccionario", denso | 70.000+ palabras Oxford + onda |
| **Echo** | Waveforms superpuestas + fonema | Correcto/parcial/fallido + rachas | EN + ES; ZH planeada | Gratis | Clinical Sublime (lavanda, glass, Orbitron) | Único: waveform protagonista + bilingüe + gratis |

**Lectura estratégica:** el diferenciador de Echo (comparación visual de onda + bilingüe + gratis + diseño) es real y nadie lo ocupa. Pero hoy ese diferenciador está **desconectado del producto**: `WaveComparison` son 618 líneas muertas (F13) y el scoring de tonos es teatro (F1/F2). El radar dice que el rediseño debe ir en dirección contraria: **hacer el waveform el protagonista**.

---

## 6. Propuesta de rediseño (alto nivel)

Orden de ataque: primero lo que rompe, luego lo que engaña, luego lo que diferencia. Nada de esto requiere cambiar el stack.

### P0 — Convergencia y fugas (1–2 días, todo localizable)
1. **Matar el design system viejo:** reescribir `tailwind.config.ts` para que mapee los tokens CSS de Clinical Sublime (radios sharp, fuentes Orbitron/Inter, colores `var(--*)`), y eliminar los `rgba(196, 93, 62, …)` terracota (V5) sustituyéndolos por glows lavanda/rosa del sistema.
2. **Arreglar los 3 estructurales visuales:** definir `--warm-gold` o mapear a `--tertiary` (V1); sidebar móvil con ancho propio en vez de `--sidebar-width: 0px` + unificar breakpoint 768/769 (V2); reestructurar tokens dark para que `[data-theme="light"]` pueda ganar al OS (V3).
3. **Tapar las fugas:** `AudioContext` en ref + cleanup al desmontar (F4); invocar el cleanup del intervalo de pitch (F3); un solo `getUserMedia` en ZH + `track.stop()` (F5).
4. **UI de permiso de micrófono denegado** con instrucciones de reactivación (F6) — es el error de conversión más caro.

### P1 — Que la app no mienta (2–4 días)
5. **Cablear Settings de verdad:** `PracticePage`/`MandarinPracticePage` deben llamar `loadSettings()` y usar idioma/nivel/voz; el selector de Home debe persistir y filtrar frases reales (F8, F9). Fusionar `echo_onboarding` con `echo_settings` y limitar onboarding a idiomas soportados (F11).
6. **Un solo sitio para resultados:** recomendación — inline en Practice (donde está el contexto de la frase y la onda) y convertir `/results` en redirect, o al revés; hoy ambos son medios muertos (F7). Mientras: botón "escuchar modelo" disponible **antes** de grabar (F12).
7. **MIME honesto:** blob `audio/webm` + nombre coherente, o transcodificar a WAV de verdad (F10).
8. **Dark mode legible:** botones con `var(--on-primary)` en vez de blanco fijo (V4), iconos con `currentColor` (V8), slate fuera de Settings (V9).

### P2 — El diferenciador: waveform protagonista (1–2 semanas)
9. **Resucitar `WaveComparison` o borrarlo.** El radar dice que la comparación de ondas es EL diferenciador libre de competencia (Say It lo usa de kicker; ELSA lo entierra; BoldVoice/Speechling no lo tienen). Si se resucita: conectar con datos reales de la grabación vs. TTS nativo, quitar `Math.random()`, y ponerlo en el centro de la pantalla de resultados. Es también el asset de marketing ("see your accent").
10. **Decisión mandarín:** o scoring tonal real (pitch por sílaba con boundaries calculados — el pipeline YIN ya está pagado) o quitar la promesa de "tone score" y venderlo como "transcripción + contorno visual". Lo que no puede seguir es el teatro actual (F1/F2).
11. **Accesibilidad como spec, no como parche:** focus ≥3:1 (V11), texto ≥4.5:1 degradando lavanda a `--primary` para texto pequeño (V13/V14), touch targets 44px reales — empezando por eliminar `--touch-target-small` (V20), colores de tono con variantes dark (V13).
12. **Tipografía:** cargar JetBrains Mono o cambiar el token; fallback CJK explícito para las frases ZH; `<h1>` en Home (V18).

### P3 — Hacia el hueco del mercado (post-v1.0, alineado con ROADMAP)
13. **Plan por fonemas débiles** (lección ELSA): el backend ya devuelve desglose por fonema — agregar "tus 3 sonidos a trabajar" en Progress convierte historial en plan.
14. **Drills por L1** (lección BoldVoice): curar frases por pares de errores típicos ES→EN / EN→ES.
15. **Journal coloreado con estado "regrabado"** (lección Speechling) en el historial.
16. **Limpieza de deuda:** borrar funciones/tipos muertos de `api.ts`, `pinyinData.ts`, react-query si no se adopta (F14); ruta 404; header duplicado ×4 en ProgressPage; actualizar README (React 19, pantallas implementadas).

### Qué NO cambiar
El sistema de tokens de `index.css` (salvo los fixes puntuales), la disciplina de `var(--*)` en componentes, dot-grid + glass + glows lavanda, Orbitron como acento estructural, los skeletons, el skip-nav y el reduced-motion. La base es buena; el problema es la convergencia, no el gusto.

---

## 7. Apéndice — verificación y limitaciones

- **Verificado por re-lectura directa:** `--warm-gold` indefinido (usos en `ScoreDisplay.tsx:63`, `ToneVisualization.tsx:49`); `WaveComparison` sin imports; `syllableBoundaries` sin llamador; glows terracota en 3 archivos; ausencia de bloque `[data-theme="light"]`; `--sidebar-width: 0px` móvil; React 19 en `package.json`.
- **Gates:** `npx tsc --noEmit` → limpio.
- **No cubierto:** comportamiento en runtime (click-through, grabación real, respuestas del backend), cobertura cross-browser, auditoría del backend FastAPI (parcialmente cubierta en `AUDIT_2026-07-18.md`).
- **Fuentes del radar:** reviews públicas 2024–2026 (pronounce.tv, multilingualmastery.com, smartlanguagelearner.com, aichief.com, technicalustad.com), webs oficiales (elsaspeak.com, elt.oup.com), y agregadores de funding; precios variables por región/plataforma — tómense como rangos.
