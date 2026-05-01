from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Offer(Base):
    __tablename__ = "offer"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("student_application.id"))

    offer_letter_path = Column(String, nullable=False)
    offer_date = Column(Date, nullable=False)
    position = Column(String, nullable=False)
    package = Column(String, nullable=False)
    status = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())