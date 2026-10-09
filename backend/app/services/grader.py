"""Grade open/short/design answers against a reference using Haiku."""
from pathlib import Path
from pydantic import BaseModel

from app.core.config import settings
from app.services.llm import call_with_json_retry

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "grader.txt").read_text()


class GradeResult(BaseModel):
    score: int       # 0–10
    feedback: str


def grade_answer(question_prompt: str, reference_answer: str, user_answer: str) -> GradeResult:
    user = (
        f"Question: {question_prompt}\n\n"
        f"Reference answer: {reference_answer}\n\n"
        f"Candidate's answer: {user_answer}"
    )
    raw = call_with_json_retry(
        system=_SYSTEM,
        user=user,
        model=settings.HAIKU_MODEL,
        max_tokens=512,
    )
    return GradeResult.model_validate(raw)
