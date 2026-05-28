"""lowercase_status_enum

Revision ID: f82e2235e0c1
Revises: be1c210a5b75
Create Date: 2026-05-22 11:37:48.294012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f82e2235e0c1'
down_revision: Union[str, Sequence[str], None] = 'be1c210a5b75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE application_status SET status = LOWER(status)")
    op.execute("UPDATE student_application SET application_status = LOWER(application_status)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE application_status SET status = UPPER(status)")
    op.execute("UPDATE student_application SET application_status = UPPER(application_status)")
