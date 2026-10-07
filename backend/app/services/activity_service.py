import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)

def log_activity(
    db: Session,
    actor_id: Optional[int],
    action_type: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    description: str = "",
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    target_user_id: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[ActivityLog]:
    """
    Centralized helper to record an activity log entry safely.
    Catches exceptions internally to avoid breaking the caller's transaction.
    """
    try:
        metadata_str = json.dumps(metadata) if metadata is not None else None
        
        log_entry = ActivityLog(
            actor_id=actor_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            team_id=team_id,
            project_id=project_id,
            task_id=task_id,
            target_user_id=target_user_id,
            description=description,
            metadata_json=metadata_str
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"[ActivityService] Failed to log activity '{action_type}': {e}")
        db.rollback()
        return None
