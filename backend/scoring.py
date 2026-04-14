"""Pronunciation scoring engine using Levenshtein distance"""

from typing import Dict, List
from Levenshtein import ratio


class EchoScorer:
    """Scores pronunciation accuracy by comparing expected vs actual text"""

    def __init__(self):
        pass

    def score(self, expected: str, actual: str) -> Dict:
        """
        Score pronunciation at word level
        Returns: {
            "overall_score": int (0-100),
            "grade": str (A-F),
            "words": [{"word": str, "status": str, "said": str}],
            "flagged": [{"word": str, "status": str, "said": str}]
        }
        """
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
                    status = "correct"  # 🟢
                elif sim >= 0.6:
                    status = "partial"  # 🟠
                else:
                    status = "incorrect"  # 🔴

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
                # Expected word was missed
                word_result = {
                    "word": exp_words[i],
                    "status": "missed",
                    "confidence": 0.0,
                    "said": None
                }
                words.append(word_result)
                flagged.append(word_result)

            else:
                # Extra word in actual (not in expected)
                word_result = {
                    "word": f"+{act_words[i]}",
                    "status": "extra",
                    "confidence": 0.0,
                    "said": act_words[i]
                }
                words.append(word_result)

        # Calculate grade
        grade = self._calculate_grade(accuracy)

        # Convert to 0-100 scale
        overall_score = int(accuracy * 100)

        return {
            "overall_score": overall_score,
            "grade": grade,
            "words": words,
            "flagged": flagged
        }

    def _calculate_grade(self, accuracy: float) -> str:
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
