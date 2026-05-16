import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaveComparisonProps {
  targetAudioUrl: string | null;
  userAudioBlob: Blob | null;
  targetWaveform?: number[];
  userWaveform?: number[];
  className?: string;
}

interface PlaybackState {
  isPlayingTarget: boolean;
  isPlayingUser: boolean;
  isPlayingBoth: boolean;
  currentTime: number;
  duration: number;
}

/**
 * WaveComparison - A beautiful waveform visualization that compares
 * target pronunciation (ideal) vs user's actual recording.
 * 
 * Design inspired by Strike reference:
 * - Two overlapping waveforms
 * - Target: smooth, elegant, terracotta tint
 * - User: actual recording, deep slate
 * - Divergence areas highlighted
 * - Interactive playback controls
 */
export function WaveComparison({
  targetAudioUrl,
  userAudioBlob,
  targetWaveform,
  userWaveform,
  className = '',
}: WaveComparisonProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [playback, setPlayback] = useState<PlaybackState>({
    isPlayingTarget: false,
    isPlayingUser: false,
    isPlayingBoth: false,
    currentTime: 0,
    duration: 0,
  });

  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(true);
  const [showUser, setShowUser] = useState(true);
  const [containerWidth, setContainerWidth] = useState(800);

  // Generate demo waveforms if none provided
  const generateDemoWaveform = useCallback((seed: number, points: number = 200): number[] => {
    const wave: number[] = [];
    for (let i = 0; i < points; i++) {
      const x = i / points;
      // Complex waveform with multiple harmonics
      const base = Math.sin(x * Math.PI * 2 * 3 + seed) * 0.3;
      const harmonic1 = Math.sin(x * Math.PI * 2 * 7 + seed * 2) * 0.15;
      const harmonic2 = Math.sin(x * Math.PI * 2 * 11 + seed * 3) * 0.08;
      const envelope = Math.sin(x * Math.PI) * 0.5 + 0.5;
      const noise = (Math.random() - 0.5) * 0.05;
      wave.push((base + harmonic1 + harmonic2) * envelope + noise);
    }
    return wave;
  }, []);

  const targetData = targetWaveform || generateDemoWaveform(0, 200);
  const userData = userWaveform || generateDemoWaveform(1.5, 200);

  // Calculate divergence for visualization
  const calculateDivergence = useCallback((target: number[], user: number[]): number[] => {
    const divergence: number[] = [];
    const minLength = Math.min(target.length, user.length);
    for (let i = 0; i < minLength; i++) {
      divergence.push(Math.abs(target[i] - user[i]));
    }
    return divergence;
  }, []);

  const divergenceData = calculateDivergence(targetData, userData);

  // Responsive width handling
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

  // SVG dimensions
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const graphWidth = containerWidth - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const centerY = padding.top + graphHeight / 2;

  // Scale waveform data to SVG coordinates
  const scaleX = (index: number, length: number) => padding.left + (index / (length - 1)) * graphWidth;
  const scaleY = (value: number) => centerY - value * graphHeight * 0.4;

  // Generate smooth SVG path using Catmull-Rom spline
  const generateSmoothPath = (data: number[]): string => {
    if (data.length < 2) return '';
    
    const points = data.map((val, i) => ({
      x: scaleX(i, data.length),
      y: scaleY(val),
    }));

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
  };

  // Generate filled area path
  const generateAreaPath = (data: number[]): string => {
    const linePath = generateSmoothPath(data);
    if (!linePath) return '';
    const lastX = scaleX(data.length - 1, data.length);
    return `${linePath} L ${lastX} ${centerY} L ${padding.left} ${centerY} Z`;
  };

  // Audio playback handlers
  const stopAllAudio = useCallback(() => {
    if (targetAudioRef.current) {
      targetAudioRef.current.pause();
      targetAudioRef.current.currentTime = 0;
    }
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
    }
    cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const playTarget = useCallback(() => {
    stopAllAudio();
    if (targetAudioUrl && targetAudioRef.current) {
      targetAudioRef.current.play();
      setPlayback(prev => ({ ...prev, isPlayingTarget: true, isPlayingUser: false, isPlayingBoth: false }));
    }
  }, [targetAudioUrl, stopAllAudio]);

  const playUser = useCallback(() => {
    stopAllAudio();
    if (userAudioBlob && userAudioRef.current) {
      userAudioRef.current.play();
      setPlayback(prev => ({ ...prev, isPlayingTarget: false, isPlayingUser: true, isPlayingBoth: false }));
    }
  }, [userAudioBlob, stopAllAudio]);

  const playBoth = useCallback(() => {
    stopAllAudio();
    if (targetAudioUrl && targetAudioUrl && targetAudioRef.current && userAudioRef.current) {
      targetAudioRef.current.play();
      userAudioRef.current.play();
      setPlayback(prev => ({ ...prev, isPlayingTarget: false, isPlayingUser: false, isPlayingBoth: true }));
    }
  }, [targetAudioUrl, userAudioBlob, stopAllAudio]);

  const pausePlayback = useCallback(() => {
    stopAllAudio();
    setPlayback(prev => ({
      ...prev,
      isPlayingTarget: false,
      isPlayingUser: false,
      isPlayingBoth: false,
    }));
  }, [stopAllAudio]);

  // Audio time update loop
  useEffect(() => {
    const updateTime = () => {
      if (targetAudioRef.current && playback.isPlayingTarget) {
        setPlayback(prev => ({
          ...prev,
          currentTime: targetAudioRef.current!.currentTime,
          duration: targetAudioRef.current!.duration || prev.duration,
        }));
      } else if (userAudioRef.current && playback.isPlayingUser) {
        setPlayback(prev => ({
          ...prev,
          currentTime: userAudioRef.current!.currentTime,
          duration: userAudioRef.current!.duration || prev.duration,
        }));
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    if (playback.isPlayingTarget || playback.isPlayingUser || playback.isPlayingBoth) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [playback.isPlayingTarget, playback.isPlayingUser, playback.isPlayingBoth]);

  const handleSeek = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !playback.duration) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const ratio = Math.max(0, Math.min(1, x / graphWidth));
    const newTime = ratio * playback.duration;
    
    if (targetAudioRef.current) targetAudioRef.current.currentTime = newTime;
    if (userAudioRef.current) userAudioRef.current.currentTime = newTime;
    setPlayback(prev => ({ ...prev, currentTime: newTime }));
  };

  const progressX = playback.duration 
    ? padding.left + (playback.currentTime / playback.duration) * graphWidth 
    : padding.left;

  return (
    <motion.div
      ref={containerRef}
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Pronunciation Comparison
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTarget(!showTarget)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: showTarget ? 'var(--accent-container)' : 'var(--surface-container)',
              color: showTarget ? 'var(--on-accent-container)' : 'var(--on-surface-variant)',
            }}
            aria-pressed={showTarget}
            aria-label="Toggle target waveform"
          >
            <Volume2 size={12} />
            Target
          </button>
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: showUser ? 'var(--primary-container)' : 'var(--surface-container)',
              color: showUser ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
            }}
            aria-pressed={showUser}
            aria-label="Toggle user waveform"
          >
            <Layers size={12} />
            Your Voice
          </button>
        </div>
      </div>

      {/* Waveform SVG */}
      <div
        className="relative rounded-xl overflow-hidden cursor-crosshair"
        style={{
          backgroundColor: 'var(--surface-container-low)',
          border: '1px solid var(--outline-variant)',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${containerWidth} ${height}`}
          onClick={handleSeek}
          role="img"
          aria-label="Waveform comparison showing target pronunciation versus your recording"
        >
          <defs>
            {/* Glow filters */}
            <filter id="targetGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="userGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Gradient for target area */}
            <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>

            {/* Gradient for user area */}
            <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>

            {/* Divergence highlight gradient */}
            <linearGradient id="divergenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--score-partial)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--score-partial)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Center line */}
          <line
            x1={padding.left}
            y1={centerY}
            x2={containerWidth - padding.right}
            y2={centerY}
            stroke="var(--outline-variant)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Time grid lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={i}
              x1={padding.left + (i / 8) * graphWidth}
              y1={padding.top}
              x2={padding.left + (i / 8) * graphWidth}
              y2={height - padding.bottom}
              stroke="var(--outline-variant)"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          {/* Divergence areas (background highlight) */}
          {divergenceData.map((div, i) => {
            if (div < 0.15) return null;
            const x = scaleX(i, divergenceData.length);
            const width = graphWidth / divergenceData.length;
            return (
              <rect
                key={`div-${i}`}
                x={x - width / 2}
                y={padding.top}
                width={width + 1}
                height={graphHeight}
                fill="url(#divergenceGradient)"
                opacity={Math.min(1, div * 2)}
              />
            );
          })}

          {/* Target waveform area */}
          <AnimatePresence>
            {showTarget && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d={generateAreaPath(targetData)}
                  fill="url(#targetGradient)"
                />
                <path
                  d={generateSmoothPath(targetData)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#targetGlow)"
                  opacity="0.8"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* User waveform area */}
          <AnimatePresence>
            {showUser && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d={generateAreaPath(userData)}
                  fill="url(#userGradient)"
                />
                <path
                  d={generateSmoothPath(userData)}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#userGlow)"
                  opacity="0.9"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Progress line */}
          {(playback.isPlayingTarget || playback.isPlayingUser || playback.isPlayingBoth) && (
            <motion.line
              x1={progressX}
              y1={padding.top}
              x2={progressX}
              y2={height - padding.bottom}
              stroke="var(--accent)"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.1 }}
            />
          )}

          {/* Hover indicator */}
          {hoveredTime !== null && (
            <>
              <line
                x1={padding.left + hoveredTime * graphWidth}
                y1={padding.top}
                x2={padding.left + hoveredTime * graphWidth}
                y2={height - padding.bottom}
                stroke="var(--on-surface)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.4"
              />
              <text
                x={padding.left + hoveredTime * graphWidth}
                y={padding.top - 5}
                textAnchor="middle"
                fill="var(--on-surface-variant)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {(hoveredTime * (playback.duration || 1)).toFixed(1)}s
              </text>
            </>
          )}

          {/* SVG mouse tracking for hover */}
          <rect
            x={padding.left}
            y={padding.top}
            width={graphWidth}
            height={graphHeight}
            fill="transparent"
            onMouseMove={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (rect) {
                const x = (e.clientX - rect.left - padding.left) / graphWidth;
                setHoveredTime(Math.max(0, Math.min(1, x)));
              }
            }}
            onMouseLeave={() => setHoveredTime(null)}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Target pronunciation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Your recording
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--score-partial)', opacity: 0.3 }}
          />
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            Difference areas
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3">
        {playback.isPlayingTarget || playback.isPlayingUser || playback.isPlayingBoth ? (
          <button
            onClick={pausePlayback}
            className="btn-secondary flex items-center gap-2"
            aria-label="Pause playback"
          >
            <Pause size={18} />
            Pause
          </button>
        ) : (
          <>
            {targetAudioUrl && (
              <button
                onClick={playTarget}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'var(--accent-container)',
                  color: 'var(--on-accent-container)',
                }}
                aria-label="Play target pronunciation"
              >
                <Volume2 size={16} />
                Play Target
              </button>
            )}
            {userAudioBlob && (
              <button
                onClick={playUser}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'var(--primary-container)',
                  color: 'var(--on-primary-container)',
                }}
                aria-label="Play your recording"
              >
                <Play size={16} />
                Play Your Voice
              </button>
            )}
            {targetAudioUrl && userAudioBlob && (
              <button
                onClick={playBoth}
                className="btn-primary flex items-center gap-2"
                aria-label="Play both audio tracks together"
              >
                <Layers size={16} />
                Compare Together
              </button>
            )}
          </>
        )}

        <button
          onClick={() => {
            stopAllAudio();
            setPlayback(prev => ({ ...prev, currentTime: 0 }));
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: 'var(--surface-container)',
            color: 'var(--on-surface-variant)',
          }}
          aria-label="Reset playback"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Hidden audio elements */}
      {targetAudioUrl && (
        <audio
          ref={targetAudioRef}
          src={targetAudioUrl}
          onEnded={() => setPlayback(prev => ({ ...prev, isPlayingTarget: false, isPlayingBoth: false }))}
          preload="metadata"
        />
      )}
      {userAudioBlob && (
        <audio
          ref={userAudioRef}
          src={URL.createObjectURL(userAudioBlob)}
          onEnded={() => setPlayback(prev => ({ ...prev, isPlayingUser: false, isPlayingBoth: false }))}
          preload="metadata"
        />
      )}
    </motion.div>
  );
}
