from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class MOUCreate(BaseModel):
    company_id: int
    signed_date: date
    remarks: Optional[str] = None


class MOUResponse(BaseModel):
    id: int
    company_id: int
    file_path: str
    signed_date: date
    remarks: Optional[str]
    created_at: datetime

    class Config:
       from_attributes = True