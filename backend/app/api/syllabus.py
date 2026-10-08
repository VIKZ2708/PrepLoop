from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import SyllabusItem
from app.schemas.syllabus import SyllabusItemOut

router = APIRouter()

_START_DATE = date(2026, 10, 8)

VALID_TRACKS = {"sd1", "sd2", "ai"}


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
