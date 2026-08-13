"""add import_history table

Revision ID: d8e4f2a6b1c9
Revises: 1c7ed4748fc1
Create Date: 2026-08-08 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import app.utils.types


# revision identifiers, used by Alembic.
revision: str = 'd8e4f2a6b1c9'
down_revision: Union[str, None] = '1c7ed4748fc1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'import_history',
        sa.Column('id', app.utils.types.GUID(), nullable=False),
        sa.Column('filename', sa.String(length=500), nullable=False),
        sa.Column('uploaded_by_id', app.utils.types.GUID(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('imported_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_summary', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ['uploaded_by_id'], ['users.id'],
            name=op.f('fk_import_history_uploaded_by_id_users'), ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_import_history')),
    )
    op.create_index(op.f('ix_import_history_uploaded_by_id'), 'import_history', ['uploaded_by_id'], unique=False)
    op.create_index(op.f('ix_import_history_uploaded_at'), 'import_history', ['uploaded_at'], unique=False)
    op.create_index(op.f('ix_import_history_status'), 'import_history', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_import_history_status'), table_name='import_history')
    op.drop_index(op.f('ix_import_history_uploaded_at'), table_name='import_history')
    op.drop_index(op.f('ix_import_history_uploaded_by_id'), table_name='import_history')
    op.drop_table('import_history')