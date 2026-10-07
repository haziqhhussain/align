from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.jwt import decode_access_token
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.models.task import Task
from app.models.comment import TaskComment

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can perform this action"
        )
    return current_user

def is_user_team_owner(user: User, team_id: int, db: Session) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return False
    if team.owner_id == user.id:
        return True
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user.id,
        TeamMember.role == "OWNER"
    ).first()
    return member is not None

def is_user_team_lead(user: User, team_id: int, db: Session) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return False
    if team.owner_id == user.id or team.lead_id == user.id:
        return True
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user.id
    ).first()
    if member and member.role in ["OWNER", "LEAD"]:
        return True
    return False

def is_user_team_member(user: User, team_id: int, db: Session) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return False
    if team.owner_id == user.id or team.lead_id == user.id:
        return True
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user.id
    ).first()
    return member is not None

def require_team_lead_for_team(team_id: int, user: User, db: Session):
    if not is_user_team_lead(user, team_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized as a Team Lead or Owner for this team"
        )

def require_team_member_for_team(team_id: int, user: User, db: Session):
    if not is_user_team_member(user, team_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member, lead, or owner of this team"
        )
