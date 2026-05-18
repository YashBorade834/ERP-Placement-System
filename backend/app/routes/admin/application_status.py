from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import Optional
from app.utils.notification import send_student_notification

from app.database import get_db
from app.models.application_status import ApplicationStatus
from app.models.student_application import StudentApplication
from app.models.drive import PlacementDrive
from app.models.workflow import Workflow
from app.models.drive_round import DriveRound
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

    result = []
    from app.config import SIS_BASE_URL
    import requests
    
    for app in applications:
        student_name = "Student " + str(app.student_id)
        try:
            sis_url = f"{SIS_BASE_URL}/api/students/{app.student_id}"
            sis_res = requests.get(sis_url, timeout=1)
            if sis_res.status_code == 200:
                sis_data = sis_res.json()
                if isinstance(sis_data, list) and len(sis_data) > 0:
                    sis_data = sis_data[0]
                student_name = f"{sis_data.get('first_name', '')} {sis_data.get('last_name', '')}".strip() or student_name
        except:
            pass
            
        app_dict = {
            "id": app.id,
            "student_id": app.student_id,
            "student_name": student_name,
            "drive_id": app.drive_id,
            "drive_title": app.drive.title if app.drive else "N/A",
            "application_status": app.application_status,
            "applied_at": app.applied_at
        }
        result.append(app_dict)

    return result


# ✅ GET ROUND-WISE STATUSES FOR AN APPLICATION
@router.get("/{application_id}/round-statuses")
def get_round_statuses(application_id: int, db: Session = Depends(get_db)):
    """
    Returns all rounds for the drive associated with this application,
    along with the current status for each round (defaults to APPLIED if not set).
    """
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Get workflow for this drive
    workflow = db.query(Workflow).filter(
        Workflow.drive_id == app.drive_id
    ).first()

    if not workflow:
        return []  # No rounds defined for this drive

    # Get all active rounds ordered by round_number
    rounds = db.query(DriveRound).filter(
        DriveRound.workflow_id == workflow.id,
        DriveRound.is_active == True
    ).order_by(DriveRound.round_number).all()

    result = []
    for r in rounds:
        # Get latest status for this application + round
        status_record = (
            db.query(ApplicationStatus)
            .filter(
                ApplicationStatus.application_id == application_id,
                ApplicationStatus.drive_round_id == r.id,
            )
            .order_by(ApplicationStatus.id.desc())
            .first()
        )
        result.append({
            "round_id": r.id,
            "round_number": r.round_number,
            "round_name": r.round_name,
            "mode": r.mode,
            "remarks_description": r.remarks,
            "status": status_record.status if status_record else "APPLIED",
            "remarks": status_record.remarks if status_record else "",
            "status_id": status_record.id if status_record else None,
        })

    return result


