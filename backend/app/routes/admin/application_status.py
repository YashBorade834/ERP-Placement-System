from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import Optional

from app.database import get_db
from app.models.application_status import ApplicationStatus
from app.models.student_application import StudentApplication
from app.schemas.application_status import (
    ApplicationStatusCreate,
    ApplicationStatusUpdate,
    ApplicationStatusResponse
)

router = APIRouter(prefix="", tags=["Admin - Application Status"])

@router.get("/admin/applications")
def get_all_applications(db: Session = Depends(get_db)):
    applications = db.query(StudentApplication)\
        .options(joinedload(StudentApplication.student))\
        .options(joinedload(StudentApplication.drive))\
        .all()

    return applications

# 🚀 CREATE STATUS (Admin sets application status)
@router.post("/{application_id}/status", response_model=ApplicationStatusResponse)
def set_application_status(
    application_id: int,
    drive_round_id: int,
    status: str,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Admin sets application status for a specific round.
    Status examples: PENDING, SHORTLISTED, SELECTED, REJECTED, etc.
    """
    
    # Verify application exists
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Create new status entry
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=drive_round_id,
        status=status,
        remarks=remarks,
        status_date=date.today()
    )
    
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    return obj


# 📊 GET ALL APPLICATIONS COUNT (For Dashboard)
@router.get("/applications/count")
def get_applications_count(db: Session = Depends(get_db)):
    """Get total count of all applications across all drives"""
    count = db.query(StudentApplication).count()
    return {"total_applications": count}


# 📊 GET ALL STATUSES
@router.get("/", response_model=list[ApplicationStatusResponse])
def get_all_status(db: Session = Depends(get_db)):
    """Get all application statuses"""
    return db.query(ApplicationStatus).all()


# 🔍 GET STATUSES BY APPLICATION
@router.get("/{application_id}/statuses", response_model=list[ApplicationStatusResponse])
def get_by_application(application_id: int, db: Session = Depends(get_db)):
    """Get all status entries for an application"""
    return db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == application_id
    ).order_by(ApplicationStatus.id.desc()).all()


# 🎯 GET LATEST STATUS FOR APPLICATION
@router.get("/{application_id}/status/latest")
def get_latest_status(application_id: int, db: Session = Depends(get_db)):
    """Get the latest status for an application"""
    status = db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == application_id
    ).order_by(ApplicationStatus.id.desc()).first()

    if not status:
        return {
            "id": None,
            "application_id": application_id,
            "status": "APPLIED",
            "remarks": "Application submitted",
            "status_date": date.today(),
            "drive_round_id": None,
        }

    return {
        "id": status.id,
        "application_id": status.application_id,
        "status": status.status,
        "remarks": status.remarks,
        "status_date": status.status_date,
        "drive_round_id": status.drive_round_id,
    }


# ✅ SHORTLIST
@router.post("/{application_id}/shortlist")
def shortlist(application_id: int, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    """Shortlist a student for further rounds"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="SHORTLISTED",
        remarks=remarks or "Shortlisted for next round",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student shortlisted ✓"}


# ❌ REJECT
@router.post("/{application_id}/reject")
def reject(application_id: int, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    """Reject a student application"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="REJECTED",
        remarks=remarks or "Not selected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student rejected ✗"}


# 🎉 SELECT (FINAL OFFER)
@router.post("/{application_id}/select")
def select(application_id: int, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    """Select/Offer a student"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="SELECTED",
        remarks=remarks or "Congratulations! You are selected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student selected! 🎉"}


# 📊 GET ALL APPLICATIONS FOR A DRIVE (For Admin Dashboard)
@router.get("/drive/{drive_id}/applications")
def get_applications_for_drive(drive_id: int, db: Session = Depends(get_db)):
    """
    Get all applications for a specific drive with latest status.
    Used by admin to manage application statuses.
    """
    from app.models.drive import PlacementDrive
    from app.models.company import Company
    from sqlalchemy import func
    
    # Verify drive exists
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    # Get all applications for this drive with latest status
    apps = (
        db.query(
            StudentApplication.id,
            StudentApplication.student_id,
            StudentApplication.drive_id,
            StudentApplication.application_status,
            StudentApplication.is_active,
            StudentApplication.applied_at,
            StudentApplication.feedback,
            PlacementDrive.title,
            Company.name.label("company_name"),
            func.coalesce(ApplicationStatus.status, StudentApplication.application_status).label("latest_status"),
            ApplicationStatus.remarks,
            ApplicationStatus.status_date,
            ApplicationStatus.id.label("status_id"),
        )
        .join(PlacementDrive, StudentApplication.drive_id == PlacementDrive.id)
        .join(Company, PlacementDrive.company_id == Company.id)
        .outerjoin(
            ApplicationStatus,
            db.and_(
                ApplicationStatus.application_id == StudentApplication.id,
                ApplicationStatus.id == (
                    db.query(func.max(ApplicationStatus.id))
                    .filter(ApplicationStatus.application_id == StudentApplication.id)
                    .correlate(StudentApplication)
                    .scalar_subquery()
                )
            )
        )
        .filter(StudentApplication.drive_id == drive_id)
        .all()
    )
    
    result = []
    for app in apps:
        result.append(
            {
                "id": app[0],
                "student_id": app[1],
                "drive_id": app[2],
                "application_status": app[9],  # latest_status
                "is_active": app[4],
                "applied_at": app[5],
                "feedback": app[6],
                "drive_title": app[7],
                "company_name": app[8],
                "remarks": app[10],
                "status_date": app[11],
                "status_id": app[12],
            }
        )
    
    return result