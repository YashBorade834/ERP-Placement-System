"""merge_heads

Revision ID: be1c210a5b75
Revises: add_reason_to_offer, d75a66948ee6
Create Date: 2026-05-22 11:35:49.947072

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be1c210a5b75'
down_revision: Union[str, Sequence[str], None] = ('add_reason_to_offer', 'd75a66948ee6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
