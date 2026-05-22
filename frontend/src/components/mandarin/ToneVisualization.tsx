import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SyllableToneScore, PitchContour } from '../../types';
import { toneColor, toneLabel, TONE_DESCRIPTIONS } from '../../lib/mandarin/toneColors';

interface ToneVisualizationProps {
  syllables: SyllableToneScore[];
  pitchContour: PitchContour | null;
  className?: string;
}

const SVG_HEIGHT = 180;
const PADDING = { top: 24, right: 20, bottom: 40, left: 20 };
const TONE_PROFILES: Record<number, number[]> = {
  1: [0.75, 0.74, 0.75, 0.74, 0.75, 0.74, 0.75, 0.74, 0.75, 0.74,
    0.75, 0.74, 0.75, 0.74, 0.75, 0.74, 0.75, 0.74, 0.75, 0.73],
  2: [0.38, 0.42, 0.48, 0.52, 0.56, 0.60, 0.64, 0.68, 0.72, 0.74,
    0.76, 0.78, 0.80, 0.80, 0.79, 0.78, 0.77, 0.76, 0.75, 0.74],
  3: [0.42, 0.38, 0.32, 0.25, 0.20, 0.18, 0.20, 0.25, 0.32, 0.38,
    0.44, 0.48, 0.52, 0.54, 0.55, 0.54, 0.52, 0.50, 0.49, 0.48],
  4: [0.82, 0.80, 0.77, 0.73, 0.68, 0.62, 0.56, 0.50, 0.44, 0.38,
    0.34, 0.30, 0.27, 0.25, 0.23, 0.22, 0.21, 0.21, 0.20, 0.20],
  0: [0.50, 0.50, 0.49, 0.48, 0.48, 0.47, 0.47, 0.47, 0.47, 0.47,
    0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.46, 0.46],
};

function generateSmoothPath(
  points: { x: number; y: number }[],
): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 0.85) return { label: 'Good', color: 'var(--score-correct)' };
  if (score >= 0.6) return { label: 'OK', color: 'var(--score-partial)' };
  if (score >= 0.3) return { label: 'Weak', color: 'var(--warm-gold)' };
  return { label: 'Miss', color: 'var(--score-incorrect)' };
}

