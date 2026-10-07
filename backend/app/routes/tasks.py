from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.notification import Notification
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskResponse
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def format_task_response(task: Task) -> dict:
    now = datetime.utcnow()
    is_overdue = bool(task.due_date and task.due_date < now and task.status != TaskStatus.COMPLETED)

    subtasks = sorted(task.subtasks or [], key=lambda s: s.position)
    subtask_count = len(subtasks)
    completed_subtask_count = sum(1 for st in subtasks if st.is_completed)
    subtask_progress = int(round((completed_subtask_count / subtask_count) * 100)) if subtask_count > 0 else 0

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "project_id": task.project_id,
        "assigned_to_id": task.assigned_to_id,
        "created_by_id": task.created_by_id,
        "priority": task.priority,
        "status": task.status,
        "start_date": task.start_date,
        "due_date": task.due_date,
        "completed_date": task.completed_date,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "is_overdue": is_overdue,
        "subtask_count": subtask_count,
        "completed_subtask_count": completed_subtask_count,
        "subtask_progress": subtask_progress,
        "project": task.project,
        "assigned_to": task.assigned_to,
        "created_by": task.created_by,
        "comments": task.comments,
        "subtasks": subtasks
    }

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    project_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None,
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority"),
    search: Optional[str] = None,
    my_tasks_only: Optional[bool] = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)

    if current_user.role != UserRole.ADMIN:
        # Filter tasks to projects belonging to user's teams OR tasks assigned directly to user
        member_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        team_ids = [t[0] for t in member_team_ids]
        lead_team_ids = db.query(Team.id).filter(Team.lead_id == current_user.id).all()
        team_ids.extend([t[0] for t in lead_team_ids])
        team_ids = list(set(team_ids))

        team_project_ids = db.query(Project.id).filter(Project.team_id.in_(team_ids)).all()
        project_ids = [p[0] for p in team_project_ids]

        query = query.filter(
            or_(
                Task.project_id.in_(project_ids),
                Task.assigned_to_id == current_user.id
            )
        )

    if my_tasks_only:
        query = query.filter(Task.assigned_to_id == current_user.id)
    elif assigned_to_id:
        query = query.filter(Task.assigned_to_id == assigned_to_id)

    if project_id:
        query = query.filter(Task.project_id == project_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )

    tasks = query.order_by(Task.created_at.desc()).all()
    return [format_task_response(t) for t in tasks]

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only Admin or Team Lead of project's team can create tasks
    if not is_user_team_lead(current_user, project.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can create tasks in this project")

    assigned_user = None
    if task_in.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == task_in.assigned_to_id).first()
        if not assigned_user:
            raise HTTPException(status_code=400, detail="Assigned user not found")

    completed_date = datetime.utcnow() if task_in.status == TaskStatus.COMPLETED else None

    task = Task(
        title=task_in.title,
        description=task_in.description,
        project_id=task_in.project_id,
        assigned_to_id=task_in.assigned_to_id,
        created_by_id=current_user.id,
        priority=task_in.priority or TaskPriority.MEDIUM,
        status=task_in.status or TaskStatus.TO_DO,
        start_date=task_in.start_date,
        due_date=task_in.due_date,
        completed_date=completed_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Activity Log
    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TASK_CREATED",
        entity_type="TASK",
        entity_id=task.id,
        team_id=project.team_id,
        project_id=project.id,
        task_id=task.id,
        description=f"{current_user.full_name} created task \"{task.title}\"."
    )

    # Send Notification and Assignment Activity to assigned member
    if task_in.assigned_to_id and task_in.assigned_to_id != current_user.id:
        create_notification(
            db=db,
            user_id=task_in.assigned_to_id,
            type="TASK_ASSIGNED",
            title="New Task Assigned",
            message=f"You were assigned to task '{task.title}' by {current_user.full_name}.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )
        assignee_name = assigned_user.full_name if assigned_user else f"User #{task_in.assigned_to_id}"
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TASK_ASSIGNED",
            entity_type="TASK",
            entity_id=task.id,
            team_id=project.team_id,
            project_id=project.id,
            task_id=task.id,
            target_user_id=task_in.assigned_to_id,
            description=f"{current_user.full_name} assigned \"{task.title}\" to {assignee_name}.",
            metadata={"new_assignee_id": task_in.assigned_to_id}
        )

    return format_task_response(task)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not is_user_team_member(current_user, task.project.team_id, db) and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")

    return format_task_response(task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only Admin or Team Lead can edit full task details
    if not is_user_team_lead(current_user, task.project.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can edit task details")

    old_assigned_id = task.assigned_to_id
    old_status = task.status
    old_priority = task.priority
    old_due_date = task.due_date

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.project_id is not None:
        new_project = db.query(Project).filter(Project.id == task_in.project_id).first()
        if not new_project:
            raise HTTPException(status_code=400, detail="Target project not found")
        task.project_id = task_in.project_id
    if task_in.assigned_to_id is not None:
        task.assigned_to_id = task_in.assigned_to_id
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.status is not None:
        task.status = task_in.status
        if task_in.status == TaskStatus.COMPLETED and not task.completed_date:
            task.completed_date = datetime.utcnow()
        elif task_in.status != TaskStatus.COMPLETED:
            task.completed_date = None
    if task_in.start_date is not None:
        task.start_date = task_in.start_date
    if task_in.due_date is not None:
        task.due_date = task_in.due_date

    db.commit()
    db.refresh(task)

    team_id = task.project.team_id
    project_id = task.project_id

    # Check assignment change
    if task_in.assigned_to_id is not None and task_in.assigned_to_id != old_assigned_id:
        new_user = db.query(User).filter(User.id == task_in.assigned_to_id).first()
        old_user = db.query(User).filter(User.id == old_assigned_id).first() if old_assigned_id else None
        new_name = new_user.full_name if new_user else f"User #{task_in.assigned_to_id}"
        old_name = old_user.full_name if old_user else None

        if old_name:
            action_type = "TASK_REASSIGNED"
            desc = f"{current_user.full_name} reassigned \"{task.title}\" from {old_name} to {new_name}."
        else:
            action_type = "TASK_ASSIGNED"
            desc = f"{current_user.full_name} assigned \"{task.title}\" to {new_name}."

        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type=action_type,
            entity_type="TASK",
            entity_id=task.id,
            team_id=team_id,
            project_id=project_id,
            task_id=task.id,
            target_user_id=task_in.assigned_to_id,
            description=desc,
            metadata={"old_assignee_id": old_assigned_id, "new_assignee_id": task_in.assigned_to_id}
        )

    # Check status change
    if task_in.status is not None and task_in.status != old_status:
        old_val = old_status.value if hasattr(old_status, 'value') else str(old_status)
        new_val = task.status.value if hasattr(task.status, 'value') else str(task.status)

        if task.status == TaskStatus.COMPLETED:
            log_activity(
                db=db,
                actor_id=current_user.id,
                action_type="TASK_COMPLETED",
                entity_type="TASK",
                entity_id=task.id,
                team_id=team_id,
                project_id=project_id,
                task_id=task.id,
                description=f"{current_user.full_name} completed \"{task.title}\"."
            )
        else:
            log_activity(
                db=db,
                actor_id=current_user.id,
                action_type="TASK_STATUS_CHANGED",
                entity_type="TASK",
                entity_id=task.id,
                team_id=team_id,
                project_id=project_id,
                task_id=task.id,
                description=f"{current_user.full_name} moved \"{task.title}\" from {old_val} to {new_val}.",
                metadata={"field": "status", "old_value": old_val, "new_value": new_val}
            )

    # Check priority change
    if task_in.priority is not None and task_in.priority != old_priority:
        old_p = old_priority.value if hasattr(old_priority, 'value') else str(old_priority)
        new_p = task.priority.value if hasattr(task.priority, 'value') else str(task.priority)
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TASK_PRIORITY_CHANGED",
            entity_type="TASK",
            entity_id=task.id,
            team_id=team_id,
            project_id=project_id,
            task_id=task.id,
            description=f"{current_user.full_name} changed priority of \"{task.title}\" from {old_p} to {new_p}.",
            metadata={"field": "priority", "old_value": old_p, "new_value": new_p}
        )

    # Check due date change
    if task_in.due_date is not None and task_in.due_date != old_due_date:
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TASK_DUE_DATE_CHANGED",
            entity_type="TASK",
            entity_id=task.id,
            team_id=team_id,
            project_id=project_id,
            task_id=task.id,
            description=f"{current_user.full_name} changed due date of \"{task.title}\"."
        )

    # Send Notification if newly assigned
    if task.assigned_to_id and task.assigned_to_id != old_assigned_id and task.assigned_to_id != current_user.id:
        create_notification(
            db=db,
            user_id=task.assigned_to_id,
            type="TASK_ASSIGNED",
            title="Task Reassigned",
            message=f"Task '{task.title}' was assigned to you by {current_user.full_name}.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )

    return format_task_response(task)

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Allowed if Admin, Team Lead of project's team, OR assigned member of the task
    is_lead = is_user_team_lead(current_user, task.project.team_id, db)
    is_assigned = (task.assigned_to_id == current_user.id)

    if not is_lead and not is_assigned:
        raise HTTPException(status_code=403, detail="Only assigned member, Team Lead, or Admin can update task status")

    old_status = task.status
    task.status = status_in.status
    if status_in.status == TaskStatus.COMPLETED:
        task.completed_date = datetime.utcnow()
    else:
        task.completed_date = None

    db.commit()
    db.refresh(task)

    team_id = task.project.team_id
    project_id = task.project_id

    old_val = old_status.value if hasattr(old_status, 'value') else str(old_status)
    new_val = task.status.value if hasattr(task.status, 'value') else str(task.status)

    if task.status == TaskStatus.COMPLETED:
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TASK_COMPLETED",
            entity_type="TASK",
            entity_id=task.id,
            team_id=team_id,
            project_id=project_id,
            task_id=task.id,
            description=f"{current_user.full_name} completed \"{task.title}\"."
        )
    else:
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TASK_STATUS_CHANGED",
            entity_type="TASK",
            entity_id=task.id,
            team_id=team_id,
            project_id=project_id,
            task_id=task.id,
            description=f"{current_user.full_name} moved \"{task.title}\" from {old_val} to {new_val}.",
            metadata={"field": "status", "old_value": old_val, "new_value": new_val}
        )

    # Notify team lead or creator or assigned user
    notify_user_id = task.assigned_to_id if is_lead else (task.project.team.lead_id or task.created_by_id)
    if notify_user_id and notify_user_id != current_user.id:
        create_notification(
            db=db,
            user_id=notify_user_id,
            type="TASK_STATUS_CHANGED",
            title="Task Status Updated",
            message=f"{current_user.full_name} updated status of '{task.title}' to '{task.status.value}'.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )

    return format_task_response(task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not is_user_team_lead(current_user, task.project.team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can delete tasks")

    task_title = task.title
    project_id = task.project_id
    team_id = task.project.team_id

    db.delete(task)
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TASK_DELETED",
        entity_type="TASK",
        entity_id=task_id,
        team_id=team_id,
        project_id=project_id,
        task_id=task_id,
        description=f"{current_user.full_name} deleted task \"{task_title}\"."
    )

    return None
