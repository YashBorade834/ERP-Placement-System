"""merge heads

Revision ID: d75a66948ee6
Revises: add_student_resume_table, remove_company_name_unique
Create Date: 2026-05-04 13:13:28.556589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd75a66948ee6'
down_revision: Union[str, Sequence[str], None] = ('add_student_resume_table', 'remove_company_name_unique')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
