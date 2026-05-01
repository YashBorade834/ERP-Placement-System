from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    drive_date = Column(Date, nullable=True)
    venue = Column(String, nullable=True)

    is_published = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    registration_open = Column(Boolean, default=True)

    circular_file_path = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())