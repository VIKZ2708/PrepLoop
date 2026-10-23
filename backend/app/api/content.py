"""Topic content generation and retrieval."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.models import SyllabusItem, TopicContent
from app.services.content_generator import generate_topic_content

router = APIRouter()


class TopicContentOut(BaseModel):
    syllabus_item_id: int
    summary: Optional[str] = None
    key_concepts: Optional[list] = None
    interview_questions: Optional[list] = None
    diagrams_to_know: Optional[list] = None
    common_mistakes: Optional[list] = None
    starter_notes: Optional[str] = None

    model_config = {"from_attributes": True}


class GenerateAllResponse(BaseModel):
    generated: int
    skipped: int
    total: int


@router.get("/content/{syllabus_item_id}", response_model=TopicContentOut)
async def get_topic_content(syllabus_item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TopicContent).where(TopicContent.syllabus_item_id == syllabus_item_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not yet generated for this topic")
    return content


@router.api_route("/content/generate-all", methods=["GET", "POST"], response_model=GenerateAllResponse)
async def generate_all_content(
    force: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Generate content for all syllabus items. Skips items already generated unless force=true."""
    items_result = await db.execute(
        select(SyllabusItem).order_by(SyllabusItem.track, SyllabusItem.day_no)
    )
    items = items_result.scalars().all()

    existing_result = await db.execute(select(TopicContent.syllabus_item_id))
    existing_ids: set[int] = {row[0] for row in existing_result.all()}

    generated = 0
    skipped = 0

    for item in items:
        if item.id in existing_ids and not force:
            skipped += 1
            continue

        try:
            data = generate_topic_content(item.title, item.description, item.track)
        except Exception:
            skipped += 1
            continue

        if item.id in existing_ids:
            existing = (await db.execute(
                select(TopicContent).where(TopicContent.syllabus_item_id == item.id)
            )).scalar_one()
            existing.summary = data.get("summary")
            existing.key_concepts = data.get("key_concepts")
            existing.interview_questions = data.get("interview_questions")
            existing.diagrams_to_know = data.get("diagrams_to_know")
            existing.common_mistakes = data.get("common_mistakes")
            existing.starter_notes = data.get("starter_notes")
            existing.generated_at = datetime.now(timezone.utc)
        else:
            content = TopicContent(
                syllabus_item_id=item.id,
                summary=data.get("summary"),
                key_concepts=data.get("key_concepts"),
                interview_questions=data.get("interview_questions"),
                diagrams_to_know=data.get("diagrams_to_know"),
                common_mistakes=data.get("common_mistakes"),
                starter_notes=data.get("starter_notes"),
                generated_at=datetime.now(timezone.utc),
            )
            db.add(content)

        await db.commit()
        generated += 1

    return GenerateAllResponse(generated=generated, skipped=skipped, total=len(items))
