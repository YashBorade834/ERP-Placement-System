from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class ApplicationStatusBase(BaseModel):
    application_id: int
    drive_round_id: int
    status: str
    remarks: Optional[str] = None
    status_date: date


class ApplicationStatusCreate(ApplicationStatusBase):
    pass


class ApplicationStatusUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    status_date: Optional[date] = None


class ApplicationStatusResponse(ApplicationStatusBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # ✅ Pydantic V2 config
    model_config = ConfigDict(from_attributes=True)