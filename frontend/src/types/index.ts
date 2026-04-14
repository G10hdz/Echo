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
