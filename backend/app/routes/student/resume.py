from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
from datetime import datetime
import shutil

from app.database import get_db
from app.models.student_resume import StudentResume
from app.schemas.student_resume import StudentResumeResponse

router = APIRouter(prefix="/student", tags=["Student Resume"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_extension(filename: str) -> str:
    """Extract file extension"""
    return filename.rsplit(".", 1)[1].lower() if "." in filename else ""


# ✅ UPLOAD RESUME
@router.post("/resume/upload", response_model=StudentResumeResponse)
async def upload_resume(
    student_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload resume for a student.
    - student_id: ID from SIS module
    - file: PDF file
    
    Returns: Resume details
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files allowed. Please upload a PDF resume."
            )
        
        # Check if student already has a resume
        existing_resume = db.query(StudentResume).filter(
            StudentResume.student_id == student_id
        ).first()
        
        # Create new filename: {student_id}_resume.pdf
        file_extension = get_file_extension(file.filename)
        new_filename = f"{student_id}_resume.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)

        if existing_resume:
            # Delete old file if it exists and path is different
            try:
                if os.path.exists(existing_resume.file_path) and existing_resume.file_path != file_path:
                    os.remove(existing_resume.file_path)
            except Exception as e:
                print(f"Warning: Could not delete old resume file: {str(e)}")
        
        # Save file to disk
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving file: {str(e)}"
            )
        
        if existing_resume:
            # Update existing database entry
            existing_resume.file_path = file_path
            existing_resume.original_filename = file.filename
            existing_resume.is_active = True
            db.commit()
            db.refresh(existing_resume)
            return existing_resume
        else:
            # Create new database entry
            new_resume = StudentResume(
                student_id=student_id,
                file_path=file_path,
                original_filename=file.filename,
                is_active=True
            )
            
            db.add(new_resume)
            db.commit()
            db.refresh(new_resume)
            
            return new_resume
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading resume: {str(e)}"
        )


# 📥 GET RESUME (Download)
@router.get("/resume/{student_id}", response_model=StudentResumeResponse)
def get_resume(student_id: int, db: Session = Depends(get_db)):
    """
    Get active resume for a student.
    
    Returns: Resume details with file path
    """
    resume = db.query(StudentResume).filter(
        StudentResume.student_id == student_id,
        StudentResume.is_active == True
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=404,
            detail=f"No active resume found for student {student_id}"
        )
    
    # Check if file still exists
    if not os.path.exists(resume.file_path):
        raise HTTPException(
            status_code=404,
            detail="Resume file not found on server"
        )
    
    return resume


# 📋 GET ALL RESUMES (Admin only)
@router.get("/resumes/all", response_model=list)
def get_all_resumes(db: Session = Depends(get_db)):
    """
    Get all resumes across all students (Admin endpoint).
    
    Returns: List of all resume entries
    """
    resumes = db.query(StudentResume).order_by(StudentResume.uploaded_at.desc()).all()
    return resumes


# ✅ CHECK IF STUDENT HAS RESUME
@router.get("/resume/check/{student_id}")
def check_resume_exists(student_id: int, db: Session = Depends(get_db)):
    """
    Check if student has an active resume.
    
    Returns: {"has_resume": boolean, "resume_id": int or null}
    """
    resume = db.query(StudentResume).filter(
        StudentResume.student_id == student_id,
        StudentResume.is_active == True
    ).first()
    
    return {
        "has_resume": resume is not None,
        "resume_id": resume.id if resume else None,
        "student_id": student_id,
        "file_path": resume.file_path if resume else None
    }
