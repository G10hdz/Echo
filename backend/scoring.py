"""Pronunciation scoring engine using Levenshtein distance"""

import re
from typing import Dict, List
from Levenshtein import ratio


CJK_RANGE = re.compile(r'[\u4e00-\u9fff]')


def _is_cjk(text: str) -> bool:
    return bool(CJK_RANGE.search(text))


def _segment_cjk(text: str) -> List[str]:
    """Segment CJK text into individual characters + non-CJK tokens."""
    segments: List[str] = []
    buf = ""
    for ch in text:
        if CJK_RANGE.match(ch):
            if buf:
                segments.append(buf)
                buf = ""
            segments.append(ch)
        elif ch.isspace():
            if buf:
                segments.append(buf)
                buf = ""
        else:
            buf += ch
    if buf:
        segments.append(buf)
    return segments


def _score_cjk(expected: str, actual: str) -> Dict:
    """Score Mandarin Chinese pronunciation at character level."""
    exp_chars = _segment_cjk(expected.lower())
    act_chars = _segment_cjk(actual.lower())

    words = []
    flagged = []
    max_len = max(len(exp_chars), len(act_chars))

    for i in range(max_len):
        if i < len(exp_chars) and i < len(act_chars):
            exp_ch = exp_chars[i]
            act_ch = act_chars[i]

            if exp_ch == act_ch:
                status = "correct"
                sim = 1.0
            elif len(exp_ch) == 1 and CJK_RANGE.match(exp_ch):
                sim = ratio(exp_ch, act_ch) if len(act_ch) == 1 else 0.0
                status = "correct" if sim >= 0.85 else ("partial" if sim >= 0.6 else "incorrect")
            else:
                sim = ratio(exp_ch, act_ch)
                status = "correct" if sim >= 0.85 else ("partial" if sim >= 0.6 else "incorrect")

            word_result = {
                "word": exp_ch,
                "status": status,
                "confidence": round(sim, 2),
                "said": act_ch if act_ch != exp_ch else None,
            }
            words.append(word_result)
            if status != "correct":
                flagged.append(word_result)

        elif i < len(exp_chars):
            word_result = {
                "word": exp_chars[i],
                "status": "missed",
                "confidence": 0.0,
                "said": None,
            }
            words.append(word_result)
            flagged.append(word_result)
        else:
            word_result = {
                "word": f"+{act_chars[i]}",
                "status": "extra",
                "confidence": 0.0,
                "said": act_chars[i],
            }
            words.append(word_result)

    exp_joined = "".join(exp_chars)
    act_joined = "".join(act_chars)
    overall_sim = ratio(exp_joined, act_joined) if exp_joined and act_joined else 0.0
    overall_score = int(overall_sim * 100)
    grade = EchoScorer._calculate_grade(overall_sim)

    return {
        "overall_score": overall_score,
        "grade": grade,
        "words": words,
        "flagged": flagged,
    }


class EchoScorer:
    """Scores pronunciation accuracy by comparing expected vs actual text"""

    def __init__(self):
        pass

    def score(self, expected: str, actual: str, language: str = "en") -> Dict:
        """
        Score pronunciation at word level (latin) or character level (CJK).
        Returns: {
            "overall_score": int (0-100),
            "grade": str (A-F),
            "words": [{"word": str, "status": str, "said": str}],
            "flagged": [{"word": str, "status": str, "said": str}]
        }
        """
        if language == "zh" and _is_cjk(expected):
            return _score_cjk(expected, actual)

        exp_words = expected.lower().split()
        act_words = actual.lower().split()

        # Overall accuracy
        accuracy = ratio(expected.lower(), actual.lower())

        # Word-by-word matching
        words = []
        flagged = []

        max_len = max(len(exp_words), len(act_words))

        for i in range(max_len):
            if i < len(exp_words) and i < len(act_words):
                exp_word = exp_words[i]
                act_word = act_words[i]

                sim = ratio(exp_word, act_word)

                if sim >= 0.85:
                    status = "correct"
                elif sim >= 0.6:
                    status = "partial"
                else:
                    status = "incorrect"

                word_result = {
                    "word": exp_word,
                    "status": status,
                    "confidence": round(sim, 2),
                    "said": act_word if act_word != exp_word else None
                }
                words.append(word_result)

                if status != "correct":
                    flagged.append(word_result)

            elif i < len(exp_words):
                word_result = {
                    "word": exp_words[i],
                    "status": "missed",
                    "confidence": 0.0,
                    "said": None
                }
                words.append(word_result)
                flagged.append(word_result)

            else:
                word_result = {
                    "word": f"+{act_words[i]}",
                    "status": "extra",
                    "confidence": 0.0,
                    "said": act_words[i]
                }
                words.append(word_result)

        grade = self._calculate_grade(accuracy)

        # Convert to 0-100 scale
        overall_score = int(accuracy * 100)

        return {
            "overall_score": overall_score,
            "grade": grade,
            "words": words,
            "flagged": flagged
        }

    @staticmethod
    def _calculate_grade(accuracy: float) -> str:
        """Convert accuracy to letter grade"""
        if accuracy >= 0.95:
            return "A+"
        elif accuracy >= 0.90:
            return "A"
        elif accuracy >= 0.85:
            return "B+"
        elif accuracy >= 0.75:
            return "B"
        elif accuracy >= 0.65:
            return "C"
        elif accuracy >= 0.50:
            return "D"
        else:
            return "F"
