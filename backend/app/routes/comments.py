from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.comment import TaskComment
from app.models.notification import Notification
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member

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

    # Send Notification to assigned user or lead if someone else comments
    recipient_id = task.assigned_to_id if task.assigned_to_id != current_user.id else task.project.team.lead_id
    if recipient_id and recipient_id != current_user.id:
        notif = Notification(
            user_id=recipient_id,
            title="New Task Comment",
            message=f"{current_user.full_name} commented on task '{task.title}'.",
            link=f"/tasks?id={task.id}"
        )
        db.add(notif)
        db.commit()

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

    db.delete(comment)
    db.commit()
    return None
