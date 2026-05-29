from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DriveCreate(BaseModel):
    company_id: int
    title: str
    description: Optional[str] = None
    drive_date: Optional[date] = None
    venue: Optional[str] = None
    package: Optional[str] = None
    is_published: bool = False
    is_active: bool = True
    registration_open: bool = True


class DriveUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    drive_date: Optional[date] = None
    venue: Optional[str] = None
    package: Optional[str] = None
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None
    registration_open: Optional[bool] = None


class DriveResponse(BaseModel):
    id: int
    company_id: int
    title: str
    description: Optional[str]
    drive_date: Optional[date]
    venue: Optional[str]
    package: Optional[str]
    is_published: bool
    is_active: bool
    registration_open: bool
    circular_file_path: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True   # ✅ Pydantic v2 fix


# ===== COMPREHENSIVE DRIVE CREATION WITH ALL RELATED DATA =====

class RoundInfo(BaseModel):
    round_number: int
    round_name: str
    mode: Optional[str] = None
    remarks: Optional[str] = None
    round_date: Optional[date] = None


class WorkflowInfo(BaseModel):
    description: str
    total_rounds: int
    rounds: List[RoundInfo] = []


class EligibilityInfo(BaseModel):
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    min_backlogs: Optional[int] = None
    allowed_branches: Optional[str] = None
    gender_restriction: Optional[str] = None
    min_batch: Optional[int] = None
    max_batch: Optional[int] = None
    other_criteria: Optional[str] = None


class DriveCreateComplete(BaseModel):
    """Complete drive creation with eligibility, workflow, and rounds"""
    # Drive details
    company_id: int
    title: str
    description: Optional[str] = None
    drive_date: Optional[date] = None
    venue: Optional[str] = None
    package: Optional[str] = None
    is_published: bool = False
    is_active: bool = True
    registration_open: bool = True
    
    # Eligibility rules
    eligibility: Optional[EligibilityInfo] = None
    
    # Workflow and rounds
    workflow: Optional[WorkflowInfo] = None