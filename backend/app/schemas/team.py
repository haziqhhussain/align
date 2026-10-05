from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    lead_id: Optional[int] = None
    member_ids: Optional[List[int]] = []

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lead_id: Optional[int] = None

class TeamMemberAdd(BaseModel):
    user_id: int

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    team_id: int
    joined_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)

class TeamResponse(TeamBase):
    id: int
    lead_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    lead: Optional[UserResponse] = None
    members: List[TeamMemberResponse] = []
    member_count: Optional[int] = 0
    project_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
