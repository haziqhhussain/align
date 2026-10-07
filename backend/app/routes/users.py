from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.social import Friendship, FriendRequest, FriendRequestStatus
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate, UserRoleUpdate, UserDetailResponse, TeamRoleInfo,
    UserPublicProfileResponse, SharedTeamInfo
)
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

def format_user_public_profile(target_user: User, current_user: User, db: Session) -> dict:
    # 1. Friendship status & request ID
    friendship_status = "NONE"
    friend_request_id = None

    if target_user.id == current_user.id:
        friendship_status = "SELF"
    else:
        is_friend = db.query(Friendship).filter(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == target_user.id
        ).first()
        if is_friend:
            friendship_status = "FRIENDS"
        else:
            sent_req = db.query(FriendRequest).filter(
                FriendRequest.sender_id == current_user.id,
                FriendRequest.receiver_id == target_user.id,
                FriendRequest.status == FriendRequestStatus.PENDING
            ).first()
            if sent_req:
                friendship_status = "PENDING_SENT"
                friend_request_id = sent_req.id
            else:
                recv_req = db.query(FriendRequest).filter(
                    FriendRequest.sender_id == target_user.id,
                    FriendRequest.receiver_id == current_user.id,
                    FriendRequest.status == FriendRequestStatus.PENDING
                ).first()
                if recv_req:
                    friendship_status = "PENDING_RECEIVED"
                    friend_request_id = recv_req.id

    # 2. Teams info (teams target user belongs to / leads / owns)
    memberships = db.query(TeamMember).filter(TeamMember.user_id == target_user.id).all()
    teams_info = []
    target_team_ids = set()

    for m in memberships:
        if m.team:
            target_team_ids.add(m.team_id)
            teams_info.append({
                "team_id": m.team_id,
                "team_name": m.team.name,
                "role": m.role or ("LEAD" if m.team.lead_id == target_user.id else "MEMBER")
            })

    # Add teams owned/led if not in memberships list
    owned_led_teams = db.query(Team).filter(
        (Team.owner_id == target_user.id) | (Team.lead_id == target_user.id)
    ).all()
    for t in owned_led_teams:
        if t.id not in target_team_ids:
            target_team_ids.add(t.id)
            r = "OWNER" if t.owner_id == target_user.id else "LEAD"
            teams_info.append({
                "team_id": t.id,
                "team_name": t.name,
                "role": r
            })

    # 3. Shared teams between current_user and target_user
    cur_memberships = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    cur_team_ids = set([m[0] for m in cur_memberships])
    cur_owned = db.query(Team.id).filter(
        (Team.owner_id == current_user.id) | (Team.lead_id == current_user.id)
    ).all()
    cur_team_ids.update([t[0] for t in cur_owned])

    shared_team_ids = list(cur_team_ids.intersection(target_team_ids))
    shared_teams = []
    if shared_team_ids:
        teams = db.query(Team).filter(Team.id.in_(shared_team_ids)).all()
        shared_teams = [{"team_id": t.id, "team_name": t.name} for t in teams]

    return {
        "id": target_user.id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "avatar_url": target_user.avatar_url,
        "role": target_user.role,
        "is_active": target_user.is_active,
        "created_at": target_user.created_at,
        "updated_at": target_user.updated_at,
        "friendship_status": friendship_status,
        "friend_request_id": friend_request_id,
        "teams_info": teams_info,
        "shared_teams": shared_teams
    }

def verify_not_last_admin(db: Session, target_user: User, new_role_or_action: str):
    target_role_str = str(target_user.role.value if hasattr(target_user.role, 'value') else target_user.role)
    new_action_str = str(new_role_or_action.value if hasattr(new_role_or_action, 'value') else new_role_or_action)

    if target_role_str == "ADMIN" and new_action_str != "ADMIN":
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

@router.get("/{user_id}", response_model=UserPublicProfileResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return format_user_public_profile(user, current_user, db)

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
