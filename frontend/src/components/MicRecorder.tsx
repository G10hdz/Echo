import { Check, Mic, Play, RotateCcw, Square } from 'lucide-react';

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

const waveform = 'M0 32 L10 32 L16 18 L22 46 L28 10 L34 54 L40 22 L46 42 L52 14 L58 50 L64 26 L70 38 L76 20 L82 44 L88 16 L94 48 L100 30 L106 36 L112 12 L118 52 L124 24 L130 40 L136 18 L142 46 L148 32 L154 20 L160 44 L166 28 L172 34 L178 16 L184 50 L190 22 L196 42 L202 30 L208 36 L214 14 L220 48 L226 26 L232 38 L238 32 L244 20 L250 44 L256 16 L262 50 L268 30 L274 36 L280 24 L286 40 L292 32 L298 28 L304 34 L310 22 L316 40 L322 32 L328 28 L334 32 L340 32';

export function MicRecorder({ isRecording, duration, audioBlob, onStartRecording, onStopRecording, onResetRecording, onPlayback }: MicRecorderProps) {
  const timer = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}.${Math.floor((duration % 1) * 10)}`;
  const label = isRecording ? 'Stop microphone recording' : audioBlob ? 'Recording complete' : 'Start microphone recording';

  return (
    <section className="doppel" aria-label="Pronunciation recorder">
      <div className="doppel__inner">
        <svg className="waveform" viewBox="0 0 340 64" preserveAspectRatio="none" aria-hidden="true"><path d={waveform} /></svg>
        <div className="rec-controls">
          <button className="mini-icon-btn" onClick={onResetRecording} disabled={!audioBlob || isRecording} aria-label="Reset recording"><RotateCcw size={18} /></button>
          <button className="rec-btn" data-recording={isRecording} onClick={() => isRecording ? onStopRecording() : !audioBlob && onStartRecording()} disabled={!!audioBlob && !isRecording} aria-label={label} aria-pressed={isRecording}>
            {isRecording ? <Square size={28} fill="currentColor" strokeWidth={0} /> : audioBlob ? <Check size={28} /> : <Mic size={28} />}
          </button>
          <button className="mini-icon-btn" onClick={onPlayback} disabled={!audioBlob || isRecording} aria-label="Play recording"><Play size={18} fill="currentColor" /></button>
        </div>
        <span className="rec-timer">{timer}</span>
      </div>
    </section>
  );
}
