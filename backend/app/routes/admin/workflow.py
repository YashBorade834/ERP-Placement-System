from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowResponse

router = APIRouter(tags=["Workflow"])


@router.post("/{drive_id}/workflow", response_model=WorkflowResponse)
def create_workflow(drive_id: int, data: WorkflowCreate, db: Session = Depends(get_db)):
    workflow = Workflow(**data.dict())
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow