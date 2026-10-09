from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import DailyRecap
from app.schemas.recap import RecapBuildResponse, RecapOut
from app.services.recap_builder import build_recap

router = APIRouter(prefix="/recap", tags=["recap"])
DB = Annotated[AsyncSession, Depends(get_db)]


def _parse_recap(recap: DailyRecap) -> RecapOut:
    wt = recap.weak_topics or {}
    return RecapOut(
        id=recap.id,
        date=recap.date,
        summary=recap.content,
        weak_topics=wt.get("topics", []),
        recall_questions=wt.get("recall_questions", []),
    )


@router.get("/today", response_model=RecapOut)
async def get_today_recap(db: DB):
    result = await db.execute(select(DailyRecap).where(DailyRecap.date == date.today()))
    recap = result.scalar_one_or_none()
    if not recap:
        raise HTTPException(404, "No recap for today yet. It is generated at 06:00 IST.")
    return _parse_recap(recap)


@router.api_route("/build", methods=["GET", "POST"], response_model=RecapBuildResponse)
async def trigger_build(db: DB):
    """Build today's recap manually or via Vercel Cron (GET at 00:30 UTC = 06:00 IST)."""
    recap = await build_recap(db)
    wt = recap.weak_topics or {}
    return RecapBuildResponse(
        built_for=recap.date,
        summary=recap.content,
        weak_topics=wt.get("topics", []),
        recall_questions=wt.get("recall_questions", []),
    )