export function ToneVisualization({
  syllables,
  pitchContour,
  className = '',
}: ToneVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [hoveredSyllable, setHoveredSyllable] = useState<number | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const graphWidth = containerWidth - PADDING.left - PADDING.right;
  const graphHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const scaleY = (v: number) => PADDING.top + graphHeight * (1 - v);

  const syllableCount = syllables.length || 1;
  const syllableWidth = graphWidth / syllableCount;

  const userPoints = useMemo(() => {
    if (!pitchContour || pitchContour.points.length === 0) return [];
    const pts = pitchContour.points;
    const total = pts.length;
    return pts.map((v, i) => ({
      x: PADDING.left + (i / (total - 1 || 1)) * graphWidth,
      y: scaleY(v),
    }));
  }, [pitchContour, graphWidth, scaleY]);

  const targetPaths = useMemo(() => {
    return syllables.map((syl, i) => {
      const profile = TONE_PROFILES[syl.expectedTone] || TONE_PROFILES[0];
      const startX = PADDING.left + i * syllableWidth;
      const pts = profile.map((v, j) => ({
        x: startX + (j / (profile.length - 1)) * syllableWidth,
        y: scaleY(v),
      }));
      return {
        path: generateSmoothPath(pts),
        color: toneColor(syl.expectedTone),
        syllableIndex: i,
      };
    });
  }, [syllables, syllableWidth, scaleY]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (syllables.length === 0) {
    return (
      <motion.div
        className={`card text-center py-8 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Record your voice to see tone visualization
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Tone Contours
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-[2px] rounded"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Target
            </span>
          </div>
          {pitchContour && pitchContour.points.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-[2px] rounded"
                style={{ backgroundColor: 'var(--primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                Your voice
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-container-low)',
          border: '1px solid var(--outline-variant)',
        }}
      >
        <svg
          width="100%"
          height={SVG_HEIGHT}
          viewBox={`0 0 ${containerWidth} ${SVG_HEIGHT}`}
          role="img"
          aria-label="Tone contour visualization showing target and actual pitch patterns"
        >
          <defs>
            <filter id="toneGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {syllables.map((syl, i) => (
              <linearGradient
                key={`grad-${i}`}
                id={`syllableGrad-${i}`}
                x1="0" y1="0" x2="0" y2="1"
              >
                <stop offset="0%" stopColor={toneColor(syl.expectedTone)} stopOpacity="0.12" />
                <stop offset="100%" stopColor={toneColor(syl.expectedTone)} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal reference lines */}
          {[0.25, 0.5, 0.75].map((v) => (
            <line
              key={`ref-${v}`}
              x1={PADDING.left}
              y1={scaleY(v)}
              x2={containerWidth - PADDING.right}
              y2={scaleY(v)}
              stroke="var(--outline-variant)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          ))}

          {/* Syllable section backgrounds */}
          {syllables.map((_syl, i) => {
            const startX = PADDING.left + i * syllableWidth;
            const isHovered = hoveredSyllable === i;
            return (
              <g key={`bg-${i}`}>
                <rect
                  x={startX}
                  y={PADDING.top}
                  width={syllableWidth}
                  height={graphHeight}
                  fill={`url(#syllableGrad-${i})`}
                  opacity={isHovered ? 1 : 0.7}
                />
                {i > 0 && (
                  <line
                    x1={startX}
                    y1={PADDING.top}
                    x2={startX}
                    y2={SVG_HEIGHT - PADDING.bottom}
                    stroke="var(--outline-variant)"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                )}
              </g>
            );
          })}

          {/* Target tone contour lines */}
          {targetPaths.map(({ path, color, syllableIndex }) => (
            <motion.path
              key={`target-${syllableIndex}`}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#toneGlow)"
              opacity="0.85"
              initial={prefersReducedMotion ? { opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.85 }
                  : { pathLength: 1, opacity: 0.85 }
              }
              transition={{ duration: 0.6, delay: syllableIndex * 0.12 }}
            />
          ))}

          {/* User pitch contour */}
          {userPoints.length >= 2 && (
            <motion.path
              d={generateSmoothPath(userPoints)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              initial={prefersReducedMotion ? { opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.9 }
                  : { pathLength: 1, opacity: 0.9 }
              }
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          )}

          {/* Hover detection */}
          {syllables.map((_, i) => {
            const startX = PADDING.left + i * syllableWidth;
            return (
              <rect
                key={`hover-${i}`}
                x={startX}
                y={PADDING.top}
                width={syllableWidth}
                height={graphHeight + PADDING.bottom}
                fill="transparent"
                onMouseEnter={() => setHoveredSyllable(i)}
                onMouseLeave={() => setHoveredSyllable(null)}
              />
            );
          })}

          {/* Syllable labels at bottom */}
          {syllables.map((syl, i) => {
            const centerX = PADDING.left + i * syllableWidth + syllableWidth / 2;
            const isHovered = hoveredSyllable === i;
            return (
              <g key={`label-${i}`}>
                <text
                  x={centerX}
                  y={SVG_HEIGHT - PADDING.bottom + 16}
                  textAnchor="middle"
                  fill={toneColor(syl.expectedTone)}
                  fontSize="14"
                  fontFamily="var(--font-headline)"
                  fontWeight="700"
                >
                  {syl.char}
                </text>
                <text
                  x={centerX}
                  y={SVG_HEIGHT - PADDING.bottom + 30}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--on-surface)' : 'var(--on-surface-variant)'}
                  fontSize="9"
                  fontFamily="var(--font-body)"
                >
                  {syl.pinyin}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Per-syllable tone score badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {syllables.map((syl, i) => {
          const grade = getScoreGrade(syl.toneScore);
          const col = toneColor(syl.expectedTone);
          return (
            <motion.div
              key={`badge-${i}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `${col}18`,
                borderLeft: `3px solid ${col}`,
                color: 'var(--on-surface)',
              }}
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onMouseEnter={() => setHoveredSyllable(i)}
              onMouseLeave={() => setHoveredSyllable(null)}
            >
              <span style={{ color: col, fontWeight: 700 }}>{syl.char}</span>
              <span style={{ color: 'var(--on-surface-variant)' }}>
                {toneLabel(syl.expectedTone)}
              </span>
              <span style={{ color: grade.color, fontWeight: 600 }}>
                {Math.round(syl.toneScore * 100)}%
              </span>
              {syl.confidence < 0.5 && (
                <span
                  className="text-[10px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--score-partial-bg)',
                    color: 'var(--score-partial)',
                  }}
                >
                  low
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Hover detail tooltip */}
      <AnimatePresence>
        {hoveredSyllable !== null && syllables[hoveredSyllable] && (
          <motion.div
            className="mt-2 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--surface-container)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {(() => {
              const syl = syllables[hoveredSyllable];
              const grade = getScoreGrade(syl.toneScore);
              return (
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold" style={{ color: toneColor(syl.expectedTone) }}>
                    {syl.char}
                  </span>
                  <div>
                    <div className="font-semibold">
                      {syl.pinyin} — {toneLabel(syl.expectedTone)}{' '}
                      <span style={{ color: 'var(--on-surface-variant)' }}>
                        ({TONE_DESCRIPTIONS[syl.expectedTone]})
                      </span>
                    </div>
                    <div style={{ color: grade.color }} className="font-medium">
                      {grade.label} · {Math.round(syl.toneScore * 100)}% match
                      {syl.detectedTone !== syl.expectedTone && (
                        <span style={{ color: 'var(--on-surface-variant)' }}>
                          {' '}(detected {toneLabel(syl.detectedTone)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}