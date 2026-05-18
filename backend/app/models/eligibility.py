from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"))

    min_cgpa = Column(Float)
    max_backlogs = Column(Integer)
    min_backlogs = Column(Integer)
    allowed_branches = Column(String)
    gender_restriction = Column(String)

    min_batch = Column(Integer)   # ✅ NEW
    max_batch = Column(Integer)   # ✅ NEW
    other_criteria = Column(String)  # ✅ NEW

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # ✅ NEW