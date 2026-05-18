from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class ApplicationCreate(BaseModel):
    """Create student application for a drive"""
    student_id: int   # From SIS or temp dummy
    drive_id: int
    cgpa: Optional[float] = None
    gender: Optional[str] = None
    marks: Optional[float] = None  # Current semester/year marks
    year: Optional[int] = None  # Academic year (1, 2, 3, 4)
    backlogs: Optional[int] = 0


class ApplicationResponse(BaseModel):
    """Student application details"""
    id: int
    student_id: int
    drive_id: int
    application_status: str
    is_active: bool
    applied_at: datetime
    feedback: Optional[str] = None
    cgpa: Optional[float] = None
    gender: Optional[str] = None
    marks: Optional[float] = None
    year: Optional[int] = None
    backlogs: int = 0
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