"""Remove unique constraint on company name to allow multiple locations

Revision ID: remove_company_name_unique
Revises: 54e85efbf22a
Create Date: 2026-04-28 13:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_company_name_unique'
down_revision: Union[str, Sequence[str], None] = '54e85efbf22a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove unique constraint on company name"""
    # Drop the unique constraint on company name
    op.drop_constraint('companies_name_key', 'companies', type_='unique')


def downgrade() -> None:
    """Add back unique constraint on company name"""
    # Re-add the unique constraint on company name
    op.create_unique_constraint('companies_name_key', 'companies', ['name'])
