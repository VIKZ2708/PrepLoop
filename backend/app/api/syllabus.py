from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import SyllabusItem, StudySession
from app.schemas.syllabus import SyllabusItemOut, SyllabusItemWithStatus, CurriculumResponse

router = APIRouter()

_START_DATE = date(2026, 10, 8)

VALID_TRACKS = {"sd1", "sd2", "ai"}
TRACK_ORDER = ["sd1", "sd2", "ai"]


@router.get("/syllabus/today", response_model=SyllabusItemOut)
async def get_syllabus_today(
    track: str = Query(..., description="Track: sd1, sd2, or ai"),
    day: Optional[int] = Query(None, description="Override day number (1-indexed, for testing)"),
    db: AsyncSession = Depends(get_db),
):
    if track not in VALID_TRACKS:
        raise HTTPException(status_code=400, detail=f"Invalid track. Choose from: {sorted(VALID_TRACKS)}")

    result = await db.execute(
        select(SyllabusItem)
        .where(SyllabusItem.track == track)
        .order_by(SyllabusItem.day_no)
    )
    items = result.scalars().all()

    if not items:
        raise HTTPException(status_code=404, detail=f"No syllabus items found for track: {track}")

    if day is not None:
        idx = (day - 1) % len(items)
    else:
        offset = (date.today() - _START_DATE).days
        idx = offset % len(items)

    return items[idx]


@router.get("/syllabus/all", response_model=CurriculumResponse)
async def get_all_syllabus(db: AsyncSession = Depends(get_db)):
    """All syllabus items with today's position and completion status per item."""
    result = await db.execute(
        select(SyllabusItem).order_by(SyllabusItem.track, SyllabusItem.day_no)
    )
    all_items = result.scalars().all()

    # Which syllabus_item_ids have a study session with notes?
    completed_result = await db.execute(
        select(StudySession.syllabus_item_id)
        .where(StudySession.syllabus_item_id.isnot(None))
        .where(StudySession.notes.isnot(None))
        .where(StudySession.notes != "")
    )
    completed_ids: set[int] = {row[0] for row in completed_result.all()}

    # Today's day_no per track
    offset = (date.today() - _START_DATE).days
    today_map: dict[str, int] = {}
    by_track: dict[str, list[SyllabusItemWithStatus]] = {t: [] for t in TRACK_ORDER}

    for item in all_items:
        if item.track not in by_track:
            continue
        by_track[item.track].append(
            SyllabusItemWithStatus(
                id=item.id,
                track=item.track,
                day_no=item.day_no,
                title=item.title,
                description=item.description,
                completed=item.id in completed_ids,
                is_today=False,  # patched below
            )
        )

    for track, items in by_track.items():
        if items:
            today_idx = offset % len(items)
            today_map[track] = items[today_idx].day_no
            items[today_idx].is_today = True

    return CurriculumResponse(sd1=by_track["sd1"], sd2=by_track["sd2"], ai=by_track["ai"], today=today_map)
