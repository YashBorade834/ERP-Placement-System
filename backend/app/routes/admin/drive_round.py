from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.drive_round import DriveRound
from app.schemas.drive_round import RoundCreate, RoundResponse

router = APIRouter(tags=["Drive Rounds"])


@router.post("/{workflow_id}/rounds", response_model=RoundResponse)
def create_round(workflow_id: int, data: RoundCreate, db: Session = Depends(get_db)):
    round_obj = DriveRound(**data.dict())
    db.add(round_obj)
    db.commit()
    db.refresh(round_obj)
    return round_obj