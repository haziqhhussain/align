from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.subtask import Subtask
from app.dependencies.auth import is_user_team_member

def get_accessible_team_ids(current_user: User, db: Session) -> List[int]:
    if current_user.role == UserRole.ADMIN:
        return [t.id for t in db.query(Team.id).all()]

    team_ids = set()
    # Teams led or owned
    led = db.query(Team.id).filter(or_(Team.lead_id == current_user.id, Team.owner_id == current_user.id)).all()
    for t in led:
        team_ids.add(t.id)

    # Teams member of
    m = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    for row in m:
        team_ids.add(row.team_id)

    return list(team_ids)

def calculate_task_workload_points(task: Task, now: datetime) -> float:
    """
    Deterministic weighted workload score per task.
    Completed tasks = 0 points.
    """
    # 1. Status Weight
    status_str = task.status.value if hasattr(task.status, "value") else str(task.status)
    if status_str in ["Completed", "COMPLETED"]:
        return 0.0

    status_weights = {
        "To Do": 1.0,
        "TO_DO": 1.0,
        "In Progress": 2.0,
        "IN_PROGRESS": 2.0,
        "Review": 1.5,
        "IN_REVIEW": 1.5,
    }
    s_weight = status_weights.get(status_str, 1.0)

    # 2. Priority Multiplier
    priority_str = task.priority.value if hasattr(task.priority, "value") else str(task.priority)
    priority_multipliers = {
        "Low": 0.75,
        "LOW": 0.75,
        "Medium": 1.0,
        "MEDIUM": 1.0,
        "High": 1.5,
        "HIGH": 1.5,
        "Critical": 2.0,
        "CRITICAL": 2.0,
        "URGENT": 2.0
    }
    p_mult = priority_multipliers.get(priority_str, 1.0)

    # 3. Deadline Multiplier
    d_mult = 1.0
    if task.due_date:
        diff_days = (task.due_date.date() - now.date()).days
        if diff_days < 0:
            d_mult = 1.5 # Overdue
        elif diff_days <= 3:
            d_mult = 1.25 # Due within 3 days

    return s_weight * p_mult * d_mult

def get_workload_level(score: int) -> str:
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "BALANCED"
    elif score <= 80:
        return "HIGH"
    else:
        return "OVERLOADED"

def get_authorized_tasks_query(
    db: Session,
    current_user: User,
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    member_id: Optional[int] = None
):
    accessible_teams = get_accessible_team_ids(current_user, db)

    query = db.query(Task).join(Project, Task.project_id == Project.id)

    # Permission check
    if current_user.role != UserRole.ADMIN:
        query = query.filter(
            or_(
                Project.team_id.in_(accessible_teams),
                Task.assigned_to_id == current_user.id
            )
        )

    # Apply filters
    if team_id:
        query = query.filter(Project.team_id == team_id)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if member_id:
        query = query.filter(Task.assigned_to_id == member_id)

    return query

def get_analytics_summary(
    db: Session,
    current_user: User,
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    member_id: Optional[int] = None
) -> Dict[str, Any]:
    now = datetime.utcnow()
    today_date = now.date()
    week_end_date = today_date + timedelta(days=7)

    tasks_query = get_authorized_tasks_query(db, current_user, team_id, project_id, member_id)
    tasks = tasks_query.all()

    # Track member count
    accessible_teams = get_accessible_team_ids(current_user, db)
    if current_user.role == UserRole.ADMIN:
        total_members = db.query(User).filter(User.is_active == True).count()
    else:
        # Unique members across accessible teams
        member_ids = db.query(TeamMember.user_id).filter(TeamMember.team_id.in_(accessible_teams)).distinct().all()
        total_members = max(1, len(member_ids))

    total_tasks = len(tasks)
    active_tasks = 0
    completed_tasks = 0
    overdue_tasks = 0
    due_this_week = 0
    high_priority_tasks = 0
    unassigned_tasks = 0

    for t in tasks:
        s_str = t.status.value if hasattr(t.status, "value") else str(t.status)
        p_str = t.priority.value if hasattr(t.priority, "value") else str(t.priority)

        if not t.assigned_to_id and s_str not in ["Completed", "COMPLETED"]:
            unassigned_tasks += 1

        if s_str in ["Completed", "COMPLETED"]:
            completed_tasks += 1
        else:
            active_tasks += 1

            if p_str in ["High", "HIGH", "Critical", "CRITICAL"]:
                high_priority_tasks += 1

            if t.due_date:
                due_d = t.due_date.date()
                if due_d < today_date:
                    overdue_tasks += 1
                if today_date <= due_d <= week_end_date:
                    due_this_week += 1

    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
    avg_tasks_per_member = round((active_tasks / max(1, total_members)), 1)

    return {
        "total_members": total_members,
        "total_tasks": total_tasks,
        "active_tasks": active_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "due_this_week": due_this_week,
        "high_priority_tasks": high_priority_tasks,
        "unassigned_tasks": unassigned_tasks,
        "completion_rate": completion_rate,
        "average_tasks_per_member": avg_tasks_per_member
    }

