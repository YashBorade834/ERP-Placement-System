from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class ApplicationCreate(BaseModel):
    """Create student application for a drive"""
    student_id: int   # From SIS or temp dummy
    drive_id: int


class ApplicationResponse(BaseModel):
    """Student application details"""
    id: int
    student_id: int
    drive_id: int
    application_status: str
    is_active: bool
    applied_at: datetime
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationDetailResponse(ApplicationResponse):
    """Application with drive and eligibility details"""
    drive_title: Optional[str] = None
    company_name: Optional[str] = None
    venue: Optional[str] = None
    drive_date: Optional[date] = None


class ApplicationUpdate(BaseModel):
    """Update application status by admin"""
    application_status: str
    feedback: Optional[str] = None


class EligibilityCheckRequest(BaseModel):
    """Check if student meets drive eligibility"""
    student_id: int
    drive_id: int