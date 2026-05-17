import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, RotateCcw } from 'lucide-react';

interface MicRecorderProps {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  waveformRef: React.RefObject<HTMLCanvasElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onResetRecording: () => void;
  onPlayback: () => void;
}

const BAR_COUNT = 48;

export function MicRecorder({
  isRecording,
  duration,
  audioBlob,
  analyserRef,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  onPlayback,
}: MicRecorderProps) {
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(4));
  const rafRef = useRef<number | null>(null);

  /* ------------------------------------------------------------------ */
  /*  SVG waveform animation loop (frequency data → bars)                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isRecording || !analyserRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setBarHeights(Array(BAR_COUNT).fill(4));
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);

      const bars = Array(BAR_COUNT).fill(0);
      const step = Math.floor(bufferLength / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] || 0;
        // Min bar height 4px, max 100px
        bars[i] = 4 + (value / 255) * 96;
      }

      setBarHeights(bars);
    };

    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col items-center gap-5 py-6" role="region" aria-label="Voice recorder">
      {/* ---------- SVG Waveform Visualizer ---------- */}
      <div className="w-full max-w-sm h-20 flex items-center justify-center px-4">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${BAR_COUNT * 5} 100`}
          preserveAspectRatio="none"
          aria-label={isRecording ? 'Audio frequency visualizer — recording in progress' : 'Audio waveform'}
          role="img"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
            </linearGradient>
          </defs>
          {barHeights.map((height, i) => (
            <motion.rect
              key={i}
              x={i * 5 + 1}
              y={(100 - height) / 2}
              width="3"
              height={height}
              rx="1.5"
              fill="url(#waveGradient)"
              initial={false}
              animate={{
                y: (100 - height) / 2,
                height,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.4 }
              }
            />
          ))}
        </svg>
      </div>

      {/* ---------- Recording Timer ---------- */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="font-mono text-sm font-semibold tracking-widest"
            style={{ color: 'var(--error)' }}
          >
            {formatDuration(duration)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Recording Button ---------- */}
      <div className="relative flex items-center justify-center">
        {/* Ripple rings — only when recording */}
        <AnimatePresence>
          {isRecording && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`ripple-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 72,
                    height: 72,
                    border: '2px solid var(--accent)',
                  }}
                  initial={{ scale: 1, opacity: 0.45 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: 2.2,
                          repeat: Infinity,
                          delay: i * 0.75,
                          ease: 'easeOut',
                        }
                  }
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main circular button */}
        <motion.button
          onClick={() => {
            if (isRecording) onStopRecording();
            else if (!audioBlob) onStartRecording();
          }}
          disabled={!isRecording && !!audioBlob}
          className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
          style={{
            backgroundColor: isRecording
              ? 'var(--error)'
              : audioBlob
                ? 'var(--surface-container)'
                : 'var(--accent)',
            boxShadow: isRecording
              ? '0 0 40px rgba(196, 93, 62, 0.35), 0 4px 16px rgba(0,0,0,0.12)'
              : audioBlob
                ? 'inset 0 2px 4px rgba(0,0,0,0.06)'
                : '0 8px 32px rgba(196, 93, 62, 0.28), 0 2px 6px rgba(0,0,0,0.08)',
            cursor: audioBlob ? 'default' : 'pointer',
          }}
          whileHover={
            !audioBlob && !isRecording
              ? { scale: 1.08, boxShadow: '0 12px 40px rgba(196, 93, 62, 0.38)' }
              : {}
          }
          whileTap={!audioBlob ? { scale: 0.92 } : {}}
          animate={
            isRecording && !prefersReducedMotion
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={
            isRecording && !prefersReducedMotion
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : { type: 'spring' as const, stiffness: 400, damping: 20 }
          }
          aria-label={isRecording ? 'Stop recording microphone' : audioBlob ? 'Recording complete' : 'Start microphone recording'}
        >
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ duration: 0.22, type: 'spring' as const, stiffness: 450, damping: 22 }}
              >
                <Square size={22} fill="white" color="white" strokeWidth={0} />
              </motion.div>
            ) : audioBlob ? (
              <motion.div
                key="complete"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.22, type: 'spring' as const, stiffness: 450, damping: 22 }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--score-correct)' }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -45 }}
                transition={{ duration: 0.22, type: 'spring' as const, stiffness: 450, damping: 22 }}
              >
                <Mic size={28} color="white" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ---------- Playback / Re-record controls ---------- */}
      <AnimatePresence>
        {!isRecording && audioBlob && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="flex items-center gap-3"
          >
            <motion.button
              onClick={onPlayback}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid var(--outline-variant)',
              }}
              whileHover={{ scale: 1.05, backgroundColor: 'var(--surface-container)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Playback your recording"
            >
              <Play size={16} fill="currentColor" />
              Play
            </motion.button>
            <motion.button
              onClick={onResetRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                border: '1px solid var(--outline-variant)',
              }}
              whileHover={{ scale: 1.05, backgroundColor: 'var(--surface-container)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Re-record your pronunciation"
            >
              <RotateCcw size={16} />
              Re-record
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Idle hint ---------- */}
      <AnimatePresence>
        {!isRecording && !audioBlob && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-center max-w-[220px] leading-relaxed"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Tap the button and read the sentence aloud
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
