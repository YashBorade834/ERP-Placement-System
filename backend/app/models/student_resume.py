from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class StudentResume(Base):
    __tablename__ = "student_resume"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False, unique=True, index=True)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
