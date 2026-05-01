from datetime import datetime

from pydantic import BaseModel
from typing import Optional


class EligibilityCreate(BaseModel):
    drive_id: int
    min_cgpa: float
    max_backlogs: int
    min_backlogs: int
    allowed_branches: str
    gender_restriction: str
    min_batch: Optional[int] = None  # ✅ NEW
    max_batch: Optional[int] = None  # ✅ NEW
    other_criteria: Optional[str] = None  # ✅ NEW


class EligibilityResponse(EligibilityCreate):
    id: int
    drive_id: int
    min_cgpa: float
    max_backlogs: int   
    min_backlogs: int
    allowed_branches: str
    gender_restriction: str
    min_batch: Optional[int]
    max_batch: Optional[int]
    other_criteria: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True