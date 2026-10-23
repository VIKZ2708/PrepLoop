"""add topic_content table

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-23
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "topic_content",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("syllabus_item_id", sa.Integer(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_concepts", sa.JSON(), nullable=True),
        sa.Column("interview_questions", sa.JSON(), nullable=True),
        sa.Column("diagrams_to_know", sa.JSON(), nullable=True),
        sa.Column("common_mistakes", sa.JSON(), nullable=True),
        sa.Column("starter_notes", sa.Text(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["syllabus_item_id"], ["syllabus_items.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("syllabus_item_id", name="uq_topic_content_item"),
    )


def downgrade() -> None:
    op.drop_table("topic_content")
