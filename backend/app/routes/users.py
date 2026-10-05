from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.schemas.user import UserResponse, UserCreate, UserUpdate, UserRoleUpdate, UserDetailResponse, TeamRoleInfo
from app.auth.password import get_password_hash
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])

def format_user_detail(user: User, db: Session) -> dict:
    teams_info = []
    # 1. Teams led
    led_teams = db.query(Team).filter(Team.lead_id == user.id).all()
    for t in led_teams:
        teams_info.append({
            "team_id": t.id,
            "team_name": t.name,
            "is_lead": True
        })

    # 2. Member teams (exclude if already added as lead)
    led_team_ids = set(t.id for t in led_teams)
    memberships = db.query(TeamMember).filter(TeamMember.user_id == user.id).all()
    for m in memberships:
        if m.team_id not in led_team_ids and m.team:
            teams_info.append({
                "team_id": m.team_id,
                "team_name": m.team.name,
                "is_lead": False
            })

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "teams_info": teams_info
    }

def verify_not_last_admin(db: Session, target_user: User, new_role_or_action: str):
    if target_user.role == UserRole.ADMIN and new_role_or_action != UserRole.ADMIN:
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action denied: Cannot demote or delete the last remaining Admin account"
            )

@router.get("", response_model=List[UserDetailResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [format_user_detail(u, db) for u in users]

@router.post("", response_model=UserDetailResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_admin), # Admin only
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    user = User(
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or UserRole.MEMBER,
        avatar_url=user_in.avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return format_user_detail(user, db)

@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return format_user_detail(user, db)

@router.patch("/{user_id}/role", response_model=UserDetailResponse)
def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    current_user: User = Depends(require_admin), # Admin only
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent demoting the last admin
    if role_in.role == UserRole.MEMBER:
        verify_not_last_admin(db, user, "MEMBER")

    user.role = role_in.role
    db.commit()
    db.refresh(user)
    return format_user_detail(user, db)

@router.put("/{user_id}", response_model=UserDetailResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Admin or user themselves can update profile
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this user")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.avatar_url is not None:
        user.avatar_url = user_in.avatar_url
        
    # Role updates require Admin permissions and last admin check
    if user_in.role is not None and user_in.role != user.role:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin can change user roles")
        if user_in.role == UserRole.MEMBER:
            verify_not_last_admin(db, user, "MEMBER")
        user.role = user_in.role
        
    if user_in.is_active is not None and user_in.is_active != user.is_active:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin can activate/deactivate users")
        if not user_in.is_active:
            verify_not_last_admin(db, user, "DEACTIVATE")
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)
    return format_user_detail(user, db)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin), # Admin only
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account while logged in as Admin"
        )

    verify_not_last_admin(db, user, "DELETE")

    db.delete(user)
    db.commit()
    return None
