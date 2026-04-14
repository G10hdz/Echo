"""SQLite database manager for Echo"""

import sqlite3
from pathlib import Path
from datetime import datetime, date
from typing import List, Dict, Optional
from contextlib import contextmanager


DATABASE_PATH = Path("echo.db")


class DatabaseManager:
    """Manages Echo SQLite database operations"""

    def __init__(self, db_path: Path = DATABASE_PATH):
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def get_connection(self):
        """Get database connection context manager"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self):
        """Initialize database schema"""
        with self.get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id TEXT UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_active DATETIME
                );

                CREATE TABLE IF NOT EXISTS practice_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    target_sentence TEXT NOT NULL,
                    actual_transcription TEXT,
                    score INTEGER,
                    grade TEXT,
                    flagged_words TEXT,
                    language TEXT DEFAULT 'en',
                    level TEXT DEFAULT 'A1',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS user_progress (
                    user_id TEXT PRIMARY KEY,
                    level TEXT DEFAULT 'A1',
                    total_sessions INTEGER DEFAULT 0,
                    avg_score REAL DEFAULT 0.0,
                    streak_days INTEGER DEFAULT 0,
                    total_words_practiced INTEGER DEFAULT 0,
                    last_practice DATE
                );

                CREATE TABLE IF NOT EXISTS sentence_library (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    language TEXT DEFAULT 'en',
                    level TEXT DEFAULT 'A1',
                    topic TEXT,
                    times_practiced INTEGER DEFAULT 0,
                    avg_difficulty REAL DEFAULT 1.0
                );

                CREATE INDEX IF NOT EXISTS idx_sessions_user ON practice_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON practice_sessions(timestamp);
                CREATE INDEX IF NOT EXISTS idx_sentences_level ON sentence_library(level, language);
            """)

        # Seed sentence library if empty
        self._seed_sentences()

    def _seed_sentences(self):
        """Add practice sentences to library"""
        with self.get_connection() as conn:
            count = conn.execute("SELECT COUNT(*) FROM sentence_library").fetchone()[0]

            if count == 0:
                sentences = [
                    # A1 English
                    ("The weather is beautiful today", "en", "A1", "weather"),
                    ("I would like a cup of coffee", "en", "A1", "food"),
                    ("Where is the nearest station", "en", "A1", "travel"),
                    ("She goes to school every day", "en", "A1", "daily"),
                    ("The cat is sleeping on the sofa", "en", "A1", "home"),

                    # A2 English
                    ("Could you please repeat that again", "en", "A2", "conversation"),
                    ("I have been learning English for two years", "en", "A2", "education"),
                    ("The meeting starts at nine o'clock", "en", "A2", "work"),
                    ("He decided to change his career path", "en", "A2", "life"),
                    ("They arrived before the movie started", "en", "A2", "entertainment"),

                    # B1 English
                    ("The comfortable chair was near the door", "en", "B1", "home"),
                    ("She emphasized the importance of teamwork", "en", "B1", "work"),
                    ("The restaurant serves delicious pasta", "en", "B1", "food"),
                    ("I apologize for the inconvenience caused", "en", "B1", "polite"),
                    ("Technology has transformed education significantly", "en", "B1", "tech"),

                    # B2 English
                    ("The implementation requires careful consideration", "en", "B2", "academic"),
                    ("Entrepreneurship demands both creativity and resilience", "en", "B2", "business"),
                    ("The pharmaceutical industry faces regulatory challenges", "en", "B2", "health"),
                    ("Sustainable development balances growth with conservation", "en", "B2", "environment"),
                    ("The architectural design reflects cultural heritage", "en", "B2", "culture"),

                    # A1 Spanish
                    ("Buenos días cómo estás", "es", "A1", "greeting"),
                    ("Me llamo Juan y soy de México", "es", "A1", "intro"),
                    ("La casa es muy grande y bonita", "es", "A1", "home"),
                    ("Quiero comer una manzana roja", "es", "A1", "food"),
                    ("El gato duerme en el sofá", "es", "A1", "animals"),
                ]

                conn.executemany(
                    "INSERT INTO sentence_library (text, language, level, topic) VALUES (?, ?, ?, ?)",
                    sentences
                )

    def create_session(
        self,
        user_id: str,
        target_sentence: str,
        language: str = "en",
        level: str = "A1"
    ) -> PracticeSession:
        """Create a new practice session"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                """INSERT INTO practice_sessions
                   (user_id, target_sentence, language, level)
                   VALUES (?, ?, ?, ?)""",
                (user_id, target_sentence, language, level)
            )

            # Update user activity
            conn.execute(
                """INSERT OR IGNORE INTO user_progress (user_id) VALUES (?)""",
                (user_id,)
            )
            conn.execute(
                """UPDATE user_progress SET last_active = ? WHERE user_id = ?""",
                (datetime.now(), user_id)
            )

            return PracticeSession(
                id=cursor.lastrowid,
                user_id=user_id,
                target_sentence=target_sentence,
                language=language,
                level=level
            )

    def complete_session(
        self,
        session_id: int,
        score: int,
        grade: str,
        transcription: str,
        flagged_words: str = ""
    ):
        """Complete a practice session and update progress"""
        with self.get_connection() as conn:
            # Update session
            conn.execute(
                """UPDATE practice_sessions
                   SET actual_transcription = ?, score = ?, grade = ?, flagged_words = ?
                   WHERE id = ?""",
                (transcription, score, grade, flagged_words, session_id)
            )

            # Get user_id from session
            session = conn.execute(
                "SELECT user_id, target_sentence FROM practice_sessions WHERE id = ?",
                (session_id,)
            ).fetchone()

            if session:
                user_id = session["user_id"]
                target = session["target_sentence"]

                # Update user progress
                conn.execute(
                    """UPDATE user_progress
                       SET total_sessions = total_sessions + 1,
                           total_words_practiced = total_words_practiced + ?,
                           last_practice = ?
                       WHERE user_id = ?""",
                    (len(target.split()), date.today(), user_id)
                )

                # Recalculate average score
                avg = conn.execute(
                    "SELECT AVG(score) FROM practice_sessions WHERE user_id = ?",
                    (user_id,)
                ).fetchone()[0]

                conn.execute(
                    "UPDATE user_progress SET avg_score = ? WHERE user_id = ?",
                    (avg or 0.0, user_id)
                )

                # Update sentence practice count
                conn.execute(
                    """UPDATE sentence_library
                       SET times_practiced = times_practiced + 1
                       WHERE text = ?""",
                    (target,)
                )

    def get_user_progress(self, user_id: str) -> Dict:
        """Get user progress statistics"""
        with self.get_connection() as conn:
            progress = conn.execute(
                "SELECT * FROM user_progress WHERE user_id = ?",
                (user_id,)
            ).fetchone()

            if not progress:
                return {
                    "user_id": user_id,
                    "level": "A1",
                    "total_sessions": 0,
                    "avg_score": 0.0,
                    "streak_days": 0,
                    "total_words_practiced": 0,
                    "last_practice": None,
                    "recent_sessions": []
                }

            # Get recent sessions
            sessions = conn.execute(
                """SELECT target_sentence, score, grade, timestamp
                   FROM practice_sessions
                   WHERE user_id = ?
                   ORDER BY timestamp DESC
                   LIMIT 10""",
                (user_id,)
            ).fetchall()

            return {
                "user_id": user_id,
                "level": progress["level"],
                "total_sessions": progress["total_sessions"],
                "avg_score": progress["avg_score"],
                "streak_days": progress["streak_days"],
                "total_words_practiced": progress["total_words_practiced"],
                "last_practice": progress["last_practice"],
                "recent_sessions": [dict(s) for s in sessions]
            }

    def get_sentences(
        self,
        level: str = "A1",
        language: str = "en",
        limit: int = 10
    ) -> List[Dict]:
        """Get practice sentences by level and language"""
        with self.get_connection() as conn:
            sentences = conn.execute(
                """SELECT * FROM sentence_library
                   WHERE level = ? AND language = ?
                   ORDER BY RANDOM()
                   LIMIT ?""",
                (level, language, limit)
            ).fetchall()

            return [dict(s) for s in sentences]
