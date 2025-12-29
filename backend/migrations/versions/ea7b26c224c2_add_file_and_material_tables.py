"""add file and material tables

Revision ID: ea7b26c224c2
Revises: 5a0ba3f4f656
Create Date: 2025-12-29 15:33:17.930864

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'ea7b26c224c2'
down_revision = '5a0ba3f4f656'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    # 1. Create 'file' table if not exists
    if 'file' not in existing_tables:
        op.create_table(
            'file',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('owner_id', sa.Integer(), nullable=False),
            sa.Column('filename', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('filepath', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('uploaded_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_file_owner_id'), 'file', ['owner_id'], unique=False)

    # 2. Create 'processingstatus' enum if not exists
    processing_status = postgresql.ENUM('pending', 'done', 'failed', name='processingstatus')
    processing_status.create(conn, checkfirst=True)

    # 3. Create 'material' table if not exists
    if 'material' not in existing_tables:
        op.create_table(
            'material',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('owner_id', sa.Integer(), nullable=False),
            sa.Column('file_id', sa.Integer(), nullable=False),
            sa.Column('mime_type', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('size_bytes', sa.Integer(), nullable=True),
            sa.Column('checksum', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('extracted_text', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('processing_status', sa.Enum('pending', 'done', 'failed', name='processingstatus'), nullable=False),
            sa.Column('processing_error', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['file_id'], ['file.id'], ),
            sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_material_checksum'), 'material', ['checksum'], unique=False)
        op.create_index(op.f('ix_material_created_at'), 'material', ['created_at'], unique=False)
        op.create_index(op.f('ix_material_file_id'), 'material', ['file_id'], unique=True)
        op.create_index(op.f('ix_material_mime_type'), 'material', ['mime_type'], unique=False)
        op.create_index(op.f('ix_material_owner_id'), 'material', ['owner_id'], unique=False)
        op.create_index(op.f('ix_material_processing_status'), 'material', ['processing_status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_material_processing_status'), table_name='material')
    op.drop_index(op.f('ix_material_owner_id'), table_name='material')
    op.drop_index(op.f('ix_material_mime_type'), table_name='material')
    op.drop_index(op.f('ix_material_file_id'), table_name='material')
    op.drop_index(op.f('ix_material_created_at'), table_name='material')
    op.drop_index(op.f('ix_material_checksum'), table_name='material')
    op.drop_table('material')
    op.drop_index(op.f('ix_file_owner_id'), table_name='file')
    op.drop_table('file')
