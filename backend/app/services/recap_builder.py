"""Build a daily recap from yesterday's study/quiz/project data using Haiku."""
from datetime import date, timedelta
from pathlib import Path
from typing import NamedTuple

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import DailyRecap, ProjectLog, QuizAttempt, StudySession, SyllabusItem
from app.services.llm import call_with_json_retry

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "recap_builder.txt").read_text()


class RecapData(BaseModel):
    summary: str
    weak_topics: list[str]
    recall_questions: list[str]


async def build_recap(db: AsyncSession, target_date: date | None = None) -> DailyRecap:
    """
    Build recap for `target_date` (default: today) from the previous day's data.
    Upserts the DailyRecap row so calling this twice is safe.
    """
    if target_date is None:
        target_date = date.today()
    yesterday = target_date - timedelta(days=1)

    # ── Gather yesterday's data ───────────────────────────────────────────────

    sessions_result = await db.execute(
        select(StudySession).where(StudySession.date == yesterday)
    )
    sessions = sessions_result.scalars().all()

    syllabus_titles: list[str] = []
    notes_snippets: list[str] = []
    for s in sessions:
        if s.syllabus_item_id:
            syl = await db.get(SyllabusItem, s.syllabus_item_id)
            if syl:
                syllabus_titles.append(syl.title)
        if s.notes:
            notes_snippets.append(s.notes[:800])

    quiz_result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.date == yesterday)
    )
    quiz_attempts = quiz_result.scalars().all()
    quiz_summary = (
        f"Quiz score: {quiz_attempts[-1].score * 100:.0f}%"
        if quiz_attempts and quiz_attempts[-1].score is not None
        else "No quiz taken"
    )

    log_result = await db.execute(
        select(ProjectLog).where(ProjectLog.date == yesterday)
    )
    project_log = log_result.scalar_one_or_none()
    log_summary = (
        f"Built: {project_log.built[:200]}" if project_log and project_log.built else "No project log"
    )

    # ── Build prompt context ──────────────────────────────────────────────────

    if not syllabus_titles and not notes_snippets:
        # First day / no data — generate a motivational Day 1 recap
        user_prompt = (
            "The learner has just started PrepLoop today. "
            "No study data exists yet. Generate an encouraging Day 1 recap "
            "with 3 warm-up recall questions about system design fundamentals."
        )
    else:
        user_prompt = (
            f"Topics studied: {', '.join(syllabus_titles) or 'none'}\n"
            f"{quiz_summary}\n"
            f"{log_summary}\n\n"
            f"Notes excerpt:\n{notes_snippets[0] if notes_snippets else 'No notes taken'}"
        )

    # ── Call Haiku ────────────────────────────────────────────────────────────

    raw = call_with_json_retry(system=_SYSTEM, user=user_prompt, model=settings.HAIKU_MODEL, max_tokens=768)
    recap_data = RecapData.model_validate(raw)

    # Ensure exactly 3 recall questions
    qs = recap_data.recall_questions[:3]
    while len(qs) < 3:
        qs.append("What is one key concept you learned yesterday?")
    recap_data.recall_questions = qs

    # ── Upsert DailyRecap ─────────────────────────────────────────────────────

    existing = await db.execute(select(DailyRecap).where(DailyRecap.date == target_date))
    recap = existing.scalar_one_or_none()

    stored = {
        "summary": recap_data.summary,
        "topics": recap_data.weak_topics,
        "recall_questions": recap_data.recall_questions,
    }

    if recap:
        recap.content = recap_data.summary
        recap.weak_topics = stored
    else:
        recap = DailyRecap(date=target_date, content=recap_data.summary, weak_topics=stored)
        db.add(recap)

    await db.commit()
    await db.refresh(recap)
    return recap
