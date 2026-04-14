// Microphone recording component with waveform visualizer

import { Mic, StopCircle, RotateCcw, Play } from 'lucide-react';

interface MicRecorderProps {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  waveformRef: React.RefObject<HTMLCanvasElement | null>;
  onStartRecording: () => void;
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
    <div className="card">
      <h3 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-headline)' }}>
        Record Your Voice
      </h3>

      {/* Waveform Visualizer */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--surface-container-low)',
          boxShadow: isRecording
            ? '0 0 0 4px var(--primary-fixed), 0 8px 32px rgba(87, 85, 169, 0.12)'
            : 'none',
          transition: 'all 0.3s',
        }}
      >
        <canvas
          ref={waveformRef}
          width={800}
          height={200}
          className="w-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={onStartRecording}
            className="btn-primary flex items-center gap-2 text-lg"
          >
            <Mic size={24} />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <div
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'var(--error-container)',
                color: 'var(--on-error-container)',
                fontWeight: 600,
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse mr-2" />
              Recording... {formatDuration(duration)}
            </div>
            <button
              onClick={onStopRecording}
              className="btn-primary flex items-center gap-2"
              style={{
                background: 'var(--error)',
              }}
            >
              <StopCircle size={20} />
              Stop
            </button>
          </>
        )}

        {!isRecording && audioBlob && (
          <>
            <button
              onClick={onPlayback}
              className="btn-secondary flex items-center gap-2"
            >
              <Play size={20} />
              Playback
            </button>
            <button
              onClick={onResetRecording}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Re-record
            </button>
          </>
        )}
      </div>
    </div>
  );
}
