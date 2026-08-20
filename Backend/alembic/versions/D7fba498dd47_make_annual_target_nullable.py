"""make kpi_indicators.annual_target nullable

Revision ID: d7fba498dd47
Revises: d8e4f2a6b1c9
Create Date: 2026-08-17

Some real spreadsheet rows have no clean numeric Annual Target (blank
cells, or annotated text like "20(1.HY) \n20+14(2.HY)" where the import
validator can only confidently extract a partial number). Previously
NOT NULL, which made those indicators unimportable.

NOTE: the column was already altered manually via a direct ALTER TABLE
while chasing down a broken migration chain - this migration exists so
alembic_version and the models/versions folder agree with what the DB
actually has. nullable=True is idempotent to re-apply, so running this
is safe even though the DB is already in this state.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7fba498dd47"
down_revision: Union[str, None] = "d8e4f2a6b1c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "kpi_indicators",
        "annual_target",
        existing_type=sa.Numeric(14, 2),
        nullable=True,
    )


def downgrade() -> None:
    # NOTE: will fail if any row was imported with a NULL annual_target
    # (which this migration is what makes possible) until those rows are
    # backfilled with a value - expected, not a bug in the migration.
    op.alter_column(
        "kpi_indicators",
        "annual_target",
        existing_type=sa.Numeric(14, 2),
        nullable=False,
    )