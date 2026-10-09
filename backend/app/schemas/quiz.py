from typing import Optional
from pydantic import BaseModel


# ── LLM output schema (what quiz_generator validates) ──────────────────────────

class QuestionSchema(BaseModel):
    type: str           # "mcq" | "short" | "design"
    prompt: str
    options: Optional[list[str]] = None   # 4 items for MCQ
    answer: str                           # correct option text or short answer
    explanation: Optional[str] = None
    difficulty: str = "medium"


class GeneratedQuiz(BaseModel):
    questions: list[QuestionSchema]


# ── API request / response schemas ────────────────────────────────────────────

class QuizStartResponse(BaseModel):
    attempt_id: int
    questions: list["QuestionOut"]


class QuestionOut(BaseModel):
    id: int
    type: str
    prompt: str
    options: Optional[list[str]] = None
    difficulty: str

    model_config = {"from_attributes": True}


class AnswerRequest(BaseModel):
    question_id: int
    user_answer: str


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str]


class QuizFinishResponse(BaseModel):
    attempt_id: int
    score: float          # 0.0 – 1.0
    correct: int
    total: int