def get_member_workload_analytics(
    db: Session,
    current_user: User,
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    member_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    now = datetime.utcnow()
    today_date = now.date()
    week_end = today_date + timedelta(days=7)

    # 1. Determine list of users to include based on permissions & scope
    accessible_teams = get_accessible_team_ids(current_user, db)

    user_query = db.query(User).filter(User.is_active == True)
    if current_user.role != UserRole.ADMIN:
        if member_id and member_id == current_user.id:
            user_query = user_query.filter(User.id == current_user.id)
        else:
            team_user_ids = [r[0] for r in db.query(TeamMember.user_id).filter(TeamMember.team_id.in_(accessible_teams)).all()]
            user_query = user_query.filter(or_(User.id.in_(team_user_ids), User.id == current_user.id))
    elif member_id:
        user_query = user_query.filter(User.id == member_id)

    users = user_query.order_by(User.full_name.asc()).all()

    # 2. Fetch all authorized tasks in scope
    tasks_query = get_authorized_tasks_query(db, current_user, team_id, project_id, None)
    tasks = tasks_query.all()

    # Map tasks by assigned_to_id
    tasks_by_user: Dict[int, List[Task]] = {}
    for t in tasks:
        if t.assigned_to_id:
            tasks_by_user.setdefault(t.assigned_to_id, []).append(t)

    # Fetch incomplete assigned subtasks
    incomplete_subtasks = db.query(Subtask).filter(
        Subtask.is_completed == False,
        Subtask.assigned_to_id != None
    ).all()
    subtask_count_by_user: Dict[int, int] = {}
    for st in incomplete_subtasks:
        if st.assigned_to_id:
            subtask_count_by_user[st.assigned_to_id] = subtask_count_by_user.get(st.assigned_to_id, 0) + 1

    member_workloads = []

    for u in users:
        u_tasks = tasks_by_user.get(u.id, [])
        total_assigned = len(u_tasks)
        active_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0
        due_this_week = 0

        p_breakdown = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        s_breakdown = {"TO_DO": 0, "IN_PROGRESS": 0, "REVIEW": 0, "COMPLETED": 0}

        raw_load_points = 0.0

        for t in u_tasks:
            s_str = t.status.value if hasattr(t.status, "value") else str(t.status)
            p_str = t.priority.value if hasattr(t.priority, "value") else str(t.priority)

            # Status count
            if s_str in ["To Do", "TO_DO"]:
                s_breakdown["TO_DO"] += 1
            elif s_str in ["In Progress", "IN_PROGRESS"]:
                s_breakdown["IN_PROGRESS"] += 1
            elif s_str in ["Review", "IN_REVIEW"]:
                s_breakdown["REVIEW"] += 1
            elif s_str in ["Completed", "COMPLETED"]:
                s_breakdown["COMPLETED"] += 1

            # Priority count
            if p_str in ["Low", "LOW"]:
                p_breakdown["LOW"] += 1
            elif p_str in ["Medium", "MEDIUM"]:
                p_breakdown["MEDIUM"] += 1
            elif p_str in ["High", "HIGH"]:
                p_breakdown["HIGH"] += 1
            elif p_str in ["Critical", "CRITICAL", "Urgent", "URGENT"]:
                p_breakdown["CRITICAL"] += 1

            if s_str in ["Completed", "COMPLETED"]:
                completed_tasks += 1
            else:
                active_tasks += 1
                if t.due_date:
                    d_date = t.due_date.date()
                    if d_date < today_date:
                        overdue_tasks += 1
                    if today_date <= d_date <= week_end:
                        due_this_week += 1

                raw_load_points += calculate_task_workload_points(t, now)

        # Incomplete subtask factor (0.25 task load points per subtask)
        subtask_count = subtask_count_by_user.get(u.id, 0)
        raw_load_points += (subtask_count * 0.25)

        # Workload score (normalized 0 to 100 based on 15 raw load points threshold)
        normalized_score = min(100, int(round((raw_load_points / 15.0) * 100)))
        level = get_workload_level(normalized_score)

        member_workloads.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "avatar_url": u.avatar_url,
            "total_assigned": total_assigned,
            "active_tasks": active_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "due_this_week": due_this_week,
            "subtask_count": subtask_count,
            "priority_breakdown": p_breakdown,
            "status_breakdown": s_breakdown,
            "workload_score": normalized_score,
            "workload_level": level
        })

    # Sort members by workload_score descending
    member_workloads.sort(key=lambda x: x["workload_score"], reverse=True)
    return member_workloads

