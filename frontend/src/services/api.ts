// Echo API service with error handling and retry logic

import type {
  TranscribeResponse,
  ScoreRequest,
  ScoreResponse,
  TTSRequest,
  TTSResponse,
  ProgressResponse,
  SentenceRecord,
  AppSettings,
} from '../types';

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');
export const API_BASE = `${API_ORIGIN}/api`;

/** Resolve `/audio/...` or absolute URLs for <audio> / fetch when API is on another origin. */
export function mediaUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path}`;
}

/** Custom error class for API errors */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Retry failed requests with exponential backoff */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');

      // Don't retry on abort
      if (lastError.name === 'AbortError') {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed');
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const response = await fetchWithRetry(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `Transcription failed: ${error || response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function scorePronunciation(request: ScoreRequest): Promise<ScoreResponse> {
  const response = await fetchWithRetry(`${API_BASE}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `Scoring failed: ${error || response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function generateTTS(request: TTSRequest): Promise<TTSResponse> {
  const response = await fetchWithRetry(`${API_BASE}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `TTS generation failed: ${error || response.statusText}`,
      response.status
    );
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

  const response = await fetchWithRetry(`${API_BASE}/practice/start`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `Failed to start session: ${error || response.statusText}`,
      response.status
    );
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

  const response = await fetchWithRetry(`${API_BASE}/practice/complete`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `Failed to complete session: ${error || response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const response = await fetchWithRetry(`${API_BASE}/progress/${userId}`, {});

  if (!response.ok) {
    throw new ApiError(
      `Failed to get progress: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function getSentences(
  level = 'A1',
  language = 'en',
  limit = 10
): Promise<{ sentences: SentenceRecord[] }> {
  const params = new URLSearchParams({ level, language, limit: limit.toString() });
  const response = await fetchWithRetry(`${API_BASE}/sentences?${params}`, {});

  if (!response.ok) {
    throw new ApiError(
      `Failed to get sentences: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}
export interface AnalyzeResponse {
  session_id: number;
  transcription: string;
  words: Array<{ word: string; start?: number; end?: number; confidence?: number }>;
  language: string;
  score: ScoreResponse | null;
  tts_url: string | null;
}

export async function analyzePronunciation(
  audioBlob: Blob,
  expectedText: string,
  userId = 'web-user-001',
  language = 'en',
  level = 'A1'
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('expected_text', expectedText);
  formData.append('user_id', userId);
  formData.append('language', language);
  formData.append('level', level);

  const response = await fetchWithRetry(`${API_BASE}/practice/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `Analysis failed: ${error || response.statusText}`,
      response.status
    );
  }

  return response.json();
}

const STORAGE_KEY = 'echo_settings';

/** Load settings from localStorage (client-side only) */
export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        language: isValidLanguage(parsed.language) ? parsed.language : 'en',
        level: isValidLevel(parsed.level) ? parsed.level : 'A1',
        voiceId: parsed.voiceId || '',
        darkMode: parsed.darkMode || false,
      };
    }
  } catch {
    // Fall through to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

/** Persist settings to localStorage */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

