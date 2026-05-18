from pydantic import BaseModel
from typing import Optional

class AcademicBase(BaseModel):
    cgpa: Optional[float] = None
    current_backlogs: Optional[int] = 0
    history_backlogs: Optional[int] = 0
    tenth_marks: Optional[float] = None
    twelfth_marks: Optional[float] = None
    diploma_marks: Optional[float] = None
    batch_year: Optional[int] = None
    gender: Optional[str] = None

class AcademicCreate(AcademicBase):
    student_id: int

class AcademicUpdate(AcademicBase):
    pass

class AcademicResponse(AcademicBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True
