from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from datetime import datetime, date
from app.database import get_db
from app.models.student_application import StudentApplication
from app.models.drive import PlacementDrive
from app.models.eligibility import EligibilityRule
from app.models.company import Company
from app.models.application_status import ApplicationStatus, ApplicationStatusEnum
from app.models.student_academic import StudentAcademic
from app.models.workflow import Workflow
from app.models.drive_round import DriveRound

from app.schemas.student_application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationDetailResponse,
    EligibilityCheckRequest,
)

router = APIRouter(prefix="/student", tags=["Student"])


# ✅ GET ALL ACTIVE DRIVES (Published & Active)
@router.get("/drives")
def get_active_drives(db: Session = Depends(get_db)):
    """
    Get all drives that are published and active (available for students to apply)
    """
    drives = (
        db.query(
            PlacementDrive.id,
            PlacementDrive.title,
            PlacementDrive.description,
            PlacementDrive.drive_date,
            PlacementDrive.venue,
            PlacementDrive.package,
            PlacementDrive.company_id,
            Company.name.label("company_name"),
            Company.industry,
            Company.address,
            EligibilityRule.id.label("eligibility_id"),
            EligibilityRule.min_cgpa,
            EligibilityRule.max_backlogs,
            EligibilityRule.min_backlogs,
            EligibilityRule.allowed_branches,
            EligibilityRule.gender_restriction,
            EligibilityRule.min_batch,
            EligibilityRule.max_batch,
            EligibilityRule.other_criteria,
            Workflow.id.label("workflow_id"),
            Workflow.description.label("workflow_description"),
            Workflow.total_rounds,
        )
        .join(Company, PlacementDrive.company_id == Company.id)
        .outerjoin(EligibilityRule, PlacementDrive.id == EligibilityRule.drive_id)
        .outerjoin(Workflow, PlacementDrive.id == Workflow.drive_id)
        .filter(PlacementDrive.is_published == True, PlacementDrive.is_active == True)
        .all()
    )

    result = []
    for drive in drives:
        result.append(
            {
                "id": drive[0],
                "title": drive[1],
                "description": drive[2],
                "drive_date": drive[3],
                "venue": drive[4],
                "package": drive[5],
                "company_id": drive[6],
                "company_name": drive[7],
                "industry": drive[8],
                "address": drive[9],
                "eligibility": {
                    "id": drive[10],
                    "min_cgpa": drive[11],
                    "max_backlogs": drive[12],
                    "min_backlogs": drive[13],
                    "allowed_branches": drive[14],
                    "gender_restriction": drive[15],
                    "min_batch": drive[16],
                    "max_batch": drive[17],
                    "other_criteria": drive[18],
                }
                if drive[10]
                else None,
                "workflow": {
                    "id": drive[19],
                    "description": drive[20],
                    "total_rounds": drive[21],
                    "rounds": []
                } if drive[19] else None
            }
        )

    # ✅ Fetch rounds for each drive that has a workflow
    for drive_item in result:
        if drive_item["workflow"]:
            rounds = db.query(DriveRound).filter(
                DriveRound.workflow_id == drive_item["workflow"]["id"],
                DriveRound.is_active == True
            ).order_by(DriveRound.round_number).all()
            
            drive_item["workflow"]["rounds"] = [
                {
                    "id": r.id,
                    "round_number": r.round_number,
                    "round_name": r.round_name,
                    "mode": r.mode,
                    "remarks": r.remarks,
                    "round_date": r.round_date.isoformat() if r.round_date else None
                } for r in rounds
            ]

    return result


