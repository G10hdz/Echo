import { useState, useEffect, useCallback } from 'react';
import { useMicrophone } from '../hooks/useMicrophone';
import { SentenceCard } from '../components/SentenceCard';
import { MicRecorder } from '../components/MicRecorder';
import { ScoreDisplay } from '../components/ScoreDisplay';
import * as api from '../services/api';
import type { ScoreResponse, SentenceRecord } from '../types';
import { Mic, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

export function PracticePage() {
  const [currentSentence, setCurrentSentence] = useState<SentenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);
  const [playingTTS, setPlayingTTS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    waveformRef,
    startRecording,
    stopRecording,
    resetRecording,
  } = useMicrophone();

  const userId = 'web-user-001';
  const level = 'A1';
  const language = 'en';

  const loadSentence = useCallback(async () => {
    setLoading(true);
    setError(null);
    setScore(null);
    setTtsUrl(null);
    try {
      const response = await api.getSentences(level, language, 1);
      if (response.sentences.length > 0) {
        setCurrentSentence(response.sentences[0]);
      }
    } catch (err) {
      setError('Failed to load a practice sentence. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [level, language]);

  useEffect(() => {
    loadSentence();
  }, [loadSentence]);

  const handleProcessRecording = async () => {
    if (!audioBlob || !currentSentence) return;

    setProcessing(true);
    setError(null);
    try {
      const result = await api.analyzePronunciation(
        audioBlob,
        currentSentence.text,
        userId,
        language,
        level
      );
      if (result.score) setScore(result.score);
      if (result.tts_url) setTtsUrl(api.mediaUrl(result.tts_url));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Processing failed. Please try recording again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePlayTTS = () => {
    if (ttsUrl) {
      setPlayingTTS(true);
      const audio = new Audio(ttsUrl);
      audio.onended = () => setPlayingTTS(false);
      audio.onerror = () => {
        setPlayingTTS(false);
        setError('Audio playback failed.');
      };
      audio.play();
    }
  };

  const handleRetryWord = async (word: string) => {
    setCurrentSentence((prev) =>
      prev ? { ...prev, text: word } : prev
    );
    setScore(null);
    setTtsUrl(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <div className="skeleton" style={{ height: '2rem', width: '60%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '3rem', width: '100%' }} />
            </div>
            <div className="card">
              <div className="skeleton" style={{ height: '200px', width: '100%' }} />
            </div>
          </div>
          <div className="card flex items-center justify-center" style={{ minHeight: '24rem' }}>
            <p style={{ color: 'var(--on-surface-variant)' }}>Preparing your practice session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {error && (
        <div
          className="toast-error mb-6 flex items-center gap-3 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle size={20} aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-sm font-medium underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          {currentSentence && (
            <SentenceCard
              text={currentSentence.text}
              level={level}
              language={language}
              onPlayTTS={ttsUrl ? handlePlayTTS : undefined}
              onNewSentence={loadSentence}
              isPlaying={playingTTS}
            />
          )}

          <MicRecorder
            isRecording={isRecording}
            duration={duration}
            audioBlob={audioBlob}
            waveformRef={waveformRef}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onResetRecording={resetRecording}
            onPlayback={() => {
              if (audioBlob) {
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audio.play();
              }
            }}
          />

          {audioBlob && !score && (
            <button
              onClick={handleProcessRecording}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              aria-label="Analyze your pronunciation"
            >
              {processing ? (
                <>
                  <Loader2 size={24} className="animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic size={24} aria-hidden="true" />
                  Analyze My Pronunciation
                </>
              )}
            </button>
          )}

          {score && (
            <button
              onClick={() => {
                setScore(null);
                setTtsUrl(null);
                resetRecording();
                setError(null);
              }}
              className="btn-secondary w-full flex items-center justify-center gap-2"
              aria-label="Try a new sentence"
            >
              <RotateCcw size={18} aria-hidden="true" />
              Try New Sentence
            </button>
          )}
        </div>

        <div>
          {score ? (
            <ScoreDisplay
              overallScore={score.overall_score}
              grade={score.grade}
              words={score.words}
              flagged={score.flagged}
              onRetry={handleRetryWord}
            />
          ) : (
            <div
              className="card flex items-center justify-center"
              style={{ minHeight: '24rem' }}
            >
              <div className="text-center" style={{ color: 'var(--on-surface-variant)' }}>
                <Mic size={64} className="mx-auto mb-4 opacity-30" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">
                  Record your voice to see your score
                </p>
                <p className="text-sm" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                  Click "Start Recording" and read the sentence aloud
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}