"""add eligibility fields to student_application

Revision ID: add_eligibility_fields_app
Revises: 725081e45502
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_eligibility_fields_app'
down_revision: Union[str, Sequence[str], None] = 'remove_company_name_unique'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add eligibility fields to student_application."""
    # Add new columns to store student eligibility data at application time
    op.add_column('student_application', sa.Column('cgpa', sa.Float(), nullable=True))
    op.add_column('student_application', sa.Column('gender', sa.String(), nullable=True))
    op.add_column('student_application', sa.Column('marks', sa.Float(), nullable=True))
    op.add_column('student_application', sa.Column('year', sa.Integer(), nullable=True))
    op.add_column('student_application', sa.Column('backlogs', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema - remove eligibility fields from student_application."""
    op.drop_column('student_application', 'backlogs')
    op.drop_column('student_application', 'year')
    op.drop_column('student_application', 'marks')
    op.drop_column('student_application', 'gender')
    op.drop_column('student_application', 'cgpa')