# ✅ CHECK ELIGIBILITY (Before applying)
@router.post("/check-eligibility")
async def check_eligibility(data: EligibilityCheckRequest, db: Session = Depends(get_db)):
    """
    Check if student meets drive eligibility criteria.
    Returns eligibility status and any mismatches.
    """
    # Get drive eligibility
    eligibility = (
        db.query(EligibilityRule)
        .filter(EligibilityRule.drive_id == data.drive_id)
        .first()
    )

    if not eligibility:
        # No eligibility rules set = everyone eligible
        return {
            "eligible": True,
            "message": "No specific eligibility rules set for this drive",
            "mismatches": [],
        }

    # --- 1. LOCAL ACADEMIC DATA ---
    academic = db.query(StudentAcademic).filter(StudentAcademic.student_id == data.student_id).first()
    cgpa = academic.cgpa if academic and academic.cgpa else 0.0
    backlogs = academic.current_backlogs if academic else 0
    local_batch = academic.batch_year if academic else None
    local_gender = academic.gender if academic else None

    try:
        sis_data = await SISClient().get_student_details(data.student_id)
        if sis_data:
            branch = sis_data.get("enrollment", {}).get("department", "UNKNOWN")
            batch_str = sis_data.get("enrollment", {}).get("batch", "0")
            try:
                batch = int(batch_str) if batch_str else 0
            except ValueError:
                batch = 0
            gender = sis_data.get("gender", "UNKNOWN")
            student_data = {
                "student_id": data.student_id,
                "cgpa": cgpa,
                "backlogs": backlogs,
                "branch": branch,
                "batch": local_batch if local_batch else batch,
                "gender": local_gender if local_gender else gender,
            }
        else:
            raise Exception("No SIS data")
    except Exception as e:
        # Fallback to local data
        student_data = {
            "student_id": data.student_id,
            "cgpa": cgpa,
            "backlogs": backlogs,
            "branch": "UNKNOWN",
            "batch": local_batch if local_batch else 0,
            "gender": local_gender if local_gender else "UNKNOWN",
        }

    mismatches = []
    # Check CGPA
    if eligibility.min_cgpa and student_data["cgpa"] < eligibility.min_cgpa:
        mismatches.append(f"CGPA: Need minimum {eligibility.min_cgpa}, yours is {student_data['cgpa']}")
    # Check Backlogs
    if eligibility.max_backlogs is not None and student_data["backlogs"] > eligibility.max_backlogs:
        mismatches.append(f"Backlogs: Maximum allowed {eligibility.max_backlogs}, you have {student_data['backlogs']}")
    # Check Branch
    if eligibility.allowed_branches:
        allowed = [b.strip().upper() for b in eligibility.allowed_branches.split(",")]
        if student_data["branch"].upper() not in allowed:
            mismatches.append(f"Branch: You are {student_data['branch']}, allowed are {eligibility.allowed_branches}")
    # Check Batch
    if eligibility.min_batch and student_data["batch"] < eligibility.min_batch:
        mismatches.append(f"Batch: Minimum {eligibility.min_batch}, you are {student_data['batch']}")
    if eligibility.max_batch and student_data["batch"] > eligibility.max_batch:
        mismatches.append(f"Batch: Maximum {eligibility.max_batch}, you are {student_data['batch']}")
    # Check Gender
    if eligibility.gender_restriction and eligibility.gender_restriction.upper() != "ANY":
        if student_data["gender"].upper() != eligibility.gender_restriction.upper():
            mismatches.append(f"Gender: Required {eligibility.gender_restriction}, you are {student_data['gender']}")
    
    eligible = len(mismatches) == 0
    return {
        "eligible": eligible,
        "message": "Eligible to apply ✓" if eligible else "Not eligible due to the following mismatches:",
        "mismatches": mismatches,
    }


