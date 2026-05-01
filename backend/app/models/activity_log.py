from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False)
    table_name = Column(String, nullable=False)
    record_id = Column(Integer, nullable=False)

    action_type = Column(String, nullable=False)  # CREATE / UPDATE / DELETE
    description = Column(Text, nullable=True)

    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)

    action_time = Column(DateTime(timezone=True), server_default=func.now())