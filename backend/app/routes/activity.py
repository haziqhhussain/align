from typing import Optional, List
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogResponse, ActivityListResponse
from app.dependencies.auth import get_current_user, is_user_team_member

router = APIRouter(prefix="/activity", tags=["Activity Log"])

def get_user_accessible_team_ids(current_user: User, db: Session) -> List[int]:
    if current_user.role == UserRole.ADMIN:
        return [t.id for t in db.query(Team.id).all()]
    
    member_teams = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [t[0] for t in member_teams]
    owned_teams = db.query(Team.id).filter(
        (Team.owner_id == current_user.id) | (Team.lead_id == current_user.id)
    ).all()
    team_ids.extend([t[0] for t in owned_teams])
    return list(set(team_ids))

@router.get("", response_model=ActivityListResponse)
def get_activity_logs(
    team_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    task_id: Optional[int] = Query(None),
    actor_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accessible_team_ids = get_user_accessible_team_ids(current_user, db)

    # Permission checks for specific entity queries
    if team_id is not None:
        if current_user.role != UserRole.ADMIN and team_id not in accessible_team_ids:
            raise HTTPException(status_code=403, detail="Not authorized to view activity for this team")
    
    if project_id is not None:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if current_user.role != UserRole.ADMIN and project.team_id not in accessible_team_ids:
            raise HTTPException(status_code=403, detail="Not authorized to view activity for this project")

    if task_id is not None:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if current_user.role != UserRole.ADMIN and task.project.team_id not in accessible_team_ids and task.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view activity for this task")

    query = db.query(ActivityLog)

    # General visibility filtering if not admin and no specific entity requested
    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            or_(
                ActivityLog.team_id.in_(accessible_team_ids),
                ActivityLog.actor_id == current_user.id,
                ActivityLog.target_user_id == current_user.id
            )
        )

    # Apply filters
    if team_id is not None:
        query = query.filter(ActivityLog.team_id == team_id)
    if project_id is not None:
        query = query.filter(ActivityLog.project_id == project_id)
    if task_id is not None:
        query = query.filter(ActivityLog.task_id == task_id)
    if actor_id is not None:
        query = query.filter(ActivityLog.actor_id == actor_id)
    if action_type is not None:
        query = query.filter(ActivityLog.action_type == action_type)
    if entity_type is not None:
        query = query.filter(ActivityLog.entity_type == entity_type)

    total = query.count()
    offset = (page - 1) * limit
    items = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit).all()
    total_pages = ceil(total / limit) if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/recent", response_model=List[ActivityLogResponse])
def get_recent_activity(
    limit: int = Query(8, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accessible_team_ids = get_user_accessible_team_ids(current_user, db)
    query = db.query(ActivityLog)

    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            or_(
                ActivityLog.team_id.in_(accessible_team_ids),
                ActivityLog.actor_id == current_user.id,
                ActivityLog.target_user_id == current_user.id
            )
        )

    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
