from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus
from app.schemas.calendar import CalendarEventResponse, UpcomingDeadlineResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar"])

def parse_date_param(val: Optional[str], default_date: datetime) -> datetime:
    if not val:
        return default_date
    try:
        if len(val) == 10:
            return datetime.strptime(val, "%Y-%m-%d")
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {val}. Expected YYYY-MM-DD.")

def get_user_accessible_team_ids(user: User, db: Session) -> List[int]:
    if user.role == UserRole.ADMIN:
        return [t[0] for t in db.query(Team.id).all()]
    
    member_teams = db.query(TeamMember.team_id).filter(TeamMember.user_id == user.id).all()
    team_ids = [t[0] for t in member_teams]
    lead_teams = db.query(Team.id).filter(Team.lead_id == user.id).all()
    team_ids.extend([t[0] for t in lead_teams])
    owner_teams = db.query(Team.id).filter(Team.owner_id == user.id).all()
    team_ids.extend([t[0] for t in owner_teams])
    return list(set(team_ids))

@router.get("", response_model=List[CalendarEventResponse])
def get_calendar_events(
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    event_type: Optional[str] = Query(None, description="ALL | TASK | PROJECT"),
    status_filter: Optional[str] = Query(None, alias="status"),
    my_calendar_only: Optional[bool] = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    
    if start:
        start_dt = parse_date_param(start, now.replace(day=1, hour=0, minute=0, second=0))
    else:
        start_dt = (now.replace(day=1) - timedelta(days=7)).replace(hour=0, minute=0, second=0)

    if end:
        end_dt = parse_date_param(end, now.replace(hour=23, minute=59, second=59))
        end_dt = end_dt.replace(hour=23, minute=59, second=59)
    else:
        end_dt = (now + timedelta(days=40)).replace(hour=23, minute=59, second=59)

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")

    events: List[CalendarEventResponse] = []
    user_team_ids = get_user_accessible_team_ids(current_user, db)

    # 1. TASK EVENTS
    if not event_type or event_type.upper() in ["ALL", "TASK"]:
        task_query = db.query(Task).join(Project, Task.project_id == Project.id)
        
        if current_user.role != UserRole.ADMIN:
            task_query = task_query.filter(
                or_(
                    Project.team_id.in_(user_team_ids),
                    Task.assigned_to_id == current_user.id
                )
            )

        if my_calendar_only:
            task_query = task_query.filter(Task.assigned_to_id == current_user.id)

        if team_id:
            task_query = task_query.filter(Project.team_id == team_id)

        if project_id:
            task_query = task_query.filter(Task.project_id == project_id)

        if assignee_id:
            task_query = task_query.filter(Task.assigned_to_id == assignee_id)

        if status_filter:
            task_query = task_query.filter(Task.status == status_filter)

        task_query = task_query.filter(
            Task.due_date != None,
            Task.due_date >= start_dt,
            Task.due_date <= end_dt
        )

        tasks = task_query.all()
        for t in tasks:
            due_str = t.due_date.strftime("%Y-%m-%d") if t.due_date else ""
            is_overdue = bool(t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)
            
            subtasks = t.subtasks or []
            sub_count = len(subtasks)
            comp_count = sum(1 for s in subtasks if s.is_completed)
            prog = int(round((comp_count / sub_count) * 100)) if sub_count > 0 else 0

            events.append(
                CalendarEventResponse(
                    id=f"task-{t.id}",
                    entity_id=t.id,
                    type="TASK",
                    title=t.title,
                    description=t.description,
                    start=due_str,
                    end=due_str,
                    status=t.status.value if hasattr(t.status, "value") else str(t.status),
                    priority=t.priority.value if hasattr(t.priority, "value") else str(t.priority),
                    team_id=t.project.team_id if t.project else None,
                    team_name=t.project.team.name if (t.project and t.project.team) else None,
                    project_id=t.project_id,
                    project_name=t.project.name if t.project else None,
                    assignee_id=t.assigned_to_id,
                    assignee_name=t.assigned_to.full_name if t.assigned_to else None,
                    assignee_avatar=t.assigned_to.avatar_url if t.assigned_to else None,
                    is_overdue=is_overdue,
                    subtask_count=sub_count,
                    completed_subtask_count=comp_count,
                    subtask_progress=prog
                )
            )

    # 2. PROJECT EVENTS
    if not event_type or event_type.upper() in ["ALL", "PROJECT"]:
        project_query = db.query(Project)

        if current_user.role != UserRole.ADMIN:
            project_query = project_query.filter(Project.team_id.in_(user_team_ids))

        if team_id:
            project_query = project_query.filter(Project.team_id == team_id)

        if project_id:
            project_query = project_query.filter(Project.id == project_id)

        if status_filter:
            project_query = project_query.filter(Project.status == status_filter)

        project_query = project_query.filter(
            or_(Project.start_date != None, Project.due_date != None)
        )

        projects = project_query.all()
        for p in projects:
            p_start = p.start_date or p.due_date
            p_end = p.due_date or p.start_date

            if p_start and p_end:
                if p_start > end_dt or p_end < start_dt:
                    continue
            
            p_start_str = p_start.strftime("%Y-%m-%d") if p_start else ""
            p_end_str = p_end.strftime("%Y-%m-%d") if p_end else p_start_str

            is_overdue = bool(p.due_date and p.due_date < now and p.status != ProjectStatus.COMPLETED)

            events.append(
                CalendarEventResponse(
                    id=f"project-{p.id}",
                    entity_id=p.id,
                    type="PROJECT",
                    title=p.name,
                    description=p.description,
                    start=p_start_str,
                    end=p_end_str,
                    status=p.status.value if hasattr(p.status, "value") else str(p.status),
                    team_id=p.team_id,
                    team_name=p.team.name if p.team else None,
                    project_id=p.id,
                    project_name=p.name,
                    is_overdue=is_overdue
                )
            )

    events.sort(key=lambda e: (e.start, e.title))
    return events

@router.get("/upcoming", response_model=List[UpcomingDeadlineResponse])
def get_upcoming_deadlines(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    user_team_ids = get_user_accessible_team_ids(current_user, db)

    task_query = db.query(Task).join(Project, Task.project_id == Project.id)
    if current_user.role != UserRole.ADMIN:
        task_query = task_query.filter(
            or_(
                Project.team_id.in_(user_team_ids),
                Task.assigned_to_id == current_user.id
            )
        )

    tasks = task_query.filter(
        Task.due_date != None,
        Task.status != TaskStatus.COMPLETED
    ).order_by(Task.due_date.asc()).limit(limit * 2).all()

    upcoming: List[UpcomingDeadlineResponse] = []
    today_date = now.date()

    for t in tasks:
        due_date_obj = t.due_date.date()
        date_str = due_date_obj.strftime("%Y-%m-%d")
        diff_days = (due_date_obj - today_date).days
        is_overdue = diff_days < 0

        if diff_days < 0:
            rel_label = f"Overdue by {abs(diff_days)} day{'s' if abs(diff_days) > 1 else ''}"
        elif diff_days == 0:
            rel_label = "Today"
        elif diff_days == 1:
            rel_label = "Tomorrow"
        elif diff_days < 7:
            rel_label = f"In {diff_days} days"
        else:
            rel_label = due_date_obj.strftime("%b %d")

        upcoming.append(
            UpcomingDeadlineResponse(
                id=f"task-{t.id}",
                entity_id=t.id,
                type="TASK",
                title=t.title,
                date=date_str,
                due_date_formatted=due_date_obj.strftime("%b %d, %Y"),
                relative_label=rel_label,
                status=t.status.value if hasattr(t.status, "value") else str(t.status),
                priority=t.priority.value if hasattr(t.priority, "value") else str(t.priority),
                project_name=t.project.name if t.project else None,
                assignee_name=t.assigned_to.full_name if t.assigned_to else "Unassigned",
                is_overdue=is_overdue
            )
        )

        if len(upcoming) >= limit:
            break

    return upcoming
