from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models.application_status import ApplicationStatus
from app.schemas.application_status import (
    ApplicationStatusCreate,
    ApplicationStatusUpdate,
    ApplicationStatusResponse
)

# router = APIRouter(prefix="/application-status", tags=["Application Status"])
router = APIRouter(tags=["Application Status"])

# 🚀 CREATE STATUS
@router.post("/", response_model=ApplicationStatusResponse)
def create_status(data: ApplicationStatusCreate, db: Session = Depends(get_db)):
    obj = ApplicationStatus(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# 📊 GET ALL
@router.get("/", response_model=list[ApplicationStatusResponse])
def get_all_status(db: Session = Depends(get_db)):
    return db.query(ApplicationStatus).all()


# 🔍 GET BY APPLICATION
@router.get("/application/{application_id}", response_model=list[ApplicationStatusResponse])
def get_by_application(application_id: int, db: Session = Depends(get_db)):
    return db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == application_id
    ).all()


# 🎯 GET LATEST STATUS (VERY IMPORTANT)
@router.get("/application/{application_id}/latest")
def get_latest_status(application_id: int, db: Session = Depends(get_db)):
    status = db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == application_id
    ).order_by(ApplicationStatus.id.desc()).first()

    if not status:
        raise HTTPException(status_code=404, detail="No status found")

    return status


# ✅ SHORTLIST
@router.post("/shortlist/{application_id}")
def shortlist(application_id: int, db: Session = Depends(get_db)):
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="Shortlisted",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student shortlisted"}


# ❌ REJECT
@router.post("/reject/{application_id}")
def reject(application_id: int, db: Session = Depends(get_db)):
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="Rejected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student rejected"}


# 🎉 SELECT (MOST IMPORTANT)
@router.post("/select/{application_id}")
def select(application_id: int, db: Session = Depends(get_db)):
    obj = ApplicationStatus(
        application_id=application_id,
        drive_round_id=1,
        status="Selected",
        status_date=date.today()
    )
    db.add(obj)
    db.commit()
    return {"message": "Student selected"}