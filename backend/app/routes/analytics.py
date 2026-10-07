from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    MemberWorkloadListResponse,
    TeamWorkloadResponse,
    ProjectWorkloadResponse,
    TrendsResponse
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    team_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    member_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return analytics_service.get_analytics_summary(
        db=db,
        current_user=current_user,
        team_id=team_id,
        project_id=project_id,
        member_id=member_id
    )

@router.get("/workload", response_model=MemberWorkloadListResponse)
def get_member_workload(
    team_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    member_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    members = analytics_service.get_member_workload_analytics(
        db=db,
        current_user=current_user,
        team_id=team_id,
        project_id=project_id,
        member_id=member_id
    )
    return MemberWorkloadListResponse(members=members)

@router.get("/teams", response_model=List[TeamWorkloadResponse])
def get_team_workload(
    team_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filters = {}
    if team_id:
        filters["team_id"] = team_id
    return analytics_service.get_team_workload_analytics(
        db=db,
        current_user=current_user,
        filters=filters
    )

@router.get("/projects", response_model=List[ProjectWorkloadResponse])
def get_project_workload(
    team_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filters = {}
    if team_id:
        filters["team_id"] = team_id
    if project_id:
        filters["project_id"] = project_id
    return analytics_service.get_project_workload_analytics(
        db=db,
        current_user=current_user,
        filters=filters
    )

@router.get("/trends", response_model=TrendsResponse)
def get_analytics_trends(
    period: str = Query("30d"),
    team_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return analytics_service.get_analytics_trends(
        db=db,
        current_user=current_user,
        period=period,
        team_id=team_id,
        project_id=project_id
    )
