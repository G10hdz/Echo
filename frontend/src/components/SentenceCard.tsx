import { RefreshCw, Volume2 } from 'lucide-react';

interface SentenceCardProps {
  text: string;
  level: string;
  language: string;
  onPlayTTS?: () => void;
  onNewSentence?: () => void;
  isPlaying?: boolean;
}

const languageLabels: Record<string, string> = { en: 'English', es: 'Español', zh: '中文' };

export function SentenceCard({ text, level, language, onPlayTTS, onNewSentence, isPlaying }: SentenceCardProps) {
  return (
    <section className="practice-prompt" aria-labelledby="target-sentence">
      <div className="prompt-meta">
        <span className="prompt-pill">{level} · {languageLabels[language] ?? language}</span>
      </div>
      <p id="target-sentence" className="prompt-sentence">{text}</p>
      <div className="prompt-actions">
        <button className="prompt-action" onClick={onPlayTTS} disabled={!onPlayTTS || isPlaying}>
          <Volume2 size={15} aria-hidden="true" />{isPlaying ? 'Playing' : 'Listen'}
        </button>
        <button className="prompt-action" onClick={onNewSentence} disabled={!onNewSentence}>
          <RefreshCw size={15} aria-hidden="true" />New sentence
        </button>
      </div>
    </section>
  );
}
