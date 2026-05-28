from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.dependencies.auth import get_current_user, require_admin 
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.drive import PlacementDrive
from app.models.eligibility import EligibilityRule
from app.models.workflow import Workflow
from app.models.drive_round import DriveRound
from app.schemas.drive import DriveCreate, DriveUpdate, DriveResponse, DriveCreateComplete
from app.utils.notification import send_bulk_notification

router = APIRouter(tags=["Admin - Drive"], dependencies=[Depends(require_admin)])


# 🔹 DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🎯 CREATE COMPLETE DRIVE WITH ELIGIBILITY, WORKFLOW & ROUNDS (MUST BE BEFORE /{drive_id})
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
            package=data.package,
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


# ✅ CREATE DRIVE (basic)
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


# 🔥 PUBLISH DRIVE
@router.put("/publish/{drive_id}")
async def publish_drive(drive_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    drive.is_published = True
    db.commit()

    # Trigger Bulk Notification
    background_tasks.add_task(
        send_bulk_notification,
        event_type="New Drive Arrived",
        title="Apply Now",
        message="Apply Now For a Drive",
        recipient_roles=["student"],
        delivery_modes=["email", "sms", "whatsapp"],
        department="BSc CS"
    )

    return {"message": "Drive published"}


# 🔥 UNPUBLISH DRIVE
@router.put("/unpublish/{drive_id}")
def unpublish_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    drive.is_published = False
    db.commit()
    return {"message": "Drive unpublished"}


# 🔥 OPEN REGISTRATION
@router.put("/open-registration/{drive_id}")
def open_registration(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    drive.registration_open = True
    db.commit()
    return {"message": "Registration opened"}


# 🔥 CLOSE REGISTRATION
@router.put("/close-registration/{drive_id}")
def close_registration(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    drive.registration_open = False
    db.commit()
    return {"message": "Registration closed"}


# ✅ GET DRIVE BY ID
@router.get("/{drive_id}", response_model=DriveResponse)
def get_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive


from fastapi.encoders import jsonable_encoder

# ✅ GET COMPLETE DRIVE DETAILS (FOR EDITING)
@router.get("/complete/{drive_id}", response_model=dict)
def get_complete_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    eligibility = db.query(EligibilityRule).filter(EligibilityRule.drive_id == drive_id).first()
    workflow = db.query(Workflow).filter(Workflow.drive_id == drive_id).first()
    rounds = []
    if workflow:
        rounds = db.query(DriveRound).filter(DriveRound.workflow_id == workflow.id).order_by(DriveRound.round_number).all()

    return jsonable_encoder({
        "drive": drive,
        "eligibility": eligibility,
        "workflow": {
            **workflow.__dict__,
            "rounds": rounds
        } if workflow else None
    })


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


# ✅ UPDATE COMPLETE DRIVE (DRIVE + ELIGIBILITY + WORKFLOW)
@router.put("/complete/{drive_id}", response_model=dict)
def update_complete_drive(drive_id: int, data: DriveCreateComplete, db: Session = Depends(get_db)):
    """
    Update a placement drive along with its eligibility rules and workflow
    """
    try:
        # 1️⃣ Update main drive
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise HTTPException(status_code=404, detail="Drive not found")
        
        drive.company_id = data.company_id
        drive.title = data.title
        drive.description = data.description
        drive.drive_date = data.drive_date
        drive.venue = data.venue
        drive.package = data.package
        drive.is_published = data.is_published
        drive.is_active = data.is_active
        drive.registration_open = data.registration_open
        
        # 2️⃣ Update eligibility rules
        if data.eligibility:
            eligibility = db.query(EligibilityRule).filter(EligibilityRule.drive_id == drive_id).first()
            if eligibility:
                for key, value in data.eligibility.model_dump().items():
                    setattr(eligibility, key, value)
            else:
                # Create if didn't exist
                eligibility = EligibilityRule(drive_id=drive_id, **data.eligibility.model_dump())
                db.add(eligibility)
        
        # 3️⃣ Update workflow and rounds
        if data.workflow:
            workflow = db.query(Workflow).filter(Workflow.drive_id == drive_id).first()
            if workflow:
                workflow.description = data.workflow.description
                workflow.total_rounds = data.workflow.total_rounds
                
                # Update rounds (simplest way: delete and recreate)
                db.query(DriveRound).filter(DriveRound.workflow_id == workflow.id).delete()
                for round_data in data.workflow.rounds:
                    new_round = DriveRound(workflow_id=workflow.id, **round_data.model_dump())
                    db.add(new_round)
            else:
                # Create if didn't exist
                workflow = Workflow(drive_id=drive_id, description=data.workflow.description, total_rounds=data.workflow.total_rounds)
                db.add(workflow)
                db.commit()
                db.refresh(workflow)
                for round_data in data.workflow.rounds:
                    new_round = DriveRound(workflow_id=workflow.id, **round_data.model_dump())
                    db.add(new_round)
        
        db.commit()
        return jsonable_encoder({"message": "Drive and all related data updated successfully"})
        
    except Exception as e:
        db.rollback()
        print(f"Error updating complete drive: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error updating drive: {str(e)}")


# ✅ DELETE DRIVE
@router.delete("/{drive_id}")
def delete_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    db.delete(drive)
    db.commit()
    return {"message": "Drive deleted successfully"}