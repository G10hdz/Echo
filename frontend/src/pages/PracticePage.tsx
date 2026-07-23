import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMicrophone } from '../hooks/useMicrophone';
import { SentenceCard } from '../components/SentenceCard';
import { MicRecorder } from '../components/MicRecorder';
import { ScoreDisplay } from '../components/ScoreDisplay';
import * as api from '../services/api';
import type { ScoreResponse, SentenceRecord } from '../types';
import { Loader2, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

export function PracticePage() {
  const navigate = useNavigate();
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
    analyserRef,
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
      if (result.score) {
        navigate('/results', {
          state: {
            score: result.score,
            sentence: currentSentence.text,
          },
        });
        return;
      }
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

  const handleReset = () => {
    setScore(null);
    setTtsUrl(null);
    resetRecording();
    setError(null);
  };

  /* ------------------------------------------------------------------ */
  /*  Loading skeleton                                                    */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="space-y-6">
          <div className="card">
            <div className="skeleton" style={{ height: '2rem', width: '60%', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: '3rem', width: '100%' }} />
          </div>
          <div className="card">
            <div className="skeleton" style={{ height: '200px', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="toast-error mb-6 flex items-center gap-3 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertTriangle size={20} aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-sm font-medium underline"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="contents">
        {/* Sentence prompt */}
        <AnimatePresence mode="wait">
          {currentSentence && (
            <motion.div
              key={currentSentence.id || currentSentence.text}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <SentenceCard
                text={currentSentence.text}
                level={level}
                language={language}
                onPlayTTS={ttsUrl ? handlePlayTTS : undefined}
                onNewSentence={loadSentence}
                isPlaying={playingTTS}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording area */}
        <motion.div
          className="contents"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <MicRecorder
            isRecording={isRecording}
            duration={duration}
            audioBlob={audioBlob}
            waveformRef={waveformRef}
            analyserRef={analyserRef}
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

          {/* Analyze button */}
          <AnimatePresence>
            {audioBlob && !score && (
              <motion.div
                className="w-full pb-6 -mt-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ delay: 0.1 }}
              >
                <motion.button
                  onClick={handleProcessRecording}
                  disabled={processing}
                className="analyze-btn"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Analyze your pronunciation"
                >
                  {processing ? (
                    <>
                      <Loader2 size={22} className="animate-spin" aria-hidden="true" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={22} aria-hidden="true" />
                      Analyze My Pronunciation
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {score ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
            >
              <ScoreDisplay
                overallScore={score.overall_score}
                grade={score.grade}
                words={score.words}
                flagged={score.flagged}
                onRetry={handleRetryWord}
              />

              <motion.button
                onClick={handleReset}
                className="btn-secondary w-full flex items-center justify-center gap-2 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Try a new sentence"
              >
                <RotateCcw size={18} aria-hidden="true" />
                Try New Sentence
              </motion.button>
            </motion.div>
          ) : (
            !audioBlob && (
              <motion.div
                key="empty"
                className="practice-chips py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="practice-chip">Ready to record</span>
                <span className="practice-chip">Read the sentence, then analyze</span>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
