from datetime import date
from typing import Optional
from pydantic import BaseModel


class StudySessionOut(BaseModel):
    id: int
    syllabus_item_id: Optional[int]
    date: date
    notes: Optional[str]
    diagram_json: Optional[dict]
    teach_back: Optional[str]
    ai_feedback: Optional[str]

    model_config = {"from_attributes": True}


class StudySessionPatch(BaseModel):
    notes: Optional[str] = None
    diagram_json: Optional[dict] = None
    teach_back: Optional[str] = None
