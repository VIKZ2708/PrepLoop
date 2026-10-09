from datetime import date
from typing import Optional
from pydantic import BaseModel


class RecapOut(BaseModel):
    id: int
    date: date
    summary: str
    weak_topics: list[str]
    recall_questions: list[str]

    model_config = {"from_attributes": False}


class RecapBuildResponse(BaseModel):
    built_for: date
    summary: str
    weak_topics: list[str]
    recall_questions: list[str]
