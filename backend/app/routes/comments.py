from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.comment import TaskComment
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(tags=["Comments"])

@router.get("/tasks/{task_id}/comments", response_model=List[CommentResponse])
def get_task_comments(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not is_user_team_member(current_user, task.project.team_id, db) and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view comments on this task")

    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
    return comments

@router.post("/tasks/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not is_user_team_member(current_user, task.project.team_id, db) and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add comments on this task")

    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="COMMENT_ADDED",
        entity_type="COMMENT",
        entity_id=comment.id,
        team_id=task.project.team_id,
        project_id=task.project_id,
        task_id=task.id,
        description=f"{current_user.full_name} commented on \"{task.title}\"."
    )

    # Send Notification to assigned user or lead if someone else comments
    recipient_id = task.assigned_to_id if task.assigned_to_id != current_user.id else task.project.team.lead_id
    if recipient_id and recipient_id != current_user.id:
        create_notification(
            db=db,
            user_id=recipient_id,
            type="TASK_COMMENT_ADDED",
            title="New Comment on Task",
            message=f"{current_user.full_name} commented on task '{task.title}'.",
            related_entity_type="TASK",
            related_entity_id=task.id,
            action_url=f"/tasks?id={task.id}"
        )

    return comment

@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(TaskComment).filter(TaskComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Author, Team Lead, or Admin can edit
    is_lead = is_user_team_lead(current_user, comment.task.project.team_id, db)
    if comment.user_id != current_user.id and not is_lead:
        raise HTTPException(status_code=403, detail="Only comment author, Team Lead, or Admin can edit comment")

    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="COMMENT_UPDATED",
        entity_type="COMMENT",
        entity_id=comment.id,
        team_id=comment.task.project.team_id,
        project_id=comment.task.project_id,
        task_id=comment.task_id,
        description=f"{current_user.full_name} edited a comment on \"{comment.task.title}\"."
    )

    return comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(TaskComment).filter(TaskComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    is_lead = is_user_team_lead(current_user, comment.task.project.team_id, db)
    if comment.user_id != current_user.id and not is_lead:
        raise HTTPException(status_code=403, detail="Only comment author, Team Lead, or Admin can delete comment")

    task_title = comment.task.title
    team_id = comment.task.project.team_id
    project_id = comment.task.project_id
    task_id = comment.task_id

    db.delete(comment)
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="COMMENT_DELETED",
        entity_type="COMMENT",
        entity_id=comment_id,
        team_id=team_id,
        project_id=project_id,
        task_id=task_id,
        description=f"{current_user.full_name} deleted a comment from \"{task_title}\"."
    )

    return None
