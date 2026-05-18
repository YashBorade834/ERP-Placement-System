"""Create student_academics table

Revision ID: add_student_academic_table
Revises: d75a66948ee6
Create Date: 2026-05-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_student_academic_table'
down_revision = 'add_eligibility_fields_app'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'student_academics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('cgpa', sa.Float(), nullable=True),
        sa.Column('current_backlogs', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('history_backlogs', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('tenth_marks', sa.Float(), nullable=True),
        sa.Column('twelfth_marks', sa.Float(), nullable=True),
        sa.Column('diploma_marks', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='unique_student_academic')
    )
    op.create_index(op.f('ix_student_academics_id'), 'student_academics', ['id'], unique=False)
    op.create_index(op.f('ix_student_academics_student_id'), 'student_academics', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_student_academics_student_id'), table_name='student_academics')
    op.drop_index(op.f('ix_student_academics_id'), table_name='student_academics')
    op.drop_table('student_academics')
