"""add page_count to material

Revision ID: b7c9a3f1d2e4
Revises: 7d079f02efe1
Create Date: 2026-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = "b7c9a3f1d2e4"
down_revision = "7d079f02efe1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    if "material" not in existing_tables:
        return

    columns = {col["name"] for col in inspector.get_columns("material")}
    if "page_count" not in columns:
        op.add_column("material", sa.Column("page_count", sa.Integer(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    if "material" not in existing_tables:
        return

    columns = {col["name"] for col in inspector.get_columns("material")}
    if "page_count" in columns:
        op.drop_column("material", "page_count")

