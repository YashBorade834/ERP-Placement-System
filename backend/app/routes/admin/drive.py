from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.drive import PlacementDrive
from app.models.eligibility import EligibilityRule
from app.models.workflow import Workflow
from app.models.drive_round import DriveRound
from app.schemas.drive import DriveCreate, DriveUpdate, DriveResponse, DriveCreateComplete

router = APIRouter(tags=["Admin - Drive"])


# 🔹 DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ CREATE DRIVE
@router.post("/", response_model=DriveResponse)
def create_drive(data: DriveCreate, db: Session = Depends(get_db)):
    drive = PlacementDrive(**data.model_dump())
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return drive


# ✅ GET ALL DRIVES
@router.get("/", response_model=list[DriveResponse])
def get_all_drives(db: Session = Depends(get_db)):
    return db.query(PlacementDrive).all()


# ✅ GET DRIVE BY ID
@router.get("/{drive_id}", response_model=DriveResponse)
def get_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive


# ✅ UPDATE DRIVE (PARTIAL)
@router.put("/{drive_id}", response_model=DriveResponse)
def update_drive(drive_id: int, data: DriveUpdate, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(drive, key, value)

    db.commit()
    db.refresh(drive)
    return drive


# ✅ DELETE DRIVE
@router.delete("/{drive_id}")
def delete_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    db.delete(drive)
    db.commit()
    return {"message": "Drive deleted successfully"}


# 🔥 PUBLISH DRIVE
@router.put("/{drive_id}/publish")
def publish_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    drive.is_published = True
    db.commit()
    return {"message": "Drive published"}


# 🔥 UNPUBLISH DRIVE
@router.put("/{drive_id}/unpublish")
def unpublish_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    drive.is_published = False
    db.commit()
    return {"message": "Drive unpublished"}


# 🔥 OPEN REGISTRATION
@router.put("/{drive_id}/open-registration")
def open_registration(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    drive.registration_open = True
    db.commit()
    return {"message": "Registration opened"}


# 🔥 CLOSE REGISTRATION
@router.put("/{drive_id}/close-registration")
def close_registration(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()

    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    drive.registration_open = False
    db.commit()
    return {"message": "Registration closed"}


# 🎯 CREATE COMPLETE DRIVE WITH ELIGIBILITY, WORKFLOW & ROUNDS
@router.post("/complete/create", response_model=dict)
def create_complete_drive(data: DriveCreateComplete, db: Session = Depends(get_db)):
    """
    Create a placement drive with eligibility rules, workflow, and drive rounds in one go
    """
    try:
        # 1️⃣ Create the main drive
        drive = PlacementDrive(
            company_id=data.company_id,
            title=data.title,
            description=data.description,
            drive_date=data.drive_date,
            venue=data.venue,
            is_published=data.is_published,
            is_active=data.is_active,
            registration_open=data.registration_open,
        )
        db.add(drive)
        db.commit()
        db.refresh(drive)

        # 2️⃣ Create eligibility rules if provided
        if data.eligibility:
            eligibility = EligibilityRule(
                drive_id=drive.id,
                min_cgpa=data.eligibility.min_cgpa,
                max_backlogs=data.eligibility.max_backlogs,
                min_backlogs=data.eligibility.min_backlogs,
                allowed_branches=data.eligibility.allowed_branches,
                gender_restriction=data.eligibility.gender_restriction,
                min_batch=data.eligibility.min_batch,
                max_batch=data.eligibility.max_batch,
                other_criteria=data.eligibility.other_criteria,
            )
            db.add(eligibility)
            db.commit()

        # 3️⃣ Create workflow if provided
        workflow = None
        if data.workflow:
            workflow = Workflow(
                drive_id=drive.id,
                description=data.workflow.description,
                total_rounds=data.workflow.total_rounds,
            )
            db.add(workflow)
            db.commit()
            db.refresh(workflow)

            # 4️⃣ Create drive rounds if workflow has rounds
            if workflow and data.workflow.rounds:
                for round_data in data.workflow.rounds:
                    round_obj = DriveRound(
                        workflow_id=workflow.id,
                        round_number=round_data.round_number,
                        round_name=round_data.round_name,
                        mode=round_data.mode,
                        remarks=round_data.remarks,
                        round_date=round_data.round_date,
                    )
                    db.add(round_obj)
                db.commit()

        return {
            "message": "Drive created successfully with all related data",
            "drive_id": drive.id,
            "drive": {
                "id": drive.id,
                "title": drive.title,
                "company_id": drive.company_id,
                "venue": drive.venue,
            },
            "workflow_id": workflow.id if workflow else None,
            "rounds_created": len(data.workflow.rounds) if data.workflow else 0,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating drive: {str(e)}")