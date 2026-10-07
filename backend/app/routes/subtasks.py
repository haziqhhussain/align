from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.subtask import Subtask
from app.schemas.subtask import (
    SubtaskCreate,
    SubtaskUpdate,
    SubtaskAssignUpdate,
    SubtaskReorderRequest,
    SubtaskResponse
)
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(tags=["Subtasks"])

def get_task_and_check_access(task_id: int, current_user: User, db: Session) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Parent task not found")

    team_id = task.project.team_id
    if current_user.role != UserRole.ADMIN:
        if not is_user_team_member(current_user, team_id, db) and task.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access subtasks for this task")

    return task

def validate_subtask_assignee(assigned_to_id: Optional[int], team_id: int, db: Session):
    if assigned_to_id is None:
        return
    assignee = db.query(User).filter(User.id == assigned_to_id).first()
    if not assignee:
        raise HTTPException(status_code=400, detail="Assigned user not found")
    if assignee.role != UserRole.ADMIN and not is_user_team_member(assignee, team_id, db):
        raise HTTPException(status_code=400, detail="Assigned user must belong to the project's team")

@router.get("/tasks/{task_id}/subtasks", response_model=List[SubtaskResponse])
def get_subtasks(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_and_check_access(task_id, current_user, db)
    subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).order_by(Subtask.position.asc(), Subtask.created_at.asc()).all()
    return subtasks

@router.post("/tasks/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_and_check_access(task_id, current_user, db)
    team_id = task.project.team_id

    if not subtask_in.title or not subtask_in.title.strip():
        raise HTTPException(status_code=400, detail="Subtask title is required")

    validate_subtask_assignee(subtask_in.assigned_to_id, team_id, db)

    # Determine position
    existing_subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).all()
    next_position = max([s.position for s in existing_subtasks], default=-1) + 1

    subtask = Subtask(
        task_id=task.id,
        title=subtask_in.title.strip(),
        description=subtask_in.description.strip() if subtask_in.description else None,
        assigned_to_id=subtask_in.assigned_to_id,
        created_by_id=current_user.id,
        position=next_position,
        is_completed=False
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)

    # Activity Log
    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="SUBTASK_CREATED",
        entity_type="SUBTASK",
        entity_id=subtask.id,
        team_id=team_id,
        project_id=task.project_id,
        task_id=task.id,
        description=f"{current_user.full_name} added subtask \"{subtask.title}\" to \"{task.title}\"."
    )

    # Notification for assignee
    if subtask_in.assigned_to_id and subtask_in.assigned_to_id != current_user.id:
        create_notification(
            db=db,
            user_id=subtask_in.assigned_to_id,
            type="SUBTASK_ASSIGNED",
            title="New Subtask Assigned",
            message=f"{current_user.full_name} assigned you subtask '{subtask.title}' in '{task.title}'.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )

    return subtask

@router.patch("/subtasks/{subtask_id}", response_model=SubtaskResponse)
def update_subtask(
    subtask_id: int,
    subtask_in: SubtaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    task = get_task_and_check_access(subtask.task_id, current_user, db)
    team_id = task.project.team_id

    old_assigned_id = subtask.assigned_to_id
    old_completed = subtask.is_completed

    if subtask_in.assigned_to_id is not None:
        validate_subtask_assignee(subtask_in.assigned_to_id, team_id, db)
        subtask.assigned_to_id = subtask_in.assigned_to_id

    if subtask_in.title is not None:
        if not subtask_in.title.strip():
            raise HTTPException(status_code=400, detail="Subtask title cannot be empty")
        subtask.title = subtask_in.title.strip()

    if subtask_in.description is not None:
        subtask.description = subtask_in.description.strip() if subtask_in.description else None

    if subtask_in.position is not None:
        subtask.position = subtask_in.position

    if subtask_in.is_completed is not None and subtask_in.is_completed != old_completed:
        subtask.is_completed = subtask_in.is_completed
        if subtask_in.is_completed:
            subtask.completed_by_id = current_user.id
            subtask.completed_at = datetime.utcnow()
            log_activity(
                db=db,
                actor_id=current_user.id,
                action_type="SUBTASK_COMPLETED",
                entity_type="SUBTASK",
                entity_id=subtask.id,
                team_id=team_id,
                project_id=task.project_id,
                task_id=task.id,
                description=f"{current_user.full_name} completed subtask \"{subtask.title}\" in \"{task.title}\"."
            )
        else:
            subtask.completed_by_id = None
            subtask.completed_at = None
            log_activity(
                db=db,
                actor_id=current_user.id,
                action_type="SUBTASK_REOPENED",
                entity_type="SUBTASK",
                entity_id=subtask.id,
                team_id=team_id,
                project_id=task.project_id,
                task_id=task.id,
                description=f"{current_user.full_name} reopened subtask \"{subtask.title}\" in \"{task.title}\"."
            )
    else:
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="SUBTASK_UPDATED",
            entity_type="SUBTASK",
            entity_id=subtask.id,
            team_id=team_id,
            project_id=task.project_id,
            task_id=task.id,
            description=f"{current_user.full_name} updated subtask \"{subtask.title}\"."
        )

    db.commit()
    db.refresh(subtask)

    # Notify on assignment change
    if subtask_in.assigned_to_id is not None and subtask_in.assigned_to_id != old_assigned_id:
        if subtask_in.assigned_to_id and subtask_in.assigned_to_id != current_user.id:
            create_notification(
                db=db,
                user_id=subtask_in.assigned_to_id,
                type="SUBTASK_ASSIGNED",
                title="Subtask Assigned",
                message=f"{current_user.full_name} assigned you subtask '{subtask.title}' in '{task.title}'.",
                related_entity_type="TASK",
                related_entity_id=task.id,
                action_url=f"/tasks?id={task.id}"
            )
            assignee = db.query(User).filter(User.id == subtask_in.assigned_to_id).first()
            assignee_name = assignee.full_name if assignee else f"User #{subtask_in.assigned_to_id}"
            log_activity(
                db=db,
                actor_id=current_user.id,
                action_type="SUBTASK_ASSIGNED",
                entity_type="SUBTASK",
                entity_id=subtask.id,
                team_id=team_id,
                project_id=task.project_id,
                task_id=task.id,
                target_user_id=subtask_in.assigned_to_id,
                description=f"{current_user.full_name} assigned subtask \"{subtask.title}\" to {assignee_name}."
            )

    return subtask

@router.patch("/subtasks/{subtask_id}/toggle", response_model=SubtaskResponse)
def toggle_subtask(
    subtask_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    task = get_task_and_check_access(subtask.task_id, current_user, db)
    team_id = task.project.team_id

    subtask.is_completed = not subtask.is_completed
    if subtask.is_completed:
        subtask.completed_by_id = current_user.id
        subtask.completed_at = datetime.utcnow()
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="SUBTASK_COMPLETED",
            entity_type="SUBTASK",
            entity_id=subtask.id,
            team_id=team_id,
            project_id=task.project_id,
            task_id=task.id,
            description=f"{current_user.full_name} completed subtask \"{subtask.title}\" in \"{task.title}\"."
        )
    else:
        subtask.completed_by_id = None
        subtask.completed_at = None
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="SUBTASK_REOPENED",
            entity_type="SUBTASK",
            entity_id=subtask.id,
            team_id=team_id,
            project_id=task.project_id,
            task_id=task.id,
            description=f"{current_user.full_name} reopened subtask \"{subtask.title}\" in \"{task.title}\"."
        )

    db.commit()
    db.refresh(subtask)
    return subtask

