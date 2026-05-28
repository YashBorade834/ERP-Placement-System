from app.dependencies.auth import get_current_user, require_admin 
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.eligibility import EligibilityRule
from app.schemas.eligibility import EligibilityCreate, EligibilityResponse

router = APIRouter(tags=["Eligibility"], dependencies=[Depends(require_admin)])


@router.post("/{drive_id}/eligibility", response_model=EligibilityResponse)
def create_eligibility(drive_id: int, data: EligibilityCreate, db: Session = Depends(get_db)):
    rule = EligibilityRule(**data.dict(), drive_id=drive_id)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule