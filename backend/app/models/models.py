from datetime import date, datetime
from typing import Optional
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(sa.String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(sa.String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )


class SyllabusItem(Base):
    __tablename__ = "syllabus_items"
    __table_args__ = (sa.UniqueConstraint("track", "day_no", name="uq_track_day"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    track: Mapped[str] = mapped_column(sa.String, nullable=False, index=True)
    day_no: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    title: Mapped[str] = mapped_column(sa.String, nullable=False)
    description: Mapped[str] = mapped_column(sa.Text, nullable=False)


class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    syllabus_item_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("syllabus_items.id"), nullable=True
    )
    date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    diagram_json: Mapped[Optional[dict]] = mapped_column(sa.JSON, nullable=True)
    teach_back: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    ai_feedback: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )

    chunks: Mapped[list["NoteChunk"]] = relationship(back_populates="session")


class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(sa.String, nullable=False)
    status: Mapped[str] = mapped_column(sa.String, nullable=False, server_default="todo")
    milestone: Mapped[Optional[str]] = mapped_column(sa.String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )


class ProjectLog(Base):
    __tablename__ = "project_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    built: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    blockers: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    learnings: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    syllabus_item_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("syllabus_items.id"), nullable=True
    )
    type: Mapped[str] = mapped_column(sa.String, nullable=False)
    prompt: Mapped[str] = mapped_column(sa.Text, nullable=False)
    options: Mapped[Optional[list]] = mapped_column(sa.JSON, nullable=True)
    answer: Mapped[str] = mapped_column(sa.Text, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(sa.String, nullable=False, server_default="medium")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    score: Mapped[Optional[float]] = mapped_column(sa.Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_attempt_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("quiz_attempts.id"), nullable=True
    )
    question_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("questions.id"), nullable=True
    )
    user_answer: Mapped[str] = mapped_column(sa.Text, nullable=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(sa.Boolean, nullable=True)
    ai_score: Mapped[Optional[float]] = mapped_column(sa.Float, nullable=True)
    ai_feedback: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)


class ReviewSchedule(Base):
    __tablename__ = "review_schedule"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    question_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("questions.id"), nullable=True
    )
    ease: Mapped[float] = mapped_column(sa.Float, nullable=False, server_default="2.5")
    interval_days: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default="1")
    next_review_date: Mapped[date] = mapped_column(sa.Date, nullable=False)


class DailyRecap(Base):
    __tablename__ = "daily_recaps"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(sa.ForeignKey("users.id"), nullable=True)
    date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    content: Mapped[str] = mapped_column(sa.Text, nullable=False)
    weak_topics: Mapped[Optional[list]] = mapped_column(sa.JSON, nullable=True)


class NoteChunk(Base):
    __tablename__ = "note_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey("study_sessions.id"), nullable=True
    )
    text: Mapped[str] = mapped_column(sa.Text, nullable=False)
    embedding = mapped_column(Vector(1536), nullable=True)

    session: Mapped[Optional["StudySession"]] = relationship(back_populates="chunks")
