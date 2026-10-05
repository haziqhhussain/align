from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.project import ProjectStatus
from app.schemas.team import TeamResponse

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: int
    status: Optional[ProjectStatus] = ProjectStatus.ACTIVE
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_id: Optional[int] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    team: Optional[TeamResponse] = None
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0
    progress_percentage: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
