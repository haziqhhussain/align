from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict

class AnalyticsSummaryResponse(BaseModel):
    total_members: int
    total_tasks: int
    active_tasks: int
    completed_tasks: int
    overdue_tasks: int
    due_this_week: int
    high_priority_tasks: int
    unassigned_tasks: int
    completion_rate: float
    average_tasks_per_member: float

    model_config = ConfigDict(from_attributes=True)

class MemberWorkloadResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    total_assigned: int
    active_tasks: int
    completed_tasks: int
    overdue_tasks: int
    due_this_week: int
    subtask_count: int
    priority_breakdown: Dict[str, int]
    status_breakdown: Dict[str, int]
    workload_score: int
    workload_level: str

    model_config = ConfigDict(from_attributes=True)

class MemberWorkloadListResponse(BaseModel):
    members: List[MemberWorkloadResponse]

class TeamWorkloadResponse(BaseModel):
    team_id: int
    team_name: str
    member_count: int
    active_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    average_workload_score: int

class ProjectWorkloadResponse(BaseModel):
    project_id: int
    project_name: str
    team_id: int
    team_name: str
    task_count: int
    active_tasks: int
    completed_tasks: int
    overdue_tasks: int
    due_soon_count: int
    completion_rate: float

class TrendPoint(BaseModel):
    date: str
    count: int

class TrendsResponse(BaseModel):
    period: str
    completed_tasks: List[TrendPoint]
    created_tasks: List[TrendPoint]
