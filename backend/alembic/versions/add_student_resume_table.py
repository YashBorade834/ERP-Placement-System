"""Create student_resume table

Revision ID: add_student_resume_table
Revises: f6c59defc559
Create Date: 2026-05-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_student_resume_table'
down_revision = 'f6c59defc559'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'student_resume',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', name='unique_student_resume')
    )
    op.create_index(op.f('ix_student_resume_id'), 'student_resume', ['id'], unique=False)
    op.create_index(op.f('ix_student_resume_student_id'), 'student_resume', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_student_resume_student_id'), table_name='student_resume')
    op.drop_index(op.f('ix_student_resume_id'), table_name='student_resume')
    op.drop_table('student_resume')
