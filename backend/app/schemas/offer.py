from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class OfferBase(BaseModel):
    application_id: int
    offer_letter_path: str
    offer_date: date
    position: str
    package: str
    status: str
    reason: Optional[str] = None


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    offer_letter_path: Optional[str] = None
    offer_date: Optional[date] = None
    position: Optional[str] = None
    package: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None


class OfferResponse(OfferBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # ✅ Pydantic V2 config
    model_config = ConfigDict(from_attributes=True)


class RejectOfferRequest(BaseModel):
    reason: str