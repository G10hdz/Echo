# Echo Brand Design System

> Sistema de diseño para Echo — app de práctica de pronunciación.
> **Teal Tech** · enero 2026

---

## Filosofía

Echo es una herramienta de voz: el usuario habla, recibe feedback, mejora.
El diseño debe sentirse **preciso como un instrumento, cálido como una conversación**.
Un bidet de alta gama, no un centro de comando.

Valores: **claridad**, **calidez**, **progreso palpable**.

---

## Tokens de color (OKLch)

### Luz

| Token | OKLch | Hex | Uso |
|---|---|---|---|
| `--teal` | `oklch(0.50 0.08 185)` | `#1A7A6B` | Primario: botones, bloques de color |
| `--teal-dim` | `oklch(0.60 0.09 185)` | `#2A9A8B` | Hover / variante clara |
| `--amber` | `oklch(0.72 0.12 85)` | `#E8B84A` | Acento: logros, streak, badges |
| `--bg` | `oklch(0.98 0.003 100)` | `#FAFAFA` | Fondo de página |
| `--surface` | `oklch(1 0 0)` | `#FFFFFF` | Superficies / cards |
| `--fg` | `oklch(0.15 0.01 170)` | `#0E1412` | Texto principal |
| `--muted` | `oklch(0.50 0.02 170)` | `#5A7268` | Texto secundario, metadatos |

### Oscuro

| Token | OKLch | Hex | Uso |
|---|---|---|---|
| `--teal` | `oklch(0.72 0.06 185)` | `#7AC8B8` | Primario en dark |
| `--amber` | `oklch(0.80 0.10 85)` | `#F0D080` | Acento en dark |
| `--bg` | `oklch(0.14 0.008 170)` | `#0E1412` | Fondo oscuro |
| `--surface` | `oklch(0.18 0.01 170)` | `#182220` | Superficies en dark |
| `--fg` | `oklch(0.90 0.008 170)` | `#E0F0EA` | Texto en dark |
| `--muted` | `oklch(0.65 0.02 170)` | `#90B0A8` | Secundario en dark |

### Semánticos (no derivados)

| Token | Hex | Uso |
|---|---|---|
| `--score-hi` | `#2E8A5A` | Score ≥ 80% |
| `--score-mid` | `#C4A040` | Score 60-79% |
| `--score-lo` | `#C84A5A` | Score < 60% |

---

## Tipografía

| Rol | Fuente | Peso | Fallback |
|---|---|---|---|
| Display / headlines | Outfit | 600-700 | system-ui, sans-serif |
| Body / UI | Inter | 400-600 | system-ui, sans-serif |
| Mono / scores | JetBrains Mono | 500-600 | 'Fira Code', monospace |

### Escala

| Elemento | Tamaño | Tracking | Leading |
|---|---|---|---|
| H1 | `clamp(2rem, 4vw, 2.75rem)` | `-0.02em` | `1.1` |
| H2 | `1.5rem` | `-0.01em` | `1.2` |
| Body | `1rem` (16px) | `0` | `1.6` |
| Small | `0.8125rem` (13px) | `0.02em` | `1.5` |
| Caption | `0.6875rem` (11px) | `0.02em` | `1.5` |
| Eyebrow / ALL CAPS | `0.6875rem` | `0.08em` | `1.5` |

### Peso

- **Read (400)** — body copy
- **Emphasize (500)** — UI text, labels, navigation
- **Announce (600)** — headlines, buttons

---

## Espaciado

| Escala | Rem | Px |
|---|---|---|
| `--space-xs` | `0.25rem` | 4 |
| `--space-sm` | `0.5rem` | 8 |
| `--space-md` | `1rem` | 16 |
| `--space-lg` | `1.5rem` | 24 |
| `--space-xl` | `2.5rem` | 40 |
| `--space-2xl` | `3.5rem` | 56 |

Radio de borde: `--radius-sm: 0.75rem`, `--radius-md: 1rem`, `--radius-lg: 1.5rem`, `--radius-xl: 2rem`.

---

## Componentes clave

### Topbar (Fluid Island)
- Nav flotante, separada del borde superior (`margin-top: 1rem`)
- `border-radius: 999px`, `backdrop-filter: blur(24px)`
- Contenido: wordmark ECHO + streak badge + theme toggle

### Hero (Bloque de color sólido)
- Fondo `--teal` sólido, no gradiente
- H1 blanco, subtexto `rgba(255,255,255,0.8)`
- CTA blanco con icono anidado (Button-in-Button)
- Selector de idioma con pills translúcidas

### Stats Panel
- **Level badge**: pill con icono circular + texto + XP
- **Ring de progreso**: SVG circle con `stroke-dashoffset` animado
- **Mini-stats**: grid 3-col con count-up animation

### Session Cards (Double-Bezel)
- Outer shell: `border + padding: 2px + border-radius: 2rem`
- Inner core: `background: var(--surface)`, `border-radius: calc(2rem - 2px)`
- Contenido: frase + score bar animada + chevron

### Achievement Strip
- Icono estrella en círculo ámbar
- Título + barra de progreso + label

---

## Motion

| Elemento | Duración | Easing | Propiedad |
|---|---|---|---|
| Entrada hero | 700ms | `cubic-bezier(0.32,0.72,0,1)` | opacity, transform |
| Score bars | 1000ms | `cubic-bezier(0.32,0.72,0,1)` | width |
| Ring fill | 1200ms | `cubic-bezier(0.32,0.72,0,1)` | stroke-dashoffset |
| Count-up | 800ms | `cubic-bezier(0.16,1,0.3,1)` | textContent |
| Streak pulse | 2s loop | `cubic-bezier(0.16,1,0.3,1)` | box-shadow |
| CTA hover | 300ms | `cubic-bezier(0.32,0.72,0,1)` | transform, box-shadow |
| CTA active | 100ms | instant | scale(.98) |
| Confetti | 2.5s | `cubic-bezier(0.32,0.72,0,1)` | transform, opacity |

Reduced motion: bloquear animaciones vía `@media (prefers-reduced-motion: reduce)`, pero mantener los valores finales (width, stroke-dashoffset) visibles.

---

## Reglas de uso

1. **Un acento por pantalla**: ámbar aparece máximo 2 veces (streak badge + achievement bar)
2. **Teal es el primario**: usado en bloques sólidos, no como tinte en bordes
3. **Sin gradientes decorativos**: el único gradiente es el del outer shell Double-Bezel (función estructural)
4. **Sin emojis**: todos los iconos son SVGs con `currentColor`
5. **Sin Inter en display**: Outfit es la display face, Inter solo para body
6. **Touch targets ≥ 44px** en todos los controles interactivos
