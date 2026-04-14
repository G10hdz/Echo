// Sentence card component showing target text

import { Volume2, RefreshCw } from 'lucide-react';

interface SentenceCardProps {
  text: string;
  level: string;
  language: string;
  onPlayTTS?: () => void;
  onNewSentence?: () => void;
  isPlaying?: boolean;
}

export function SentenceCard({
  text,
  level,
  language,
  onPlayTTS,
  onNewSentence,
  isPlaying,
}: SentenceCardProps) {
  const languageLabels: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    zh: 'Chinese',
  };

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
      }}
    >
      {/* Header with Level Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: 'var(--primary-fixed)',
              color: 'var(--on-primary-container)',
            }}
          >
            Level {level}
          </span>
          <span
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface-variant)',
            }}
          >
            {languageLabels[language] || language}
          </span>
        </div>

        <button
          onClick={onNewSentence}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={16} />
          New Sentence
        </button>
      </div>

      {/* Target Sentence Text */}
      <div className="mb-8">
        <p
          className="text-sm uppercase tracking-wide mb-2"
          style={{
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-headline)',
            fontWeight: 600,
          }}
        >
          Read this aloud:
        </p>
        <p
          className="text-3xl leading-relaxed"
          style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 700,
            color: 'var(--on-surface)',
          }}
        >
          {text}
        </p>
      </div>

      {/* TTS Playback Button */}
      {onPlayTTS && (
        <button
          onClick={onPlayTTS}
          className="btn-primary flex items-center gap-2 w-full justify-center"
          disabled={isPlaying}
        >
          <Volume2 size={20} />
          {isPlaying ? 'Playing...' : 'Listen to Correct Pronunciation'}
        </button>
      )}
    </div>
  );
}
