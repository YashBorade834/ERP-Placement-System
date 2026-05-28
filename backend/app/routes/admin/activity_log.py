from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user,require_admin 
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.activity_log import ActivityLog

# router = APIRouter(prefix="/activity-log", tags=["Activity Log"])
router = APIRouter(tags=["Activity Log"], dependencies=[Depends(require_admin)])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_all_logs(db: Session = Depends(get_db)):
    return db.query(ActivityLog).all()