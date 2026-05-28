from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Enum as SQLAlchemyEnum
from datetime import datetime, timezone

from app.database import Base
from app.models.application_status import ApplicationStatusEnum


class StudentApplication(Base):
    __tablename__ = "student_application"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False)  # From SIS module
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    applied_at = Column(DateTime, default=datetime.now(timezone.utc))
    application_status = Column(SQLAlchemyEnum(ApplicationStatusEnum, native_enum=False), default=ApplicationStatusEnum.applied)
    is_active = Column(Boolean, default=True)
    feedback = Column(String, nullable=True)
    # Student eligibility data (collected at application time)
    cgpa = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    marks = Column(Float, nullable=True)  # Current semester/year marks
    year = Column(Integer, nullable=True)  # Academic year (1, 2, 3, 4, etc.)
    backlogs = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))