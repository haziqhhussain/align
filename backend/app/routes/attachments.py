from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.task import Task
from app.models.project import Project
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentResponse, AttachmentListResponse
from app.dependencies.auth import get_current_user, is_user_team_lead, is_user_team_member
from app.services.storage_service import (
    save_uploaded_file,
    delete_stored_file,
    get_safe_file_path
)
from app.services.activity_service import log_activity

router = APIRouter(tags=["Attachments"])

def check_task_access(task_id: int, current_user: User, db: Session) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    team_id = task.project.team_id
    if current_user.role != UserRole.ADMIN:
        if not is_user_team_member(current_user, team_id, db) and task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access attachments for this task"
            )
    return task

def check_project_access(project_id: int, current_user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    team_id = project.team_id
    if current_user.role != UserRole.ADMIN:
        if not is_user_team_member(current_user, team_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access attachments for this project"
            )
    return project

@router.get("/tasks/{task_id}/attachments", response_model=AttachmentListResponse)
def get_task_attachments(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = check_task_access(task_id, current_user, db)
    attachments = db.query(Attachment).filter(
        Attachment.task_id == task.id
    ).order_by(Attachment.created_at.desc()).all()

    return AttachmentListResponse(items=attachments, total=len(attachments))

@router.post("/tasks/{task_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_task_attachment(
    task_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = check_task_access(task_id, current_user, db)

    # Save physical file to disk
    original_name, stored_file_name, relative_path, file_size, mime_type = save_uploaded_file(file, "tasks")

    # Save database record
    attachment = Attachment(
        file_name=original_name,
        stored_file_name=stored_file_name,
        file_path=relative_path,
        file_size=file_size,
        mime_type=mime_type,
        uploaded_by_id=current_user.id,
        task_id=task.id,
        project_id=None
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Log Activity
    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="ATTACHMENT_UPLOADED",
        entity_type="ATTACHMENT",
        entity_id=attachment.id,
        team_id=task.project.team_id,
        project_id=task.project_id,
        task_id=task.id,
        description=f"{current_user.full_name} uploaded '{original_name}' to task '{task.title}'",
        metadata={
            "attachment_id": attachment.id,
            "file_name": original_name,
            "file_size": file_size,
            "mime_type": mime_type
        }
    )

    return attachment

@router.get("/projects/{project_id}/attachments", response_model=AttachmentListResponse)
def get_project_attachments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = check_project_access(project_id, current_user, db)
    attachments = db.query(Attachment).filter(
        Attachment.project_id == project.id,
        Attachment.task_id == None
    ).order_by(Attachment.created_at.desc()).all()

    return AttachmentListResponse(items=attachments, total=len(attachments))

@router.post("/projects/{project_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_project_attachment(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = check_project_access(project_id, current_user, db)

    # Save physical file to disk
    original_name, stored_file_name, relative_path, file_size, mime_type = save_uploaded_file(file, "projects")

    # Save database record
    attachment = Attachment(
        file_name=original_name,
        stored_file_name=stored_file_name,
        file_path=relative_path,
        file_size=file_size,
        mime_type=mime_type,
        uploaded_by_id=current_user.id,
        project_id=project.id,
        task_id=None
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    # Log Activity
    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="ATTACHMENT_UPLOADED",
        entity_type="ATTACHMENT",
        entity_id=attachment.id,
        team_id=project.team_id,
        project_id=project.id,
        description=f"{current_user.full_name} uploaded '{original_name}' to project '{project.name}'",
        metadata={
            "attachment_id": attachment.id,
            "file_name": original_name,
            "file_size": file_size,
            "mime_type": mime_type
        }
    )

    return attachment

@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    # Verify authorization
    if attachment.task_id:
        check_task_access(attachment.task_id, current_user, db)
    elif attachment.project_id:
        check_project_access(attachment.project_id, current_user, db)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Orphaned attachment access forbidden"
        )

    abs_file_path = get_safe_file_path(attachment.file_path)

    import os
    if not os.path.exists(abs_file_path) or not os.path.isfile(abs_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on server"
        )

    return FileResponse(
        path=abs_file_path,
        filename=attachment.file_name,
        media_type=attachment.mime_type
    )

@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    # Determine team_id & permissions
    team_id = None
    parent_title = ""
    parent_type = ""

    if attachment.task:
        team_id = attachment.task.project.team_id
        parent_title = attachment.task.title
        parent_type = "task"
    elif attachment.project:
        team_id = attachment.project.team_id
        parent_title = attachment.project.name
        parent_type = "project"

    # Permission check: Admin, Uploader, or Team Lead/Owner
    can_delete = False
    if current_user.role == UserRole.ADMIN:
        can_delete = True
    elif attachment.uploaded_by_id == current_user.id:
        can_delete = True
    elif team_id and is_user_team_lead(current_user, team_id, db):
        can_delete = True

    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this attachment"
        )

    # Delete physical file
    delete_stored_file(attachment.file_path)

    # Store details for activity log before DB deletion
    file_name = attachment.file_name
    file_size = attachment.file_size
    task_id = attachment.task_id
    project_id = attachment.project_id

    # Delete DB record
    db.delete(attachment)
    db.commit()

    # Log Activity
    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="ATTACHMENT_DELETED",
        entity_type="ATTACHMENT",
        entity_id=attachment_id,
        team_id=team_id,
        project_id=project_id,
        task_id=task_id,
        description=f"{current_user.full_name} deleted '{file_name}' from {parent_type} '{parent_title}'",
        metadata={
            "attachment_id": attachment_id,
            "file_name": file_name,
            "file_size": file_size
        }
    )

    return {"message": "Attachment deleted successfully", "id": attachment_id}
