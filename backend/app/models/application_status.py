import enum
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.sql import func
from app.database import Base


class ApplicationStatusEnum(str, enum.Enum):
    applied = "applied"
    shortlisted = "shortlisted"
    selected = "selected"
    rejected = "rejected"
    withdrawn = "withdrawn"


class ApplicationStatus(Base):
    __tablename__ = "application_status"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("student_application.id"))
    drive_round_id = Column(Integer, ForeignKey("drive_rounds.id"))

    status = Column(SQLAlchemyEnum(ApplicationStatusEnum, native_enum=False), nullable=False)
    remarks = Column(String, nullable=True)
    status_date = Column(Date, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())