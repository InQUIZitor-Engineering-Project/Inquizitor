"""add job_type material_analysis

Revision ID: d9e1c2b3a4f5
Revises: 6be7b54f6b92
Create Date: 2026-02-25 18:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "d9e1c2b3a4f5"
down_revision = "6be7b54f6b92"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE jobtype ADD VALUE IF NOT EXISTS 'material_analysis'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values safely; no-op.
    pass
