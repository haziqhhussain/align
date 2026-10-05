from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.task import TaskPriority, TaskStatus
from app.schemas.user import UserResponse
from app.schemas.project import ProjectResponse
from app.schemas.comment import CommentResponse

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    assigned_to_id: Optional[int] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    status: Optional[TaskStatus] = TaskStatus.TO_DO
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(TaskBase):
    id: int
    created_by_id: Optional[int] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_overdue: Optional[bool] = False
    
    project: Optional[ProjectResponse] = None
    assigned_to: Optional[UserResponse] = None
    created_by: Optional[UserResponse] = None
    comments: List[CommentResponse] = []

    model_config = ConfigDict(from_attributes=True)
