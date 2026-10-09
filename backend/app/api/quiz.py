from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import Answer, Question, QuizAttempt, StudySession, SyllabusItem
from app.schemas.quiz import (
    AnswerRequest,
    AnswerResponse,
    QuestionOut,
    QuizFinishResponse,
    QuizStartResponse,
)
from app.services.quiz_generator import generate_questions
from app.services.grader import grade_answer

router = APIRouter(prefix="/quiz", tags=["quiz"])

DB = Annotated[AsyncSession, Depends(get_db)]

_START_DATE = date(2026, 10, 8)


def _day_offset() -> int:
    return max(0, (date.today() - _START_DATE).days)


async def _get_today_session(db: AsyncSession, track: str) -> StudySession | None:
    day_no = (_day_offset() % 15) + 1  # rough; syllabus.py handles the exact modulo
    result = await db.execute(
        select(StudySession)
        .join(SyllabusItem, StudySession.syllabus_item_id == SyllabusItem.id)
        .where(SyllabusItem.track == track)
        .where(StudySession.date == date.today())
        .limit(1)
    )
    return result.scalar_one_or_none()


# ── POST /quiz/start ──────────────────────────────────────────────────────────

@router.post("/start", response_model=QuizStartResponse)
async def start_quiz(track: str, db: DB):
    session = await _get_today_session(db, track)
    notes = session.notes if session else ""

    raw_questions = generate_questions(notes or "")

    saved: list[Question] = []
    for q in raw_questions:
        question = Question(
            syllabus_item_id=session.syllabus_item_id if session else None,
            type=q.type,
            prompt=q.prompt,
            options=q.options,
            answer=q.answer,
            explanation=q.explanation,
            difficulty=q.difficulty,
        )
        db.add(question)
        saved.append(question)

    await db.flush()  # populate IDs without committing yet

    attempt = QuizAttempt(date=date.today())
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    for q in saved:
        await db.refresh(q)

    return QuizStartResponse(
        attempt_id=attempt.id,
        questions=[QuestionOut.model_validate(q) for q in saved],
    )


# ── POST /quiz/{attempt_id}/answer ────────────────────────────────────────────

@router.post("/{attempt_id}/answer", response_model=AnswerResponse)
async def submit_answer(attempt_id: int, body: AnswerRequest, db: DB):
    attempt = await db.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(404, "Quiz attempt not found")

    question = await db.get(Question, body.question_id)
    if not question:
        raise HTTPException(404, "Question not found")

    ai_score: float | None = None
    ai_feedback: str | None = None

    if question.type == "mcq":
        is_correct = body.user_answer.strip().lower() == question.answer.strip().lower()
    else:
        # Grade open/short/design answers with Haiku
        grade = grade_answer(question.prompt, question.answer, body.user_answer)
        ai_score = float(grade.score)
        ai_feedback = grade.feedback
        is_correct = grade.score >= 6  # ≥6/10 counts as correct

    answer = Answer(
        quiz_attempt_id=attempt_id,
        question_id=question.id,
        user_answer=body.user_answer,
        is_correct=is_correct,
        ai_score=ai_score,
        ai_feedback=ai_feedback,
    )
    db.add(answer)
    await db.commit()

    return AnswerResponse(
        is_correct=is_correct,
        correct_answer=question.answer,
        explanation=question.explanation,
        ai_score=ai_score,
        ai_feedback=ai_feedback,
    )


# ── POST /quiz/{attempt_id}/finish ────────────────────────────────────────────

@router.post("/{attempt_id}/finish", response_model=QuizFinishResponse)
async def finish_quiz(attempt_id: int, db: DB):
    attempt = await db.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(404, "Quiz attempt not found")

    result = await db.execute(
        select(func.count(Answer.id))
        .where(Answer.quiz_attempt_id == attempt_id)
    )
    total = result.scalar() or 0

    correct_result = await db.execute(
        select(func.count(Answer.id))
        .where(Answer.quiz_attempt_id == attempt_id)
        .where(Answer.is_correct.is_(True))
    )
    correct = correct_result.scalar() or 0
    score = correct / total if total else 0.0

    attempt.score = score
    await db.commit()

    return QuizFinishResponse(
        attempt_id=attempt_id,
        score=round(score, 2),
        correct=correct,
        total=total,
    )
