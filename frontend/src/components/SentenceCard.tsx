import { Volume2, RefreshCw } from 'lucide-react';

interface SentenceCardProps {
  text: string;
  level: string;
  language: string;
  onPlayTTS?: () => void;
  onNewSentence?: () => void;
  isPlaying?: boolean;
}

const languageLabels: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Chinese',
  fr: 'French',
};

export function SentenceCard({
  text,
  level,
  language,
  onPlayTTS,
  onNewSentence,
  isPlaying,
}: SentenceCardProps) {
  return (
    <div
      className="card"
      role="region"
      aria-label="Practice sentence"
    >
      {/* Header with Level Badge */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: 'var(--accent-container)',
              color: 'var(--on-accent-container)',
            }}
            aria-label={`Difficulty level ${level}`}
          >
            Level {level}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs"
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface-variant)',
            }}
            aria-label={`Language: ${languageLabels[language] || language}`}
          >
            {languageLabels[language] || language}
          </span>
        </div>

        <button
          onClick={onNewSentence}
          className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
          aria-label="Get a new sentence"
          style={{ minHeight: 'var(--touch-target-small)' }}
        >
          <RefreshCw size={14} aria-hidden="true" />
          New sentence
        </button>
        </div>

      {/* Target Sentence Text */}
      <div className="mb-6">
        <p
          className="text-xs uppercase tracking-widest mb-2 font-medium"
          style={{
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Read this aloud
        </p>
        <p
          className="text-2xl md:text-3xl leading-relaxed"
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
          className="btn-primary flex items-center justify-center gap-2 w-full"
          disabled={isPlaying}
          aria-label={isPlaying ? 'Playing correct pronunciation' : 'Listen to correct pronunciation'}
        >
          <Volume2 size={18} aria-hidden="true" />
          {isPlaying ? 'Playing...' : 'Listen to Correct Pronunciation'}
        </button>
      )}
    </div>
  );
}