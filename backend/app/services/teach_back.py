"""Critique a learner's teach-back explanation like a senior interviewer."""
from pathlib import Path
from pydantic import BaseModel

from app.core.config import settings
from app.services.llm import call_with_json_retry

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "teach_back.txt").read_text()


class TeachBackResult(BaseModel):
    critique: str
    follow_up_questions: list[str]  # always 2


def critique_teach_back(topic: str, explanation: str) -> TeachBackResult:
    user = f"Topic: {topic}\n\nCandidate's explanation:\n{explanation}"
    raw = call_with_json_retry(
        system=_SYSTEM,
        user=user,
        model=settings.SONNET_MODEL,
        max_tokens=1024,
    )
    result = TeachBackResult.model_validate(raw)
    # Guarantee exactly 2 follow-ups even if the model returns more/fewer
    result.follow_up_questions = result.follow_up_questions[:2]
    while len(result.follow_up_questions) < 2:
        result.follow_up_questions.append("Can you elaborate on how you would handle failures?")
    return result
