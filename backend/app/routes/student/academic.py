from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student_academic import StudentAcademic
from app.schemas.student_academic import AcademicCreate, AcademicUpdate, AcademicResponse

router = APIRouter(prefix="/student/academic", tags=["Student Academic Profile"])

@router.get("/{student_id}", response_model=AcademicResponse)
async def get_academic_profile(student_id: int, db: Session = Depends(get_db)):
    academic = db.query(StudentAcademic).filter(StudentAcademic.student_id == student_id).first()
    
    if not academic:
        # Fallback: Check SIS Module using SISService
        from app.utils.sis_service import SISService
        sis_data = await SISService.get_student_details(student_id)
        
        if sis_data:
            # Student found in SIS! Create local record automatically
            # Create default placement record for this student
            academic = StudentAcademic(
                student_id=student_id,
                cgpa=None, 
                current_backlogs=0,
                history_backlogs=0,
                tenth_marks=None,
                twelfth_marks=None,
                batch_year=None,
                gender=None
            )
            db.add(academic)
            db.commit()
            db.refresh(academic)
            return academic

        raise HTTPException(status_code=404, detail=f"Student {student_id} not found in Placement or SIS records.")
    
    return academic

@router.post("/", response_model=AcademicResponse)
def create_or_update_academic_profile(data: AcademicCreate, db: Session = Depends(get_db)):
    academic = db.query(StudentAcademic).filter(StudentAcademic.student_id == data.student_id).first()
    
    if academic:
        # Update
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(academic, key, value)
    else:
        # Create
        academic = StudentAcademic(**data.model_dump())
        db.add(academic)
        
    db.commit()
    db.refresh(academic)
    return academic
