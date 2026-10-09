from pydantic import BaseModel


class SyllabusItemOut(BaseModel):
    id: int
    track: str
    day_no: int
    title: str
    description: str

    model_config = {"from_attributes": True}


class SyllabusItemWithStatus(SyllabusItemOut):
    completed: bool = False
    is_today: bool = False


class CurriculumResponse(BaseModel):
    sd1: list[SyllabusItemWithStatus]
    sd2: list[SyllabusItemWithStatus]
    ai: list[SyllabusItemWithStatus]
    today: dict[str, int]  # track -> day_no
