from datetime import date, datetime

from pydantic import BaseModel
from typing import Optional


class RoundCreate(BaseModel):
    workflow_id: int
    round_number: int
    round_name: str
    mode: Optional[str] = None
    remarks: Optional[str] = None
    round_date: Optional[date] = None  # ✅ NEW


class RoundResponse(RoundCreate):
    id: int
    workflow_id: int
    round_number: int
    round_name: str
    mode: str
    remarks: Optional[str]
    round_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
