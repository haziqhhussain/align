from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.session import get_db
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.social import (
    FriendRequest, Friendship, FriendRequestStatus,
    TeamInvitation, TeamInvitationStatus
)
from app.models.notification import Notification
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity
from app.schemas.social import (
    FriendRequestResponse, FriendshipResponse, TeamInvitationResponse, UserSearchResponse
)
from app.schemas.user import UserResponse
from app.dependencies.auth import get_current_user, is_user_team_lead

router = APIRouter(tags=["Social & Connections"])

# ==========================================
# USER SEARCH & CONNECTIONS DISCOVERY
# ==========================================

@router.get("/users/search", response_model=List[UserSearchResponse])
def search_users(
    q: Optional[str] = Query(None, description="Search term for name or email"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.id != current_user.id, User.is_active == True)
    if q and q.strip():
        search_str = f"%{q.strip()}%"
        query = query.filter(or_(User.full_name.ilike(search_str), User.email.ilike(search_str)))

    users = query.limit(30).all()

    # Get friendships of current user
    friendships = db.query(Friendship.friend_id).filter(Friendship.user_id == current_user.id).all()
    friend_ids = set([f[0] for f in friendships])

    # Get pending friend requests involving current user
    sent_requests = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == FriendRequestStatus.PENDING
    ).all()
    sent_map = {r.receiver_id: r.id for r in sent_requests}

    received_requests = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == FriendRequestStatus.PENDING
    ).all()
    received_map = {r.sender_id: r.id for r in received_requests}

    results = []
    for u in users:
        rel_status = "NONE"
        req_id = None

        if u.id in friend_ids:
            rel_status = "FRIENDS"
        elif u.id in sent_map:
            rel_status = "PENDING_SENT"
            req_id = sent_map[u.id]
        elif u.id in received_map:
            rel_status = "PENDING_RECEIVED"
            req_id = received_map[u.id]

        res = UserSearchResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            avatar_url=u.avatar_url,
            created_at=u.created_at,
            updated_at=u.updated_at,
            friendship_status=rel_status,
            friend_request_id=req_id
        )
        results.append(res)

    return results

# ==========================================
# FRIEND REQUESTS & FRIENDSHIPS
# ==========================================

@router.get("/friends", response_model=List[UserResponse])
def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friendships = db.query(Friendship).filter(Friendship.user_id == current_user.id).all()
    friend_ids = [f.friend_id for f in friendships]
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    return friends

@router.delete("/friends/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch target user for description before deletion
    target_user = db.query(User).filter(User.id == user_id).first()
    target_name = target_user.full_name if target_user else f"User #{user_id}"

    # Bidirectional remove
    db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == current_user.id, Friendship.friend_id == user_id),
            and_(Friendship.user_id == user_id, Friendship.friend_id == current_user.id)
        )
    ).delete(synchronize_session=False)
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="FRIEND_REMOVED",
        entity_type="FRIENDSHIP",
        target_user_id=user_id,
        description=f"{current_user.full_name} removed {target_name} from friends."
    )

    return None

@router.get("/friend-requests", response_model=List[FriendRequestResponse])
def get_all_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reqs = db.query(FriendRequest).filter(
        or_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == current_user.id),
        FriendRequest.status == FriendRequestStatus.PENDING
    ).all()
    return reqs

@router.get("/friend-requests/incoming", response_model=List[FriendRequestResponse])
def get_incoming_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == FriendRequestStatus.PENDING
    ).all()

@router.get("/friend-requests/outgoing", response_model=List[FriendRequestResponse])
def get_outgoing_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == FriendRequestStatus.PENDING
    ).all()

@router.post("/friend-requests/{user_id}", response_model=FriendRequestResponse, status_code=status.HTTP_201_CREATED)
def send_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")

    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if already friends
    existing_friendship = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == user_id
    ).first()
    if existing_friendship:
        raise HTTPException(status_code=400, detail="You are already friends with this user")

    # Check if active request already exists
    existing_req = db.query(FriendRequest).filter(
        or_(
            and_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == user_id),
            and_(FriendRequest.sender_id == user_id, FriendRequest.receiver_id == current_user.id)
        ),
        FriendRequest.status == FriendRequestStatus.PENDING
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="A pending friend request already exists between you")

    freq = FriendRequest(
        sender_id=current_user.id,
        receiver_id=user_id,
        status=FriendRequestStatus.PENDING
    )
    db.add(freq)
    db.commit()
    db.refresh(freq)

    # Notification for receiver
    create_notification(
        db=db,
        user_id=user_id,
        type="FRIEND_REQUEST",
        title="New friend request",
        message=f"{current_user.full_name} sent you a friend request.",
        action_url="/connections",
        related_entity_type="friend_request",
        related_entity_id=freq.id
    )

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="FRIEND_REQUEST_SENT",
        entity_type="FRIENDSHIP",
        entity_id=freq.id,
        target_user_id=user_id,
        description=f"{current_user.full_name} sent a friend request to {target_user.full_name}."
    )

    return freq

