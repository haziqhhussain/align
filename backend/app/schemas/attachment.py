from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class AttachmentUserSummary(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_size: int
    mime_type: str
    uploaded_by: AttachmentUserSummary
    task_id: Optional[int] = None
    project_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttachmentListResponse(BaseModel):
    items: List[AttachmentResponse]
    total: int
