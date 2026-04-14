// Echo API service

import type {
  TranscribeResponse,
  ScoreRequest,
  ScoreResponse,
  TTSRequest,
  TTSResponse,
  ProgressResponse,
  SentenceRecord,
} from '../types';

const API_BASE = '/api';

export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }

  return response.json();
}

export async function scorePronunciation(request: ScoreRequest): Promise<ScoreResponse> {
  const response = await fetch(`${API_BASE}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Scoring failed: ${response.statusText}`);
  }

  return response.json();
}

export async function generateTTS(request: TTSRequest): Promise<TTSResponse> {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`TTS generation failed: ${response.statusText}`);
  }

  return response.json();
}

export async function startPracticeSession(
  userId: string,
  targetSentence: string,
  language = 'en',
  level = 'A1'
): Promise<{ session_id: number; target: string }> {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('target_sentence', targetSentence);
  formData.append('language', language);
  formData.append('level', level);

  const response = await fetch(`${API_BASE}/practice/start`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to start session: ${response.statusText}`);
  }

  return response.json();
}

export async function completePracticeSession(
  sessionId: number,
  score: number,
  grade: string,
  transcription: string,
  flaggedWords = ''
): Promise<{ status: string; message: string }> {
  const formData = new FormData();
  formData.append('session_id', sessionId.toString());
  formData.append('score', score.toString());
  formData.append('grade', grade);
  formData.append('transcription', transcription);
  formData.append('flagged_words', flaggedWords);

  const response = await fetch(`${API_BASE}/practice/complete`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to complete session: ${response.statusText}`);
  }

  return response.json();
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE}/progress/${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to get progress: ${response.statusText}`);
  }

  return response.json();
}

export async function getSentences(
  level = 'A1',
  language = 'en',
  limit = 10
): Promise<{ sentences: SentenceRecord[] }> {
  const params = new URLSearchParams({ level, language, limit: limit.toString() });
  const response = await fetch(`${API_BASE}/sentences?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to get sentences: ${response.statusText}`);
  }

  return response.json();
}
