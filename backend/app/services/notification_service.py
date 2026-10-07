from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None
) -> Optional[Notification]:
    """
    Centralized helper function to create or update notifications.
    Prevents unread duplicates for the same entity and type.
    """
    if not user_id:
        return None

    if related_entity_type and related_entity_id:
        existing = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.type == type,
            Notification.related_entity_type == related_entity_type,
            Notification.related_entity_id == related_entity_id,
            Notification.is_read == False
        ).first()

        if existing:
            existing.title = title
            existing.message = message
            existing.action_url = action_url or existing.action_url
            existing.link = action_url or existing.link
            db.commit()
            db.refresh(existing)
            return existing

    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        action_url=action_url,
        link=action_url,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def check_deadline_notifications(db: Session):
    """
    Checks tasks due soon or overdue and creates idempotent notifications for assigned users.
    Can be called by background schedulers or system jobs.
    """
    from datetime import datetime, timedelta
    from app.models.task import Task, TaskStatus

    now = datetime.utcnow()
    today_date = now.date()
    tomorrow_date = (now + timedelta(days=1)).date()

    tasks = db.query(Task).filter(
        Task.status != TaskStatus.COMPLETED,
        Task.due_date != None,
        Task.assigned_to_id != None
    ).all()

    for t in tasks:
        if not t.due_date or not t.assigned_to_id:
            continue
        due_day = t.due_date.date()
        if due_day == today_date or due_day == tomorrow_date:
            create_notification(
                db=db,
                user_id=t.assigned_to_id,
                type="TASK_DUE_SOON",
                title=f"Task Due Soon: {t.title}",
                message=f"Task '{t.title}' is due on {due_day.strftime('%b %d, %Y')}.",
                action_url=f"/tasks?id={t.id}",
                related_entity_type="TASK",
                related_entity_id=t.id
            )
        elif due_day < today_date:
            create_notification(
                db=db,
                user_id=t.assigned_to_id,
                type="TASK_OVERDUE",
                title=f"Task Overdue: {t.title}",
                message=f"Task '{t.title}' was due on {due_day.strftime('%b %d, %Y')} and is overdue.",
                action_url=f"/tasks?id={t.id}",
                related_entity_type="TASK",
                related_entity_id=t.id
            )

