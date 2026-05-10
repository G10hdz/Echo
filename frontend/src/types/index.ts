// Echo API types

export interface WordScore {
  word: string;
  status: 'correct' | 'partial' | 'incorrect' | 'missed' | 'extra';
  confidence?: number;
  said?: string;
}

export interface TranscribeResponse {
  text: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language: string;
}

export interface ScoreRequest {
  expected: string;
  actual: string;
}

export interface ScoreResponse {
  overall_score: number;
  grade: string;
  words: WordScore[];
  flagged: WordScore[];
}

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
}

export interface TTSResponse {
  audio_url: string;
  text: string;
}

export interface PracticeSession {
  id?: number;
  user_id: string;
  target_sentence: string;
  actual_transcription?: string;
  score?: number;
  grade?: string;
  flagged_words?: string;
  language: string;
  level: string;
  timestamp?: string;
}

export interface ProgressResponse {
  user_id: string;
  level: string;
  total_sessions: number;
  avg_score: number;
  streak_days: number;
  total_words_practiced: number;
  last_practice?: string;
  recent_sessions: Array<{
    target_sentence: string;
    score: number;
    grade: string;
    timestamp: string;
  }>;
}

export interface SentenceRecord {
  id: number;
  text: string;
  language: string;
  level: string;
  topic?: string;
  times_practiced: number;
}

// ─── Settings Types ─────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'fr'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const SUPPORTED_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type LevelCode = typeof SUPPORTED_LEVELS[number];

export interface AppSettings {
  language: LanguageCode;
  level: LevelCode;
  voiceId: string;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  level: 'A1',
  voiceId: '',
  darkMode: false,
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Chinese',
  fr: 'French',
};

export function isValidLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
}

export function isValidLevel(code: string): code is LevelCode {
  return SUPPORTED_LEVELS.includes(code as LevelCode);
}