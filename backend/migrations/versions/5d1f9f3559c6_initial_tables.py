# migrations/versions/5d1f9f3559c6_initial_tables.py

import sqlalchemy as sa
from alembic import op
from sqlalchemy import String  # <<< DODAJEMY

# (… metadane migracji …)
revision = '5d1f9f3559c6'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', String(length=100), nullable=False),   # <<< ZAMIENIAMY
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Index('ix_user_email', 'email'),
    )
    op.create_table(
        'test',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ),
    )
    op.create_table(
        'question',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('test_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('is_closed', sa.Boolean(), nullable=False),
        sa.Column('difficulty', sa.Integer(), nullable=False),
        sa.Column('choices', sa.String(), nullable=True),
        sa.Column('correct_choices', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['test_id'], ['test.id'], ),
    )

def downgrade():
    op.drop_table('question')
    op.drop_table('test')
    op.drop_table('user')
