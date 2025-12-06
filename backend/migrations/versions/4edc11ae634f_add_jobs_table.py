"""add jobs table

Revision ID: 4edc11ae634f
Revises: bd5fa56f32dd
Create Date: 2025-12-06 17:09:53.191059

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4edc11ae634f'
down_revision = 'bd5fa56f32dd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure leftover enums from previous attempts are removed
    op.execute("DROP TYPE IF EXISTS jobstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS jobtype CASCADE")

    op.create_table(
        "job",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column(
            "job_type",
            sa.Enum(
                "test_generation",
                "pdf_export",
                "material_processing",
                name="jobtype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "running",
                "done",
                "failed",
                name="jobstatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("result", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_created_at"), "job", ["created_at"], unique=False)
    op.create_index(op.f("ix_job_job_type"), "job", ["job_type"], unique=False)
    op.create_index(op.f("ix_job_owner_id"), "job", ["owner_id"], unique=False)
    op.create_index(op.f("ix_job_status"), "job", ["status"], unique=False)
    op.create_index(op.f("ix_job_updated_at"), "job", ["updated_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_job_updated_at"), table_name="job")
    op.drop_index(op.f("ix_job_status"), table_name="job")
    op.drop_index(op.f("ix_job_owner_id"), table_name="job")
    op.drop_index(op.f("ix_job_job_type"), table_name="job")
    op.drop_index(op.f("ix_job_created_at"), table_name="job")
    op.drop_table("job")
    op.execute("DROP TYPE IF EXISTS jobstatus")
    op.execute("DROP TYPE IF EXISTS jobtype")
