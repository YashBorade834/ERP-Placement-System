"""Add reason column to offer table

Revision ID: add_reason_to_offer
Revises: add_student_academic_table
Create Date: 2026-05-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_reason_to_offer'
down_revision = 'add_student_academic_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('offer', sa.Column('reason', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('offer', 'reason')