# ✅ UPSERT STATUS FOR A SPECIFIC ROUND (Create or Update)
@router.post("/{application_id}/round/{round_id}/status")
def set_round_status(
    application_id: int,
    round_id: int,
    status: str,
    background_tasks: BackgroundTasks,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Upsert status for a specific round of an application.
    If a status already exists for (application_id + round_id), update it.
    Otherwise create a new one.
    """
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    round_obj = db.query(DriveRound).filter(DriveRound.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")

    # Try to find an existing status record for this application + round
    existing = (
        db.query(ApplicationStatus)
        .filter(
            ApplicationStatus.application_id == application_id,
            ApplicationStatus.drive_round_id == round_id,
        )
        .order_by(ApplicationStatus.id.desc())
        .first()
    )

    if existing:
        # Update the existing record
        existing.status = status
        existing.remarks = remarks
        existing.status_date = date.today()
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "application_id": application_id,
            "drive_round_id": round_id,
            "status": existing.status,
            "remarks": existing.remarks,
            "status_date": existing.status_date,
            "updated": True,
        }
    else:
        # Create a new record
        new_status = ApplicationStatus(
            application_id=application_id,
            drive_round_id=round_id,
            status=status,
            remarks=remarks,
            status_date=date.today(),
        )
        db.add(new_status)
        db.commit()
        db.refresh(new_status)

        # Trigger Notification
        background_tasks.add_task(
            send_student_notification,
            student_id=app.student_id,
            event_type="Application Update",
            title=f"Update on your Application - {round_obj.round_name}",
            message=f"Your status for {round_obj.round_name} has been updated to: {status}. {remarks if remarks else ''}"
        )

        return {
            "id": new_status.id,
            "application_id": application_id,
            "drive_round_id": round_id,
            "status": new_status.status,
            "remarks": new_status.remarks,
            "status_date": new_status.status_date,
            "updated": False,
        }

# 🚀 CREATE STATUS (Admin sets application status)
@router.post("/{application_id}/status", response_model=ApplicationStatusResponse)
def set_application_status(
    application_id: int,
    drive_round_id: int,
    status: str,
    background_tasks: BackgroundTasks,
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
    
    # Trigger Notification
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
    drive_title = drive.title if drive else "Placement Drive"
    background_tasks.add_task(
        send_student_notification,
        student_id=app.student_id,
        event_type="Application Update",
        title=f"Update on your Application - {drive_title}",
        message=f"Your application status for {drive_title} has been updated to: {status}. {remarks if remarks else ''}"
    )
    
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
def shortlist(
    application_id: int, 
    background_tasks: BackgroundTasks,
    remarks: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Shortlist a student for further rounds"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get Drive Title
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
    drive_title = drive.title if drive else "Placement Drive"

    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="SHORTLISTED",
        remarks=remarks or "Shortlisted for next round",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()

    # Trigger Notification
    background_tasks.add_task(
        send_student_notification,
        student_id=app.student_id,
        event_type="Application Shortlisted",
        title=f"Shortlisted for {drive_title}",
        message=f"Congratulations! You have been shortlisted for the next round of {drive_title}. {remarks or ''}"
    )

    return {"message": "Student shortlisted ✓"}


# ❌ REJECT
@router.post("/{application_id}/reject")
def reject(
    application_id: int, 
    background_tasks: BackgroundTasks,
    remarks: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Reject a student application"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get Drive Title
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
    drive_title = drive.title if drive else "Placement Drive"

    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="REJECTED",
        remarks=remarks or "Not selected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()

    # Trigger Notification
    background_tasks.add_task(
        send_student_notification,
        student_id=app.student_id,
        event_type="Application Update",
        title=f"Update for {drive_title}",
        message=f"We regret to inform you that your application for {drive_title} was not selected. {remarks or ''}"
    )

    return {"message": "Student rejected ✗"}


# 🎉 SELECT (FINAL OFFER)
@router.post("/{application_id}/select")
def select(
    application_id: int, 
    background_tasks: BackgroundTasks,
    remarks: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Select/Offer a student"""
    app = db.query(StudentApplication).filter(
        StudentApplication.id == application_id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get Drive Title
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
    drive_title = drive.title if drive else "Placement Drive"

    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="SELECTED",
        remarks=remarks or "Congratulations! You are selected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()

    # Trigger Notification
    background_tasks.add_task(
        send_student_notification,
        student_id=app.student_id,
        event_type="Placement Selection",
        title=f"Congratulations! Selected for {drive_title}",
        message=f"We are pleased to inform you that you have been selected for {drive_title}. {remarks or ''}"
    )

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
    from app.config import SIS_BASE_URL
    import requests
    
    for app in apps:
        student_name = "Student " + str(app[1])
        try:
            sis_url = f"{SIS_BASE_URL}/api/students/{app[1]}"
            sis_res = requests.get(sis_url, timeout=1)
            if sis_res.status_code == 200:
                sis_data = sis_res.json()
                if isinstance(sis_data, list) and len(sis_data) > 0:
                    sis_data = sis_data[0]
                student_name = f"{sis_data.get('first_name', '')} {sis_data.get('last_name', '')}".strip() or student_name
        except:
            pass

        result.append(
            {
                "id": app[0],
                "student_id": app[1],
                "student_name": student_name,
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