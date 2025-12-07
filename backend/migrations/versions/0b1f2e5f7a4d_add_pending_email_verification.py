"""add pending email verification table

Revision ID: 0b1f2e5f7a4d
Revises: cff696c5bab3
Create Date: 2025-12-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision = '0b1f2e5f7a4d'
down_revision = '4edc11ae634f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'pending_email_verification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('hashed_password', sa.Text(), nullable=False),
        sa.Column('first_name', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.Column('last_name', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
        sa.Column('token_hash', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_pending_email_verification_created_at'), 'pending_email_verification', ['created_at'], unique=False)
    op.create_index(op.f('ix_pending_email_verification_email'), 'pending_email_verification', ['email'], unique=False)
    op.create_index(op.f('ix_pending_email_verification_expires_at'), 'pending_email_verification', ['expires_at'], unique=False)
    op.create_index(op.f('ix_pending_email_verification_token_hash'), 'pending_email_verification', ['token_hash'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pending_email_verification_token_hash'), table_name='pending_email_verification')
    op.drop_index(op.f('ix_pending_email_verification_expires_at'), table_name='pending_email_verification')
    op.drop_index(op.f('ix_pending_email_verification_email'), table_name='pending_email_verification')
    op.drop_index(op.f('ix_pending_email_verification_created_at'), table_name='pending_email_verification')
    op.drop_table('pending_email_verification')
