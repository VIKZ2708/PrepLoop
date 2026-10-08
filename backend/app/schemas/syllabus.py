from pydantic import BaseModel


class SyllabusItemOut(BaseModel):
    id: int
    track: str
    day_no: int
    title: str
    description: str

    model_config = {"from_attributes": True}
