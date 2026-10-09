from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import StudySession, SyllabusItem
from app.schemas.study import StudySessionOut, StudySessionPatch, TeachBackRequest, TeachBackResponse
from app.services.teach_back import critique_teach_back

router = APIRouter(prefix="/study", tags=["study"])

_START_DATE = date(2026, 10, 8)
VALID_TRACKS = {"sd1", "sd2", "ai"}


async def _today_syllabus_id(track: str, db: AsyncSession) -> int | None:
    result = await db.execute(
        select(SyllabusItem)
        .where(SyllabusItem.track == track)
        .order_by(SyllabusItem.day_no)
    )
    items = result.scalars().all()
    if not items:
        return None
    offset = (date.today() - _START_DATE).days
    return items[offset % len(items)].id


@router.get("/today", response_model=StudySessionOut)
async def get_today_session(
    track: str = Query("sd1", description="Track: sd1, sd2, or ai"),
    db: AsyncSession = Depends(get_db),
):
    if track not in VALID_TRACKS:
        raise HTTPException(400, f"Invalid track. Choose from: {sorted(VALID_TRACKS)}")

    today = date.today()
    syllabus_item_id = await _today_syllabus_id(track, db)

    result = await db.execute(
        select(StudySession).where(
            StudySession.date == today,
            StudySession.syllabus_item_id == syllabus_item_id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        session = StudySession(date=today, syllabus_item_id=syllabus_item_id, notes="")
        db.add(session)
        await db.commit()
        await db.refresh(session)

    return session


@router.patch("/{session_id}", response_model=StudySessionOut)
async def patch_session(
    session_id: int,
    body: StudySessionPatch,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StudySession).where(StudySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Study session not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/teach-back", response_model=TeachBackResponse)
async def submit_teach_back(
    session_id: int,
    body: TeachBackRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StudySession).where(StudySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Study session not found")

    # Resolve topic from syllabus item title if available
    topic = body.topic
    if not topic and session.syllabus_item_id:
        syl = await db.get(SyllabusItem, session.syllabus_item_id)
        if syl:
            topic = syl.title

    feedback = critique_teach_back(topic or "system design", body.explanation)

    session.teach_back = body.explanation
    session.ai_feedback = feedback.critique
    await db.commit()

    return TeachBackResponse(
        critique=feedback.critique,
        follow_up_questions=feedback.follow_up_questions,
    )
