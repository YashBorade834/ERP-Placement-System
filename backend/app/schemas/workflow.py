from pydantic import BaseModel


class WorkflowCreate(BaseModel):
    drive_id: int
    description: str
    total_rounds: int


class WorkflowResponse(WorkflowCreate):
    id: int
    drive_id: int
    description: str
    total_rounds: int

    class Config:
        from_attributes = True