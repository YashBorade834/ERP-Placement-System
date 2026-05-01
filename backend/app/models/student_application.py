from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone

from app.database import Base


class StudentApplication(Base):
    __tablename__ = "student_application"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, nullable=False)  # From SIS module
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)

    applied_at = Column(DateTime, default=datetime.now(timezone.utc))

    application_status = Column(String, default="APPLIED")
    is_active = Column(Boolean, default=True)

    feedback = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))