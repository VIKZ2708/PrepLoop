"""add diagram_sections and code_examples to topic_content

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-23
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("topic_content", sa.Column("diagram_sections", sa.JSON(), nullable=True))
    op.add_column("topic_content", sa.Column("code_examples", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("topic_content", "code_examples")
    op.drop_column("topic_content", "diagram_sections")
