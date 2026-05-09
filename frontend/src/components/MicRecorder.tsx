import { Mic, StopCircle, RotateCcw, Play } from 'lucide-react';

interface MicRecorderProps {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  waveformRef: React.RefObject<HTMLCanvasElement | null>;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onResetRecording: () => void;
  onPlayback: () => void;
}

export function MicRecorder({
  isRecording,
  duration,
  audioBlob,
  waveformRef,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  onPlayback,
}: MicRecorderProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card" role="region" aria-label="Voice recorder">
      <h3
        className="text-xl font-semibold mb-6"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
      >
        Record Your Voice
      </h3>

      {/* Waveform Visualizer */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--surface-container-low)',
          border: isRecording
            ? '2px solid var(--accent)'
            : '1px solid var(--outline-variant)',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <canvas
          ref={waveformRef}
          width={800}
          height={200}
          className="w-full"
          style={{ display: 'block' }}
          aria-label={isRecording ? 'Audio waveform — recording in progress' : 'Audio waveform'}
          role="img"
        />
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            onClick={onStartRecording}
            className="btn-primary flex items-center gap-2 text-lg py-3 px-6"
            aria-label="Start recording"
          >
            <Mic size={22} aria-hidden="true" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <div
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: 'var(--error-container)',
                color: 'var(--on-error-container)',
                fontWeight: 600,
              }}
              role="status"
              aria-live="polite"
            >
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--error)' }}
                aria-hidden="true"
              />
              Recording... {formatDuration(duration)}
            </div>
            <button
              onClick={onStopRecording}
              className="btn-primary flex items-center gap-2"
              style={{ backgroundColor: 'var(--error)' }}
              aria-label="Stop recording"
            >
              <StopCircle size={20} aria-hidden="true" />
              Stop
            </button>
          </>
        )}

        {!isRecording && audioBlob && (
          <>
            <button
              onClick={onPlayback}
              className="btn-secondary flex items-center gap-2"
              aria-label="Playback your recording"
            >
              <Play size={20} aria-hidden="true" />
              Playback
            </button>
            <button
              onClick={onResetRecording}
              className="btn-secondary flex items-center gap-2"
              aria-label="Re-record your pronunciation"
            >
              <RotateCcw size={20} aria-hidden="true" />
              Re-record
            </button>
          </>
        )}
      </div>
    </div>
  );
}