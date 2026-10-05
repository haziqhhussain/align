from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamMemberAdd, TeamMemberResponse
from app.dependencies.auth import get_current_user, require_admin, is_user_team_lead, is_user_team_member

router = APIRouter(prefix="/teams", tags=["Teams"])

def format_team_response(team: Team, db: Session) -> dict:
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    project_count = db.query(Project).filter(Project.team_id == team.id).count()
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "lead_id": team.lead_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
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
        # User sees teams where they are lead or a team member
        member_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        team_ids = [t[0] for t in member_team_ids]
        
        # Also include teams where lead_id == user.id
        lead_team_ids = db.query(Team.id).filter(Team.lead_id == current_user.id).all()
        team_ids.extend([t[0] for t in lead_team_ids])
        
        team_ids = list(set(team_ids))
        teams = db.query(Team).filter(Team.id.in_(team_ids)).all()

    return [format_team_response(t, db) for t in teams]

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(require_admin), # Only Admin can create teams
    db: Session = Depends(get_db)
):
    # Verify lead_id if provided
    if team_in.lead_id:
        lead_user = db.query(User).filter(User.id == team_in.lead_id).first()
        if not lead_user:
            raise HTTPException(status_code=400, detail="Lead user not found")

    team = Team(
        name=team_in.name,
        description=team_in.description,
        lead_id=team_in.lead_id
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Add initial members including lead if specified
    all_member_ids = set(team_in.member_ids or [])
    if team_in.lead_id:
        all_member_ids.add(team_in.lead_id)

    for uid in all_member_ids:
        u = db.query(User).filter(User.id == uid).first()
        if u:
            tm = TeamMember(team_id=team.id, user_id=uid)
            db.add(tm)

    db.commit()
    db.refresh(team)
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

    # Only Admin or current Team Lead can update team details
    if not is_user_team_lead(current_user, team_id, db):
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can edit team details")

    if team_in.name is not None:
        team.name = team_in.name
    if team_in.description is not None:
        team.description = team_in.description

    # Changing Team Lead is restricted to Admin
    if team_in.lead_id is not None and team_in.lead_id != team.lead_id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only Admin can reassign Team Lead")
        new_lead = db.query(User).filter(User.id == team_in.lead_id).first()
        if not new_lead:
            raise HTTPException(status_code=400, detail="New lead user not found")
        team.lead_id = team_in.lead_id

        # Ensure new lead is a member of the team
        existing_tm = db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == team_in.lead_id
        ).first()
        if not existing_tm:
            db.add(TeamMember(team_id=team_id, user_id=team_in.lead_id))

    db.commit()
    db.refresh(team)
    return format_team_response(team, db)

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    current_user: User = Depends(require_admin), # Only Admin can delete teams
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
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
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can add team members")

    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User to add not found")

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_in.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    tm = TeamMember(team_id=team_id, user_id=member_in.user_id)
    db.add(tm)
    db.commit()
    db.refresh(team)
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
        raise HTTPException(status_code=403, detail="Only Admin or Team Lead can remove team members")

    if team.lead_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the active Team Lead. Reassign lead first.")

    tm = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Member not found in team")

    db.delete(tm)
    db.commit()
    db.refresh(team)
    return format_team_response(team, db)