@router.patch("/subtasks/{subtask_id}/assign", response_model=SubtaskResponse)
def assign_subtask(
    subtask_id: int,
    data: SubtaskAssignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    task = get_task_and_check_access(subtask.task_id, current_user, db)
    team_id = task.project.team_id

    validate_subtask_assignee(data.assigned_to_id, team_id, db)
    subtask.assigned_to_id = data.assigned_to_id

    db.commit()
    db.refresh(subtask)

    if data.assigned_to_id and data.assigned_to_id != current_user.id:
        create_notification(
            db=db,
            user_id=data.assigned_to_id,
            type="SUBTASK_ASSIGNED",
            title="Subtask Assigned",
            message=f"{current_user.full_name} assigned you subtask '{subtask.title}' in '{task.title}'.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )
        assignee = db.query(User).filter(User.id == data.assigned_to_id).first()
        assignee_name = assignee.full_name if assignee else f"User #{data.assigned_to_id}"
        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="SUBTASK_ASSIGNED",
            entity_type="SUBTASK",
            entity_id=subtask.id,
            team_id=team_id,
            project_id=task.project_id,
            task_id=task.id,
            target_user_id=data.assigned_to_id,
            description=f"{current_user.full_name} assigned subtask \"{subtask.title}\" to {assignee_name}."
        )

    return subtask

@router.delete("/subtasks/{subtask_id}")
def delete_subtask(
    subtask_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    task = get_task_and_check_access(subtask.task_id, current_user, db)
    team_id = task.project.team_id

    subtask_title = subtask.title
    task_id = subtask.task_id

    db.delete(subtask)
    db.commit()

    # Re-normalize positions for remaining subtasks
    remaining = db.query(Subtask).filter(Subtask.task_id == task_id).order_by(Subtask.position.asc(), Subtask.created_at.asc()).all()
    for index, st in enumerate(remaining):
        st.position = index
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="SUBTASK_DELETED",
        entity_type="SUBTASK",
        entity_id=subtask_id,
        team_id=team_id,
        project_id=task.project_id,
        task_id=task_id,
        description=f"{current_user.full_name} deleted subtask \"{subtask_title}\" from \"{task.title}\"."
    )

    return {"message": "Subtask deleted successfully"}

@router.patch("/tasks/{task_id}/subtasks/reorder", response_model=List[SubtaskResponse])
def reorder_subtasks(
    task_id: int,
    request_data: SubtaskReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = get_task_and_check_access(task_id, current_user, db)

    item_map = {item.id: item.position for item in request_data.items}
    subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).all()

    for st in subtasks:
        if st.id in item_map:
            st.position = item_map[st.id]

    db.commit()
    return db.query(Subtask).filter(Subtask.task_id == task.id).order_by(Subtask.position.asc()).all()
