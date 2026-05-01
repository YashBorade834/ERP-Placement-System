from sqlalchemy import Column, Date, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


# class DriveRound(Base):
#     __tablename__ = "drive_rounds"

#     id = Column(Integer, primary_key=True, index=True)
#     workflow_id = Column(Integer, ForeignKey("workflows.id"))

#     round_number = Column(Integer)
#     round_name = Column(String)
#     mode = Column(String)
#     remarks = Column(String, nullable=True)

#     is_active = Column(Boolean, default=True)

#     created_at = Column(DateTime(timezone=True), server_default=func.now())

#     from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Date
# from sqlalchemy.sql import func
# from app.database import Base


class DriveRound(Base):
    __tablename__ = "drive_rounds"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))

    round_number = Column(Integer)
    round_name = Column(String)
    mode = Column(String)
    remarks = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    round_date = Column(Date)  # ✅ NEW
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # ✅ NEW

    