@router.patch("/friend-requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.receiver_id == current_user.id
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Friend request not found or unauthorized")

    if freq.status != FriendRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Friend request is not pending")

    freq.status = FriendRequestStatus.ACCEPTED

    # Create bidirectional Friendship entries
    f1 = Friendship(user_id=freq.sender_id, friend_id=freq.receiver_id)
    f2 = Friendship(user_id=freq.receiver_id, friend_id=freq.sender_id)
    db.add_all([f1, f2])
    db.commit()
    db.refresh(freq)

    # Notify sender that request was accepted
    create_notification(
        db=db,
        user_id=freq.sender_id,
        type="FRIEND_REQUEST_ACCEPTED",
        title="Friend request accepted",
        message=f"{current_user.full_name} accepted your friend request.",
        action_url=f"/users/{current_user.id}",
        related_entity_type="user",
        related_entity_id=current_user.id
    )

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="FRIEND_REQUEST_ACCEPTED",
        entity_type="FRIENDSHIP",
        entity_id=freq.id,
        target_user_id=freq.sender_id,
        description=f"{current_user.full_name} accepted {freq.sender.full_name}'s friend request."
    )

    return freq

@router.patch("/friend-requests/{request_id}/reject", response_model=FriendRequestResponse)
def reject_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.receiver_id == current_user.id
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Friend request not found or unauthorized")

    freq.status = FriendRequestStatus.REJECTED
    db.commit()
    db.refresh(freq)
    return freq

@router.delete("/friend-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.sender_id == current_user.id
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Friend request not found or unauthorized")

    db.delete(freq)
    db.commit()
    return None

# ==========================================
# TEAM INVITATIONS
# ==========================================

@router.get("/team-invitations", response_model=List[TeamInvitationResponse])
def get_incoming_team_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invites = db.query(TeamInvitation).filter(
        TeamInvitation.receiver_id == current_user.id,
        TeamInvitation.status == TeamInvitationStatus.PENDING
    ).all()
    return invites

@router.get("/teams/{team_id}/invitations", response_model=List[TeamInvitationResponse])
def get_team_invitations_for_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner or Lead can view team invitations")

    invites = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id,
        TeamInvitation.status == TeamInvitationStatus.PENDING
    ).all()
    return invites

@router.post("/teams/{team_id}/invitations/{user_id}", response_model=TeamInvitationResponse, status_code=status.HTTP_201_CREATED)
def invite_user_to_team(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner or Lead can invite users to this team")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself to a team")

    target_user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if already a team member
    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    # Check if pending invite exists
    existing_invite = db.query(TeamInvitation).filter(
        TeamInvitation.team_id == team_id,
        TeamInvitation.receiver_id == user_id,
        TeamInvitation.status == TeamInvitationStatus.PENDING
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="A pending team invitation already exists for this user")

    invitation = TeamInvitation(
        team_id=team_id,
        sender_id=current_user.id,
        receiver_id=user_id,
        role="MEMBER",
        status=TeamInvitationStatus.PENDING
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Send Notification to receiver
    create_notification(
        db=db,
        user_id=user_id,
        type="TEAM_INVITATION",
        title="Team invitation",
        message=f"{current_user.full_name} invited you to join '{team.name}'.",
        action_url="/invitations",
        related_entity_type="team_invitation",
        related_entity_id=invitation.id
    )

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_MEMBER_INVITED",
        entity_type="TEAM_INVITATION",
        entity_id=invitation.id,
        team_id=team_id,
        target_user_id=user_id,
        description=f"{current_user.full_name} invited {target_user.full_name} to \"{team.name}\"."
    )

    return invitation

@router.patch("/team-invitations/{invitation_id}/accept", response_model=TeamInvitationResponse)
def accept_team_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.receiver_id == current_user.id
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Team invitation not found or unauthorized")

    if invitation.status != TeamInvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invitation is no longer pending")

    invitation.status = TeamInvitationStatus.ACCEPTED

    # Add as TeamMember
    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == invitation.team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not existing_member:
        tm = TeamMember(
            team_id=invitation.team_id,
            user_id=current_user.id,
            role=invitation.role or "MEMBER"
        )
        db.add(tm)

    db.commit()
    db.refresh(invitation)

    # Notify sender / team owner
    create_notification(
        db=db,
        user_id=invitation.sender_id,
        type="TEAM_INVITATION_ACCEPTED",
        title="Team invitation accepted",
        message=f"{current_user.full_name} joined {invitation.team.name}.",
        action_url=f"/teams/{invitation.team_id}",
        related_entity_type="team",
        related_entity_id=invitation.team_id
    )

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_MEMBER_JOINED",
        entity_type="TEAM",
        entity_id=invitation.team_id,
        team_id=invitation.team_id,
        description=f"{current_user.full_name} joined \"{invitation.team.name}\"."
    )

    return invitation

@router.patch("/team-invitations/{invitation_id}/reject", response_model=TeamInvitationResponse)
def reject_team_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invitation = db.query(TeamInvitation).filter(
        TeamInvitation.id == invitation_id,
        TeamInvitation.receiver_id == current_user.id
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Team invitation not found or unauthorized")

    invitation.status = TeamInvitationStatus.REJECTED
    db.commit()
    db.refresh(invitation)
    return invitation

@router.delete("/team-invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_team_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invitation = db.query(TeamInvitation).filter(TeamInvitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Only sender or Team Lead/Owner can cancel
    if invitation.sender_id != current_user.id and not is_user_team_lead(current_user, invitation.team_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this invitation")

    db.delete(invitation)
    db.commit()
    return None
