from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StudentResumeResponse(BaseModel):
    id: int
    student_id: int
    file_path: str
    original_filename: Optional[str]
    uploaded_at: Optional[datetime] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentResumeCreate(BaseModel):
    student_id: int


class StudentResumeUpdate(BaseModel):
    student_id: int
    original_filename: Optional[str]
