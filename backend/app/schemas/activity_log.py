from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from app.schemas.user import UserResponse

class ActivityActorResponse(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor: Optional[ActivityActorResponse] = None
    action_type: str
    entity_type: str
    entity_id: Optional[int] = None
    team_id: Optional[int] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    target_user_id: Optional[int] = None
    description: str
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityListResponse(BaseModel):
    items: List[ActivityLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int
