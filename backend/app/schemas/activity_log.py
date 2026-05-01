from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    table_name: str
    record_id: int
    action_type: str
    description: Optional[str]
    action_time: datetime

    class Config:
      from_attributes = True