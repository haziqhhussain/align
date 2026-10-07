from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class SubtaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    is_completed: Optional[bool] = None
    position: Optional[int] = None

class SubtaskAssignUpdate(BaseModel):
    assigned_to_id: Optional[int] = None

class SubtaskReorderItem(BaseModel):
    id: int
    position: int

class SubtaskReorderRequest(BaseModel):
    items: List[SubtaskReorderItem]

class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int
    is_completed: bool
    position: int
    created_by_id: Optional[int] = None
    completed_by_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    assigned_to: Optional[UserResponse] = None
    created_by: Optional[UserResponse] = None
    completed_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
