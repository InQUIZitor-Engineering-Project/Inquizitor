"""question groups: question_group table and question.group_id

Revision ID: a1b2c3d4e5f6
Revises: 94cd3105fdb9
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = "94cd3105fdb9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "question_group",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("test_id", sa.Integer(), sa.ForeignKey("test.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )

    # Add column as nullable first so we can backfill
    op.add_column(
        "question",
        sa.Column("group_id", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_question_group_id"), "question", ["group_id"], unique=False)

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO question_group (test_id, label, position)
            SELECT id, 'Grupa A', 0 FROM test
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE question
            SET group_id = qg.id
            FROM question_group qg
            WHERE question.test_id = qg.test_id AND qg.position = 0
            """
        )
    )
    op.alter_column(
        "question",
        "group_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.create_foreign_key(
        "question_group_id_fkey",
        "question",
        "question_group",
        ["group_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("question_group_id_fkey", "question", type_="foreignkey")
    op.drop_index(op.f("ix_question_group_id"), table_name="question")
    op.drop_column("question", "group_id")
    op.drop_table("question_group")
