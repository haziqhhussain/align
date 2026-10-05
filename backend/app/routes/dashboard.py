from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus, TaskPriority
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Determine user role status
    is_admin = (current_user.role == UserRole.ADMIN)

    # Check teams managed as lead
    managed_teams = db.query(Team).filter(Team.lead_id == current_user.id).all()
    managed_team_ids = [t.id for t in managed_teams]
    is_team_lead = len(managed_team_ids) > 0 or is_admin

    # Member team memberships
    member_team_entries = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    user_team_ids = list(set([t[0] for t in member_team_entries] + managed_team_ids))

    # --- ADMIN STATS ---
    if is_admin:
        total_teams = db.query(Team).count()
        total_users = db.query(User).count()
        total_projects = db.query(Project).count()
        all_tasks = db.query(Task).all()

        total_tasks = len(all_tasks)
        completed_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED)
        pending_tasks = total_tasks - completed_tasks
        overdue_tasks = sum(1 for t in all_tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)

        recent_projects_query = db.query(Project).order_by(Project.created_at.desc()).limit(5).all()
        recent_projects = []
        for p in recent_projects_query:
            p_tasks = db.query(Task).filter(Task.project_id == p.id).all()
            p_total = len(p_tasks)
            p_completed = sum(1 for t in p_tasks if t.status == TaskStatus.COMPLETED)
            pct = (p_completed / p_total * 100.0) if p_total > 0 else 0.0
            recent_projects.append({
                "id": p.id,
                "name": p.name,
                "team_name": p.team.name if p.team else "Unassigned",
                "status": p.status,
                "progress_percentage": round(pct, 1),
                "due_date": p.due_date
            })

        team_progress = []
        all_teams = db.query(Team).all()
        for t in all_teams:
            p_ids = [pr.id for pr in t.projects]
            t_tasks = db.query(Task).filter(Task.project_id.in_(p_ids)).all() if p_ids else []
            t_total = len(t_tasks)
            t_completed = sum(1 for tk in t_tasks if tk.status == TaskStatus.COMPLETED)
            t_pct = (t_completed / t_total * 100.0) if t_total > 0 else 0.0
            m_count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
            team_progress.append({
                "id": t.id,
                "name": t.name,
                "lead_name": t.lead.full_name if t.lead else "No Lead",
                "member_count": m_count,
                "project_count": len(t.projects),
                "task_count": t_total,
                "completed_count": t_completed,
                "progress_percentage": round(t_pct, 1)
            })

        return {
            "view_type": "ADMIN",
            "metrics": {
                "total_teams": total_teams,
                "total_users": total_users,
                "total_projects": total_projects,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks,
                "overdue_tasks": overdue_tasks
            },
            "recent_projects": recent_projects,
            "team_progress": team_progress
        }

    # --- TEAM LEAD STATS (for leads of 1+ teams) ---
    if len(managed_team_ids) > 0:
        managed_projects = db.query(Project).filter(Project.team_id.in_(managed_team_ids)).all()
        managed_project_ids = [p.id for p in managed_projects]

        # Member list in managed teams
        team_member_uids = db.query(TeamMember.user_id).filter(TeamMember.team_id.in_(managed_team_ids)).all()
        unique_member_uids = list(set([u[0] for u in team_member_uids]))

        lead_tasks = db.query(Task).filter(Task.project_id.in_(managed_project_ids)).all() if managed_project_ids else []
        total_tasks = len(lead_tasks)
        completed_tasks = sum(1 for t in lead_tasks if t.status == TaskStatus.COMPLETED)
        pending_tasks = total_tasks - completed_tasks
        overdue_tasks = sum(1 for t in lead_tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)

        # Member-wise progress
        member_progress = []
        members = db.query(User).filter(User.id.in_(unique_member_uids)).all()
        for m in members:
            m_tasks = [t for t in lead_tasks if t.assigned_to_id == m.id]
            m_total = len(m_tasks)
            m_completed = sum(1 for t in m_tasks if t.status == TaskStatus.COMPLETED)
            m_pct = (m_completed / m_total * 100.0) if m_total > 0 else 0.0
            member_progress.append({
                "id": m.id,
                "full_name": m.full_name,
                "email": m.email,
                "avatar_url": m.avatar_url,
                "total_tasks": m_total,
                "completed_tasks": m_completed,
                "progress_percentage": round(m_pct, 1)
            })

        # Recent activity (latest tasks)
        recent_activity = []
        for t in sorted(lead_tasks, key=lambda x: x.updated_at, reverse=True)[:6]:
            recent_activity.append({
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "assigned_to": t.assigned_to.full_name if t.assigned_to else "Unassigned",
                "updated_at": t.updated_at
            })

        return {
            "view_type": "LEAD",
            "metrics": {
                "teams_managed": len(managed_teams),
                "assigned_projects": len(managed_projects),
                "team_members": len(unique_member_uids),
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks,
                "overdue_tasks": overdue_tasks
            },
            "member_progress": member_progress,
            "recent_activity": recent_activity
        }

    # --- MEMBER STATS ---
    my_tasks = db.query(Task).filter(Task.assigned_to_id == current_user.id).all()
    todo_count = sum(1 for t in my_tasks if t.status == TaskStatus.TO_DO)
    in_progress_count = sum(1 for t in my_tasks if t.status == TaskStatus.IN_PROGRESS)
    review_count = sum(1 for t in my_tasks if t.status == TaskStatus.REVIEW)
    completed_count = sum(1 for t in my_tasks if t.status == TaskStatus.COMPLETED)
    overdue_count = sum(1 for t in my_tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)

    # My Projects
    my_projects_query = db.query(Project).filter(Project.team_id.in_(user_team_ids)).all() if user_team_ids else []
    my_projects = []
    for p in my_projects_query:
        p_tasks = db.query(Task).filter(Task.project_id == p.id).all()
        p_total = len(p_tasks)
        p_comp = sum(1 for t in p_tasks if t.status == TaskStatus.COMPLETED)
        pct = (p_comp / p_total * 100.0) if p_total > 0 else 0.0
        my_projects.append({
            "id": p.id,
            "name": p.name,
            "status": p.status,
            "progress_percentage": round(pct, 1),
            "due_date": p.due_date
        })

    # Upcoming deadlines (sorted by due date)
    upcoming_tasks = [t for t in my_tasks if t.due_date and t.status != TaskStatus.COMPLETED]
    upcoming_deadlines = []
    for t in sorted(upcoming_tasks, key=lambda x: x.due_date)[:5]:
        is_overdue = t.due_date < now
        upcoming_deadlines.append({
            "id": t.id,
            "title": t.title,
            "project_name": t.project.name if t.project else "",
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date,
            "is_overdue": is_overdue
        })

    return {
        "view_type": "MEMBER",
        "metrics": {
            "my_teams_count": len(user_team_ids),
            "my_projects_count": len(my_projects),
            "my_assigned_tasks": len(my_tasks),
            "todo_tasks": todo_count,
            "in_progress_tasks": in_progress_count,
            "review_tasks": review_count,
            "completed_tasks": completed_count,
            "overdue_tasks": overdue_count
        },
        "my_projects": my_projects,
        "upcoming_deadlines": upcoming_deadlines
    }
