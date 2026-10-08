from datetime import date
from typing import Optional
from pydantic import BaseModel


class ProjectTaskCreate(BaseModel):
    title: str
    status: str = "todo"
    milestone: Optional[str] = None


class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    milestone: Optional[str] = None


class ProjectTaskOut(BaseModel):
    id: int
    title: str
    status: str
    milestone: Optional[str]

    model_config = {"from_attributes": True}


class ProjectLogUpsert(BaseModel):
    built: Optional[str] = None
    blockers: Optional[str] = None
    learnings: Optional[str] = None


class ProjectLogOut(BaseModel):
    id: int
    date: date
    built: Optional[str]
    blockers: Optional[str]
    learnings: Optional[str]

    model_config = {"from_attributes": True}
