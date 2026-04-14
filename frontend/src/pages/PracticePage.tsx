// Main practice page

import { useState, useEffect } from 'react';
import { useMicrophone } from '../hooks/useMicrophone';
import { SentenceCard } from '../components/SentenceCard';
import { MicRecorder } from '../components/MicRecorder';
import { ScoreDisplay } from '../components/ScoreDisplay';
import * as api from '../services/api';
import type { ScoreResponse, SentenceRecord } from '../types';
import { Mic, Loader2 } from 'lucide-react';

export function PracticePage() {
  const [currentSentence, setCurrentSentence] = useState<SentenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);
  const [playingTTS, setPlayingTTS] = useState(false);

  const {
    isRecording,
    duration,
    audioBlob,
    waveformRef,
    startRecording,
    stopRecording,
    resetRecording,
  } = useMicrophone();

  const userId = 'web-user-001'; // TODO: Get from auth context
  const level = 'A1'; // TODO: Get from user settings
  const language = 'en'; // TODO: Get from user settings

  // Load initial sentence
  useEffect(() => {
    loadSentence();
  }, []);

  const loadSentence = async () => {
    setLoading(true);
    try {
      const response = await api.getSentences(level, language, 1);
      if (response.sentences.length > 0) {
        const sentence = response.sentences[0];
        setCurrentSentence(sentence);
        setScore(null);
        setTtsUrl(null);

        // Start practice session
        const session = await api.startPracticeSession(
          userId,
          sentence.text,
          language,
          level
        );
        setSessionId(session.session_id);
      }
    } catch (error) {
      console.error('Failed to load sentence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRecording = async () => {
    if (!audioBlob || !currentSentence || !sessionId) return;

    setProcessing(true);
    try {
      // Step 1: Transcribe audio
      const transcription = await api.transcribeAudio(audioBlob);

      // Step 2: Score pronunciation
      const scoreResult = await api.scorePronunciation({
        expected: currentSentence.text,
        actual: transcription.text,
      });
      setScore(scoreResult);

      // Step 3: Generate TTS for correct pronunciation
      const tts = await api.generateTTS({
        text: currentSentence.text,
        language,
      });
      setTtsUrl(tts.audio_url);

      // Step 4: Complete session
      const flaggedWords = scoreResult.flagged.map((w) => w.word).join(', ');
      await api.completePracticeSession(
        sessionId,
        scoreResult.overall_score,
        scoreResult.grade,
        transcription.text,
        flaggedWords
      );
    } catch (error) {
      console.error('Failed to process recording:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePlayTTS = () => {
    if (ttsUrl) {
      setPlayingTTS(true);
      const audio = new Audio(ttsUrl);
      audio.onended = () => setPlayingTTS(false);
      audio.play();
    }
  };

  const handleRetryWord = async (word: string) => {
    // TODO: Implement single word retry
    console.log('Retry word:', word);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Sentence + Recording */}
        <div className="space-y-8">
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

          {/* Process Button */}
          {audioBlob && !score && (
            <button
              onClick={handleProcessRecording}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              {processing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic size={24} />
                  Analyze My Pronunciation
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Score Display */}
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
              className="card flex items-center justify-center h-96"
              style={{
                backgroundColor: 'var(--surface-container-low)',
              }}
            >
              <div className="text-center" style={{ color: 'var(--on-surface-variant)' }}>
                <Mic size={64} className="mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">
                  Record your voice to see your score
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