# ✅ APPLY FOR DRIVE (WITH ELIGIBILITY CHECK)
@router.post("/apply", response_model=dict)
async def apply_drive(data: ApplicationCreate, db: Session = Depends(get_db)):
    """
    Apply for a drive with automatic eligibility checking
    """
    student_id = data.student_id
    # 🔹 Check drive exists and is available
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == data.drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if not drive.is_active:
        raise HTTPException(status_code=400, detail="Drive is not active")
    if not drive.is_published:
        raise HTTPException(status_code=400, detail="Drive not published")
    if not drive.registration_open:
        raise HTTPException(status_code=400, detail="Registration closed for this drive")
    # 🔹 Check duplicate application
    existing = (
        db.query(StudentApplication)
        .filter(
            StudentApplication.student_id == student_id,
            StudentApplication.drive_id == data.drive_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already applied for this drive")
    # 🔹 Check eligibility (call eligibility check)
    eligibility_check = await check_eligibility(
        EligibilityCheckRequest(student_id=student_id, drive_id=data.drive_id),
        db,
    )
    if not eligibility_check["eligible"]:
        raise HTTPException(
            status_code=400,
            detail=f"Not eligible: {', '.join(eligibility_check['mismatches'])}",
        )
    # 🔹 Create application
    new_app = StudentApplication(
        student_id=student_id,
        drive_id=data.drive_id,
        applied_at=datetime.utcnow(),
        application_status=ApplicationStatusEnum.applied,
        is_active=True,
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return {
        "success": True,
        "message": "Applied successfully! ✓",
        "application_id": new_app.id,
        "applied_at": new_app.applied_at,
    }


# ✅ GET MY APPLICATIONS (WITH DRIVE DETAILS)
@router.get("/applications/{student_id}", response_model=list)
def get_my_applications(student_id: int, db: Session = Depends(get_db)):
    """
    Get all applications for a student with drive details and latest status
    """
    from app.models.application_status import ApplicationStatus
    from sqlalchemy import func

    apps = (
        db.query(
            StudentApplication.id,
            StudentApplication.student_id,
            StudentApplication.drive_id,
            StudentApplication.application_status,
            StudentApplication.is_active,
            StudentApplication.applied_at,
            StudentApplication.feedback,
            StudentApplication.created_at,
            PlacementDrive.title,
            PlacementDrive.venue,
            PlacementDrive.drive_date,
            Company.name.label("company_name"),
            func.coalesce(ApplicationStatus.status, StudentApplication.application_status).label("latest_status"),
            ApplicationStatus.remarks,
        )
        .join(PlacementDrive, StudentApplication.drive_id == PlacementDrive.id)
        .join(Company, PlacementDrive.company_id == Company.id)
        .outerjoin(
            ApplicationStatus,
            and_(
                ApplicationStatus.application_id == StudentApplication.id,
                ApplicationStatus.id == (
                    db.query(func.max(ApplicationStatus.id))
                    .filter(ApplicationStatus.application_id == StudentApplication.id)
                    .correlate(StudentApplication)
                    .scalar_subquery()
                )
            )
        )
        .filter(StudentApplication.student_id == student_id)
        .all()
    )

    result = []
    for app in apps:
        result.append(
            {
                "id": app[0],
                "student_id": app[1],
                "drive_id": app[2],
                "application_status": app[12],  # Use latest_status
                "is_active": app[4],
                "applied_at": app[5],
                "feedback": app[6] or app[13],  # Use remarks if no feedback
                "created_at": app[7],
                "drive_title": app[8],
                "venue": app[9],
                "drive_date": app[10],
                "company_name": app[11],
            }
        )

    return result


# 📊 GET ALL APPLICATIONS (For Admins) - MUST BE BEFORE /{application_id} to avoid route conflict
@router.get("/application/all", response_model=list)
async def get_all_applications(db: Session = Depends(get_db)):
    """
    Get all student applications with drive details and latest status (For Admin Dashboard)
    """
    try:
        # Get all student applications
        all_apps = db.query(StudentApplication).order_by(StudentApplication.applied_at.desc()).all()
        
        result = []
        for app in all_apps:
            # Get drive details
            drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
            company = db.query(Company).filter(Company.id == drive.company_id).first() if drive else None
            
            # Get latest application status
            latest_status = db.query(ApplicationStatus).filter(
                ApplicationStatus.application_id == app.id
            ).order_by(ApplicationStatus.id.desc()).first()
            
            result.append({
                "id": app.id,
                "student_id": app.student_id,
                "drive_id": app.drive_id,
                "application_status": latest_status.status if latest_status else app.application_status,
                "is_active": app.is_active,
                "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                "feedback": app.feedback,
                "created_at": app.created_at.isoformat() if app.created_at else None,
                "drive_title": drive.title if drive else "N/A",
                "venue": drive.venue if drive else "N/A",
                "drive_date": drive.drive_date.isoformat() if drive and drive.drive_date else None,
                "company_name": company.name if company else "N/A",
                "remarks": latest_status.remarks if latest_status else None,
                "status_date": latest_status.status_date.isoformat() if latest_status and latest_status.status_date else None,
            })
        
        return result
    except Exception as e:
        print(f"Error in get_all_applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ✅ GET SINGLE APPLICATION
@router.get("/application/{application_id}", response_model=dict)
def get_application(application_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about an application
    """

    app = (
        db.query(StudentApplication)
        .filter(StudentApplication.id == application_id)
        .first()
    )

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "id": app.id,
        "student_id": app.student_id,
        "drive_id": app.drive_id,
        "application_status": app.application_status,
        "is_active": app.is_active,
        "applied_at": app.applied_at,
        "feedback": app.feedback,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
    }


# ✅ WITHDRAW APPLICATION
@router.put("/application/{application_id}/withdraw")
def withdraw_application(application_id: int, db: Session = Depends(get_db)):
    """
    Student can withdraw their application
    """

    app = (
        db.query(StudentApplication)
        .filter(StudentApplication.id == application_id)
        .first()
    )

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app.is_active:
        raise HTTPException(status_code=400, detail="Application already withdrawn")

    app.is_active = False
    app.application_status = ApplicationStatusEnum.withdrawn
    
    # 2. Add an explicit 'WITHDRAWN' entry to the application_status table
    # This keeps history (e.g. Applied -> Shortlisted -> Withdrawn)
    db.commit()

    return {"message": "Application withdrawn successfully"}



@router.get("/drive/{drive_id}/eligibility/{student_id}")
def check_eligibility_simple(drive_id: int, student_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(
        PlacementDrive.id == drive_id
    ).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    # 🔹 Dummy eligibility (upgrade later)
    return {
        "student_id": student_id,
        "drive_id": drive_id,
        "eligible": True,
        "message": "Eligible (default logic)"
    }
