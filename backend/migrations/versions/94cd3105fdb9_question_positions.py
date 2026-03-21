"""question positions

Revision ID: 94cd3105fdb9
Revises: 15a65f92442b
Create Date: 2026-02-07 18:35:22.805223

"""
from alembic import op
import sqlalchemy as sa


revision = "94cd3105fdb9"
down_revision = "15a65f92442b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column with default so existing rows get a value (no NOT NULL violation)
    op.add_column(
        "question",
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    # Backfill: set position = index per test (order by id)
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            WITH ordered AS (
                SELECT id, test_id,
                       row_number() OVER (PARTITION BY test_id ORDER BY id) - 1 AS idx
                FROM question
            )
            UPDATE question
            SET position = ordered.idx
            FROM ordered
            WHERE question.id = ordered.id AND question.test_id = ordered.test_id
            """
        )
    )


def downgrade() -> None:
    op.drop_column("question", "position")
