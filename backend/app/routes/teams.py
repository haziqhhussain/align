from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamMemberAdd, TeamMemberResponse
from app.dependencies.auth import get_current_user, require_admin, is_user_team_lead, is_user_team_member, is_user_team_owner
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter(prefix="/teams", tags=["Teams"])

def format_team_response(team: Team, db: Session) -> dict:
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    project_count = db.query(Project).filter(Project.team_id == team.id).count()
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "lead_id": team.lead_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "owner": team.owner,
        "lead": team.lead,
        "members": team.members,
        "member_count": member_count,
        "project_count": project_count
    }

@router.get("", response_model=List[TeamResponse])
def get_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        teams = db.query(Team).all()
    else:
        # User sees teams where they are owner, lead, or member
        member_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        team_ids = [t[0] for t in member_team_ids]
        
        owned_team_ids = db.query(Team.id).filter(
            (Team.owner_id == current_user.id) | (Team.lead_id == current_user.id)
        ).all()
        team_ids.extend([t[0] for t in owned_team_ids])
        
        team_ids = list(set(team_ids))
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

    return [format_team_response(t, db) for t in teams]

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(get_current_user), # ANY authenticated user can create a team!
    db: Session = Depends(get_db)
):
    lead_id = team_in.lead_id or current_user.id

    team = Team(
        name=team_in.name,
        description=team_in.description,
        owner_id=current_user.id,
        lead_id=lead_id
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Automatically add creator as TeamMember with role OWNER
    creator_member = TeamMember(team_id=team.id, user_id=current_user.id, role="OWNER")
    db.add(creator_member)

    # Add initial specified members
    if team_in.member_ids:
        for uid in set(team_in.member_ids):
            if uid != current_user.id:
                u = db.query(User).filter(User.id == uid).first()
                if u:
                    r = "LEAD" if uid == lead_id else "MEMBER"
                    db.add(TeamMember(team_id=team.id, user_id=uid, role=r))

    db.commit()
    db.refresh(team)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_CREATED",
        entity_type="TEAM",
        entity_id=team.id,
        team_id=team.id,
        description=f"{current_user.full_name} created team \"{team.name}\"."
    )

    return format_team_response(team, db)

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not is_user_team_member(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this team")

    return format_team_response(team, db)

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    team_in: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Only Team Owner, Team Lead, or Admin can update team details
    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner, Lead, or Admin can edit team details")

    if team_in.name is not None:
        team.name = team_in.name
    if team_in.description is not None:
        team.description = team_in.description

    # Changing Team Lead
    lead_changed = False
    if team_in.lead_id is not None and team_in.lead_id != team.lead_id:
        if not is_user_team_owner(current_user, team_id, db):
            raise HTTPException(status_code=403, detail="Only Team Owner or Admin can reassign Team Lead")
        new_lead = db.query(User).filter(User.id == team_in.lead_id).first()
        if not new_lead:
            raise HTTPException(status_code=400, detail="New lead user not found")
        team.lead_id = team_in.lead_id
        lead_changed = True

        # Update or add team member role to LEAD
        existing_tm = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == team_in.lead_id
        ).first()
        if existing_tm:
            if existing_tm.role != "OWNER":
                existing_tm.role = "LEAD"
        else:
            db.add(TeamMember(team_id=team_id, user_id=team_in.lead_id, role="LEAD"))

        # Send notification to new lead
        create_notification(
            db=db,
            user_id=team_in.lead_id,
            type="TEAM_ROLE_CHANGED",
            title="Assigned as Team Lead",
            message=f"You have been assigned as Team Lead for team '{team.name}'.",
            related_entity_type="TEAM",
            related_entity_id=team.id,
            action_url=f"/teams/{team.id}"
        )

        log_activity(
            db=db,
            actor_id=current_user.id,
            action_type="TEAM_ROLE_CHANGED",
            entity_type="ROLE",
            entity_id=team_id,
            team_id=team_id,
            target_user_id=team_in.lead_id,
            description=f"{current_user.full_name} assigned {new_lead.full_name} as Team Lead for \"{team.name}\".",
            metadata={"old_role": "MEMBER", "new_role": "LEAD"}
        )

    db.commit()
    db.refresh(team)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_UPDATED",
        entity_type="TEAM",
        entity_id=team.id,
        team_id=team.id,
        description=f"{current_user.full_name} updated team \"{team.name}\"."
    )

    return format_team_response(team, db)

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Only Team Owner or Admin can delete team
    if not is_user_team_owner(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner or Admin can delete teams")

    team_name = team.name
    db.delete(team)
    db.commit()

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_DELETED",
        entity_type="TEAM",
        entity_id=team_id,
        team_id=team_id,
        description=f"{current_user.full_name} deleted team \"{team_name}\"."
    )

    return None

@router.post("/{team_id}/members", response_model=TeamResponse)
def add_team_member(
    team_id: int,
    member_in: TeamMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner or Lead can add team members directly")

    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User to add not found")

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_in.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    tm = TeamMember(team_id=team_id, user_id=member_in.user_id, role=member_in.role or "MEMBER")
    db.add(tm)
    db.commit()
    db.refresh(team)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_MEMBER_JOINED",
        entity_type="TEAM",
        entity_id=team_id,
        team_id=team_id,
        target_user_id=member_in.user_id,
        description=f"{current_user.full_name} added {user.full_name} to \"{team.name}\"."
    )

    return format_team_response(team, db)

@router.delete("/{team_id}/members/{user_id}", response_model=TeamResponse)
def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Team Owner or Lead can remove team members")

    if team.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove Team Owner")

    tm = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Member not found in team")

    removed_user = db.query(User).filter(User.id == user_id).first()
    removed_name = removed_user.full_name if removed_user else f"User #{user_id}"

    db.delete(tm)
    db.commit()
    db.refresh(team)

    log_activity(
        db=db,
        actor_id=current_user.id,
        action_type="TEAM_MEMBER_REMOVED",
        entity_type="TEAM",
        entity_id=team_id,
        team_id=team_id,
        target_user_id=user_id,
        description=f"{current_user.full_name} removed {removed_name} from \"{team.name}\"."
    )

    return format_team_response(team, db)
