from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class CalendarEventResponse(BaseModel):
    id: str
    entity_id: int
    type: str  # "TASK" | "PROJECT" | "PROJECT_START" | "PROJECT_END"
    title: str
    description: Optional[str] = None
    start: str  # ISO date string "YYYY-MM-DD"
    end: str    # ISO date string "YYYY-MM-DD"
    status: str
    priority: Optional[str] = None
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    assignee_avatar: Optional[str] = None
    is_overdue: bool = False
    subtask_count: Optional[int] = 0
    completed_subtask_count: Optional[int] = 0
    subtask_progress: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class UpcomingDeadlineResponse(BaseModel):
    id: str
    entity_id: int
    type: str  # "TASK" | "PROJECT"
    title: str
    date: str  # "YYYY-MM-DD"
    due_date_formatted: str
    relative_label: str  # e.g., "Today", "Tomorrow", "In 3 days", "Overdue by 2 days"
    status: str
    priority: Optional[str] = None
    project_name: Optional[str] = None
    assignee_name: Optional[str] = None
    is_overdue: bool = False

class CalendarSummaryResponse(BaseModel):
    events: List[CalendarEventResponse]
    upcoming_deadlines: List[UpcomingDeadlineResponse]
    overdue_count: int = 0