def get_team_workload_analytics(
    db: Session,
    current_user: User,
    filters: Dict[str, Any]
) -> List[Dict[str, Any]]:
    accessible_team_ids = get_accessible_team_ids(current_user, db)
    if filters.get("team_id"):
        accessible_team_ids = [t for t in accessible_team_ids if t == filters["team_id"]]

    teams = db.query(Team).filter(Team.id.in_(accessible_team_ids)).all()
    now = datetime.utcnow()
    today_date = now.date()

    team_summaries = []
    for t in teams:
        members_count = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()

        tasks = db.query(Task).join(Project, Task.project_id == Project.id).filter(Project.team_id == t.id).all()
        total_tasks = len(tasks)
        active_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0

        for task in tasks:
            s_str = task.status.value if hasattr(task.status, "value") else str(task.status)
            if s_str in ["Completed", "COMPLETED"]:
                completed_tasks += 1
            else:
                active_tasks += 1
                if task.due_date and task.due_date.date() < today_date:
                    overdue_tasks += 1

        completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        # Calculate average member workload score for this team
        member_workloads = get_member_workload_analytics(db, current_user, team_id=t.id)
        avg_score = int(round(sum(m["workload_score"] for m in member_workloads) / max(1, len(member_workloads)))) if member_workloads else 0

        team_summaries.append({
            "team_id": t.id,
            "team_name": t.name,
            "member_count": members_count,
            "active_tasks": active_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": completion_rate,
            "average_workload_score": avg_score
        })

    return team_summaries

def get_project_workload_analytics(
    db: Session,
    current_user: User,
    filters: Dict[str, Any]
) -> List[Dict[str, Any]]:
    accessible_team_ids = get_accessible_team_ids(current_user, db)
    proj_query = db.query(Project).filter(Project.team_id.in_(accessible_team_ids))
    if filters.get("project_id"):
        proj_query = proj_query.filter(Project.id == filters["project_id"])
    if filters.get("team_id"):
        proj_query = proj_query.filter(Project.team_id == filters["team_id"])

    projects = proj_query.all()
    now = datetime.utcnow()
    today_date = now.date()

    project_summaries = []
    for p in projects:
        tasks = db.query(Task).filter(Task.project_id == p.id).all()
        total_tasks = len(tasks)
        active_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0
        due_soon_count = 0

        for t in tasks:
            s_str = t.status.value if hasattr(t.status, "value") else str(t.status)
            if s_str in ["Completed", "COMPLETED"]:
                completed_tasks += 1
            else:
                active_tasks += 1
                if t.due_date:
                    d_d = t.due_date.date()
                    if d_d < today_date:
                        overdue_tasks += 1
                    elif 0 <= (d_d - today_date).days <= 3:
                        due_soon_count += 1

        completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        project_summaries.append({
            "project_id": p.id,
            "project_name": p.name,
            "team_id": p.team_id,
            "team_name": p.team.name if p.team else "",
            "task_count": total_tasks,
            "active_tasks": active_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "due_soon_count": due_soon_count,
            "completion_rate": completion_rate
        })

    return project_summaries

def get_analytics_trends(
    db: Session,
    current_user: User,
    period: str = "30d",
    team_id: Optional[int] = None,
    project_id: Optional[int] = None
) -> Dict[str, Any]:
    days = 30
    if period == "7d":
        days = 7
    elif period == "90d":
        days = 90

    now = datetime.utcnow()
    start_date = (now - timedelta(days=days)).date()

    tasks_query = get_authorized_tasks_query(db, current_user, team_id, project_id, None)
    tasks = tasks_query.all()

    completed_by_date: Dict[str, int] = {}
    created_by_date: Dict[str, int] = {}

    # Initialize all dates in range with 0
    for i in range(days + 1):
        d_str = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        completed_by_date[d_str] = 0
        created_by_date[d_str] = 0

    for t in tasks:
        # Created date
        if t.created_at:
            c_date_str = t.created_at.date().strftime("%Y-%m-%d")
            if c_date_str in created_by_date:
                created_by_date[c_date_str] += 1

        # Completed date
        s_str = t.status.value if hasattr(t.status, "value") else str(t.status)
        if s_str in ["Completed", "COMPLETED"]:
            comp_dt = t.completed_date or t.updated_at or t.created_at
            if comp_dt:
                comp_date_str = comp_dt.date().strftime("%Y-%m-%d")
                if comp_date_str in completed_by_date:
                    completed_by_date[comp_date_str] += 1

    completed_points = [{"date": d, "count": completed_by_date[d]} for d in sorted(completed_by_date.keys())]
    created_points = [{"date": d, "count": created_by_date[d]} for d in sorted(created_by_date.keys())]

    return {
        "period": period,
        "completed_tasks": completed_points,
        "created_tasks": created_points
    }
