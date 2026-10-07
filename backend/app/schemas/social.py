from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.team import TeamResponse

class FriendRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    sender: UserResponse
    receiver: UserResponse

    model_config = ConfigDict(from_attributes=True)

class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    created_at: datetime
    friend: UserResponse

    model_config = ConfigDict(from_attributes=True)

class TeamInvitationResponse(BaseModel):
    id: int
    team_id: int
    sender_id: int
    receiver_id: int
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    team: TeamResponse
    sender: UserResponse
    receiver: UserResponse

    model_config = ConfigDict(from_attributes=True)

class UserSearchResponse(UserResponse):
    friendship_status: str = "NONE" # NONE, PENDING_SENT, PENDING_RECEIVED, FRIENDS
    friend_request_id: Optional[int] = None
    shared_teams_count: int = 0
