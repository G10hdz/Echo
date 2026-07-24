# Echo · Roadmap de diseño

Prototipos estáticos en `design/`, todos sobre el sistema Fresco
(`echo-fresco-ui.css` + tokens del home). Producto: práctica de
pronunciación — **oír modelo → grabar → comparar onda → puntuar → repasar**.

## Estado actual

| Pantalla | Archivo | Estado |
| --- | --- | --- |
| Home | `echo-home-fresco.html` | Listo |
| Onboarding (3 pasos) | `echo-onboarding.html` | Listo |
| Práctica | `echo-redesign-practice-v2.html`* | Listo |
| Biblioteca | `echo-library.html` | Listo |
| Cola de repaso | `echo-review.html` | Listo |
| Historial | `echo-history.html` | Listo |
| Perfil y metas | `echo-profile.html` | Listo |
| Audio y privacidad | `echo-audio-privacy.html` | Listo |

\* Pantalla de práctica vive en el proyecto de diseño; pendiente de importar al repo.

**Convenciones compartidas:** topbar-isla, nav de 6 destinos
(`Inicio · Biblioteca · Repasar · Historial · Perfil · Ajustes`), tema
`echo-theme` resuelto como `dark|light|system` (con `matchMedia`), estados
carga/vacío/error, `localStorage` en try/catch, roles ARIA
(`switch`/`progressbar`/`alert`), `prefers-reduced-motion` heredado del CSS.

## Deuda pendiente (de la revisión)

- **Home ↔ flujos no cierra el círculo.** `echo-home-fresco.html` usa
  `.wordmark` → `index.html` y **no tiene `.nav`**; las 6 pantallas apuntan a
  él como "Inicio" pero él no puede volver a ellas, y su topbar difiere
  (`wordmark` vs `brand`, badge de racha ausente). Falta darle nav al home.
- **Selector de tema de 3 estados** en las subpantallas (hoy el toggle solo
  alterna claro/oscuro y nunca vuelve a `system`). Va en Ajustes generales (#6).
- **`clear-data`** (audio/privacidad) no limpia todas las claves
  (`echo-lang`, `echo-goal-type`). Cosmético para maqueta.

---

## Roadmap por prioridad

### Tier 1 — cerrar el bucle central (siguiente sprint)

**1. Resultado de pronunciación** ⭐
El *payoff* del producto; hoy solo existe como diálogo delgado en Historial.
Onda tuya vs. modelo superpuestas, palabras/fonemas marcados, 1 tip
accionable, acciones *Repetir / Siguiente / Guardar en repaso*.
Reusa: `.detail-grid`, `--success`/`--danger`, WaveComparison.

**2. Detalle de lección / ejercicio**
Puente entre Biblioteca y Práctica (hoy salta directo). Frases incluidas,
dificultad, duración, *Empezar*. Reusa: `.doppel`/`.panel`, lista tipo `.session`.

**3. Resumen de sesión / meta cumplida**
Momento que celebra el cierre del día (Perfil promete "Echo deja de empujar"
pero nada lo marca). Minutos, frases, mejor frase, racha +1.
Reusa: `.callout`, `--reward`.

### Tier 2 — retención

**4. Progreso / insights**
Calendario de racha, minutos/día, curva de precisión en el tiempo.
Reusa: `.bar`, `.goal-list`.

**5. Logros**
Galería de medallas (racha 7/30, primer 90+, 3 idiomas). Perfil ya insinúa
"Próximo logro" sin galería. Reusa: `--reward`, rejilla tipo `.choice-grid`.

**6. Ajustes generales + recordatorios**
Recordatorio diario (hora) — driver #1 de retención en apps de práctica —,
idioma de interfaz, cuenta, y **selector de tema de 3 estados** (cierra la
deuda de arriba). Reusa: `.setting`, `.switch`, `.segmented`.

### Tier 3 — crecimiento (si hay monetización)

**7. Paywall / planes**
El "Mandarín · beta" ya sugiere tiers. Reusa: `.choice-grid`, `--reward`.

**8. Tarjeta para compartir**
Score/racha como imagen exportable → loop orgánico.

---

## Orden recomendado

**1 → 2 → 3** primero: son el bucle central y hoy están incompletos; sin
ellas las pantallas nuevas rodean un centro hueco. Luego **6** (recordatorios
+ tema 3-estados, que además salda la deuda pendiente). Tier 2/3 según señales
de retención y decisión de monetización.
