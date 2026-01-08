"""add bulk operations enum values and cleanup job schema

Revision ID: final_bulk_ops_migration
Revises: 0b1f2e5f7a4d
Create Date: 2025-12-26 21:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'final_bulk_ops_migration'
down_revision = '0b1f2e5f7a4d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Dodanie wartości do ENUM (Ważne: IF NOT EXISTS pozwala na bezpieczne uruchomienie na dev i prod)
    # Używamy op.get_bind().execute, aby uniknąć problemów z transakcjami w niektórych wersjach Postgresa
    op.execute("ALTER TYPE jobtype ADD VALUE IF NOT EXISTS 'questions_regeneration'")
    op.execute("ALTER TYPE jobtype ADD VALUE IF NOT EXISTS 'questions_conversion'")

    # 2. Poprawki w tabeli job (ujednolicenie schematu z SQLModel)
    op.alter_column('job', 'job_type',
               existing_type=postgresql.ENUM('test_generation', 'pdf_export', 'material_processing', 'questions_regeneration', 'questions_conversion', name='jobtype'),
               nullable=True)
    op.alter_column('job', 'status',
               existing_type=postgresql.ENUM('pending', 'running', 'done', 'failed', name='jobstatus'),
               nullable=True)
    op.alter_column('job', 'payload',
               existing_type=postgresql.JSONB(astext_type=sa.Text()),
               nullable=True)


def downgrade() -> None:
    # Downgrade zazwyczaj nie usuwa wartości z ENUM, bo Postgres na to nie pozwala bez usunięcia całego typu.
    pass

