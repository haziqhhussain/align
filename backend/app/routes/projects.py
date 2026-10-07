from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(prefix="/projects", tags=["Projects"])

def format_project_response(project: Project, db: Session) -> dict:
    tasks = db.query(Task).filter(Task.project_id == project.id).all()
    task_count = len(tasks)
    completed_task_count = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    progress_percentage = (completed_task_count / task_count * 100.0) if task_count > 0 else 0.0

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "team_id": project.team_id,
        "status": project.status,
        "start_date": project.start_date,
        "due_date": project.due_date,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "team": project.team,
        "task_count": task_count,
        "completed_task_count": completed_task_count,
        "progress_percentage": round(progress_percentage, 1)
    }

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    team_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    
    if current_user.role != UserRole.ADMIN:
        # Get team IDs user is member or lead of
        member_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        team_ids = [t[0] for t in member_team_ids]
        lead_team_ids = db.query(Team.id).filter(Team.lead_id == current_user.id).all()
        team_ids.extend([t[0] for t in lead_team_ids])
        team_ids = list(set(team_ids))
        query = query.filter(Project.team_id.in_(team_ids))

    if team_id:
        query = query.filter(Project.team_id == team_id)

    projects = query.all()
    return [format_project_response(p, db) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == project_in.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Only Admin or Team Lead of that team can create projects
    if not is_user_team_lead(current_user, project_in.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead of this team can create projects")

    project = Project(
        name=project_in.name,
        description=project_in.description,
        team_id=project_in.team_id,
        status=project_in.status,
        start_date=project_in.start_date,
        due_date=project_in.due_date
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="PROJECT_CREATED",
        entity_type="PROJECT",
        entity_id=project.id,
        team_id=project.team_id,
        project_id=project.id,
        description=f"{current_user.full_name} created project \"{project.name}\"."
    )

    return format_project_response(project, db)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not is_user_team_member(current_user, project.team_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to view this project")

    return format_project_response(project, db)

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not is_user_team_lead(current_user, project.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can edit project details")

    old_status = project.status

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.status is not None:
        project.status = project_in.status
    if project_in.start_date is not None:
        project.start_date = project_in.start_date
    if project_in.due_date is not None:
        project.due_date = project_in.due_date

    db.commit()
    db.refresh(project)

    # Logging status change vs general update
    if project_in.status is not None and project_in.status != old_status:
        old_val = old_status.value if hasattr(old_status, 'value') else str(old_status)
        new_val = project.status.value if hasattr(project.status, 'value') else str(project.status)
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="PROJECT_STATUS_CHANGED",
            entity_type="PROJECT",
            entity_id=project.id,
            team_id=project.team_id,
            project_id=project.id,
            description=f"{current_user.full_name} changed \"{project.name}\" status from {old_val} to {new_val}.",
            metadata={"field": "status", "old_value": old_val, "new_value": new_val}
        )
    else:
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="PROJECT_UPDATED",
            entity_type="PROJECT",
            entity_id=project.id,
            team_id=project.team_id,
            project_id=project.id,
            description=f"{current_user.full_name} updated project \"{project.name}\"."
        )

    # Notify team members about project update
    team_members = db.query(TeamMember).filter(TeamMember.team_id == project.team_id).all()
    for tm in team_members:
        if tm.user_id != current_user.id:
            create_notification(
                db=db,
                user_id=tm.user_id,
                type="PROJECT_UPDATED",
                title="Project Updated",
                message=f"Project '{project.name}' was updated by {current_user.full_name}.",
                related_entity_type="PROJECT",
                related_entity_id=project.id,
                action_url=f"/projects?id={project.id}"
            )

    return format_project_response(project, db)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not is_user_team_lead(current_user, project.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can delete projects")

    proj_name = project.name
    team_id = project.team_id

    db.delete(project)
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="PROJECT_DELETED",
        entity_type="PROJECT",
        entity_id=project_id,
        team_id=team_id,
        project_id=project_id,
        description=f"{current_user.full_name} deleted project \"{proj_name}\"."
    )

    return None
