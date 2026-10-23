"""Dashboard today-status endpoint — one call for all phase data."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import (
    Answer, DailyRecap, ProjectLog, QuizAttempt, StudySession, SyllabusItem, TopicContent
)

router = APIRouter()

_START_DATE = date(2026, 10, 8)
VALID_TRACKS = {"sd1", "sd2", "ai"}


class TopicContentOut(BaseModel):
    summary: Optional[str] = None
    key_concepts: Optional[list] = None
    interview_questions: Optional[list] = None
    diagrams_to_know: Optional[list] = None
    common_mistakes: Optional[list] = None
    starter_notes: Optional[str] = None


class PhaseStudy(BaseModel):
    complete: bool
    topic_title: str
    topic_description: str
    day_no: int
    syllabus_item_id: int
    notes_preview: Optional[str] = None
    content: Optional[TopicContentOut] = None


class PhaseQuiz(BaseModel):
    locked: bool
    complete: bool
    last_score: Optional[float] = None
    attempt_id: Optional[int] = None


class PhaseBuild(BaseModel):
    locked: bool
    complete: bool
    log_preview: Optional[str] = None


class PhaseRecap(BaseModel):
    locked: bool
    complete: bool
    summary: Optional[str] = None


class DashboardToday(BaseModel):
    track: str
    study: PhaseStudy
    quiz: PhaseQuiz
    build: PhaseBuild
    recap: PhaseRecap


@router.get("/dashboard/today", response_model=DashboardToday)
async def get_dashboard_today(
    track: str = Query("sd1"),
    db: AsyncSession = Depends(get_db),
):
    if track not in VALID_TRACKS:
        track = "sd1"

    # ── Today's syllabus item ──────────────────────────────────────────────────
    items_result = await db.execute(
        select(SyllabusItem)
        .where(SyllabusItem.track == track)
        .order_by(SyllabusItem.day_no)
    )
    items = items_result.scalars().all()
    offset = (date.today() - _START_DATE).days
    today_item = items[offset % len(items)] if items else None

    # ── Study session ─────────────────────────────────────────────────────────
    study_session = None
    if today_item:
        sess_result = await db.execute(
            select(StudySession)
            .where(StudySession.date == date.today())
            .where(StudySession.syllabus_item_id == today_item.id)
        )
        study_session = sess_result.scalar_one_or_none()

    notes = (study_session.notes or "") if study_session else ""
    study_complete = bool(notes.strip())
    notes_preview = notes[:200].strip() if notes.strip() else None

    # ── Topic content ─────────────────────────────────────────────────────────
    topic_content = None
    if today_item:
        tc_result = await db.execute(
            select(TopicContent).where(TopicContent.syllabus_item_id == today_item.id)
        )
        tc = tc_result.scalar_one_or_none()
        if tc:
            topic_content = TopicContentOut(
                summary=tc.summary,
                key_concepts=tc.key_concepts,
                interview_questions=tc.interview_questions,
                diagrams_to_know=tc.diagrams_to_know,
                common_mistakes=tc.common_mistakes,
                starter_notes=tc.starter_notes,
            )

    # ── Quiz ──────────────────────────────────────────────────────────────────
    quiz_result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.date == date.today())
        .where(QuizAttempt.score.isnot(None))
        .order_by(QuizAttempt.id.desc())
    )
    latest_quiz = quiz_result.scalars().first()
    quiz_complete = latest_quiz is not None

    # ── Build log ─────────────────────────────────────────────────────────────
    log_result = await db.execute(
        select(ProjectLog).where(ProjectLog.date == date.today())
    )
    log = log_result.scalar_one_or_none()
    build_complete = log is not None and bool((log.built or "").strip())
    log_preview = (log.built or "")[:150].strip() if log and log.built else None

    # ── Recap ─────────────────────────────────────────────────────────────────
    recap_result = await db.execute(
        select(DailyRecap).where(DailyRecap.date == date.today())
    )
    recap = recap_result.scalar_one_or_none()
    recap_complete = recap is not None

    return DashboardToday(
        track=track,
        study=PhaseStudy(
            complete=study_complete,
            topic_title=today_item.title if today_item else "",
            topic_description=today_item.description if today_item else "",
            day_no=today_item.day_no if today_item else 0,
            syllabus_item_id=today_item.id if today_item else 0,
            notes_preview=notes_preview,
            content=topic_content,
        ),
        quiz=PhaseQuiz(
            locked=not study_complete,
            complete=quiz_complete,
            last_score=latest_quiz.score if latest_quiz else None,
            attempt_id=latest_quiz.id if latest_quiz else None,
        ),
        build=PhaseBuild(
            locked=not quiz_complete,
            complete=build_complete,
            log_preview=log_preview,
        ),
        recap=PhaseRecap(
            locked=not build_complete,
            complete=recap_complete,
            summary=recap.content[:200] if recap else None,
        ),
    )
