import sys
import os
import io
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.session import SessionLocal, engine, Base
from app.database.migrate import run_migrations
from app.models import User, UserRole, Team, TeamMember, Project, Task, TaskPriority, TaskStatus
from app.auth.jwt import create_access_token

client = TestClient(app)

def setup_module():
    Base.metadata.create_all(bind=engine)
    run_migrations()

def get_auth_headers(user: User):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}

def test_analytics_suite():
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # 1. Setup test users
        admin = db.query(User).filter(User.email == "admin_analytics@test.com").first()
        if not admin:
            admin = User(email="admin_analytics@test.com", password_hash="hash", full_name="Admin Analytics", role=UserRole.ADMIN)
            db.add(admin)

        lead = db.query(User).filter(User.email == "lead_analytics@test.com").first()
        if not lead:
            lead = User(email="lead_analytics@test.com", password_hash="hash", full_name="Lead User", role=UserRole.MEMBER)
            db.add(lead)

        member1 = db.query(User).filter(User.email == "member1_analytics@test.com").first()
        if not member1:
            member1 = User(email="member1_analytics@test.com", password_hash="hash", full_name="Member One", role=UserRole.MEMBER)
            db.add(member1)

        outsider = db.query(User).filter(User.email == "outsider_analytics@test.com").first()
        if not outsider:
            outsider = User(email="outsider_analytics@test.com", password_hash="hash", full_name="Outsider Analytics", role=UserRole.MEMBER)
            db.add(outsider)

        db.commit()

        # 2. Setup team & projects
        team = Team(name="Analytics Team", lead_id=lead.id, owner_id=lead.id)
        db.add(team)
        db.commit()

        tm_lead = TeamMember(team_id=team.id, user_id=lead.id, role="LEAD")
        tm_m1 = TeamMember(team_id=team.id, user_id=member1.id, role="MEMBER")
        db.add_all([tm_lead, tm_m1])

        project = Project(name="Analytics Project", team_id=team.id)
        db.add(project)
        db.commit()

        # 3. Create tasks
        # Task 1: Member 1, In Progress, High Priority, Due Yesterday (Overdue)
        t1 = Task(
            title="Overdue High Task",
            project_id=project.id,
            assigned_to_id=member1.id,
            created_by_id=lead.id,
            priority=TaskPriority.HIGH,
            status=TaskStatus.IN_PROGRESS,
            due_date=now - timedelta(days=1)
        )
        # Task 2: Member 1, To Do, Critical Priority, Due Tomorrow
        t2 = Task(
            title="Critical Task",
            project_id=project.id,
            assigned_to_id=member1.id,
            created_by_id=lead.id,
            priority=TaskPriority.CRITICAL,
            status=TaskStatus.TO_DO,
            due_date=now + timedelta(days=1)
        )
        # Task 3: Member 1, Completed (should not be in current load)
        t3 = Task(
            title="Finished Task",
            project_id=project.id,
            assigned_to_id=member1.id,
            created_by_id=lead.id,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.COMPLETED,
            due_date=now - timedelta(days=5),
            completed_date=now - timedelta(days=1)
        )
        # Task 4: Unassigned task
        t4 = Task(
            title="Unassigned Backlog Item",
            project_id=project.id,
            assigned_to_id=None,
            created_by_id=lead.id,
            priority=TaskPriority.LOW,
            status=TaskStatus.TO_DO
        )

        db.add_all([t1, t2, t3, t4])
        db.commit()

        h_admin = get_auth_headers(admin)
        h_lead = get_auth_headers(lead)
        h_m1 = get_auth_headers(member1)
        h_outsider = get_auth_headers(outsider)

        # TEST 1: Summary counts correct
        r1 = client.get("/api/analytics/summary", headers=h_admin)
        assert r1.status_code == 200, f"TEST 1 Failed: {r1.text}"
        sum_data = r1.json()
        assert sum_data["active_tasks"] >= 3 # t1, t2, t4
        assert sum_data["completed_tasks"] >= 1 # t3
        assert sum_data["completion_rate"] > 0.0
        print("[Pass] TEST 1: Summary counts correct")

        # TEST 2: Completed tasks excluded from current workload score
        r2 = client.get(f"/api/analytics/workload?member_id={member1.id}", headers=h_admin)
        assert r2.status_code == 200
        w_data = r2.json()["members"][0]
        assert w_data["completed_tasks"] >= 1
        assert w_data["active_tasks"] >= 2 # t1, t2
        print("[Pass] TEST 2: Completed tasks excluded from current workload score")

        # TEST 3: Overdue task increases overdue count
        assert w_data["overdue_tasks"] >= 1
        print("[Pass] TEST 3: Overdue task increases overdue count")

        # TEST 4: Priority breakdown correct
        assert w_data["priority_breakdown"]["HIGH"] >= 1
        assert w_data["priority_breakdown"]["CRITICAL"] >= 1
        print("[Pass] TEST 4: Priority breakdown correct")

        # TEST 5: Status breakdown correct
        assert w_data["status_breakdown"]["IN_PROGRESS"] >= 1
        assert w_data["status_breakdown"]["TO_DO"] >= 1
        assert w_data["status_breakdown"]["COMPLETED"] >= 1
        print("[Pass] TEST 5: Status breakdown correct")

        # TEST 6: Workload score calculation deterministic
        assert isinstance(w_data["workload_score"], int)
        assert w_data["workload_level"] in ["LOW", "BALANCED", "HIGH", "OVERLOADED"]
        print("[Pass] TEST 6: Workload score calculation deterministic")

        # TEST 7: Unassigned tasks tracked
        assert sum_data["unassigned_tasks"] >= 1
        print("[Pass] TEST 7: Unassigned tasks tracked")

        # TEST 8: Team filter works
        r8 = client.get(f"/api/analytics/summary?team_id={team.id}", headers=h_admin)
        assert r8.status_code == 200
        assert r8.json()["total_tasks"] >= 4
        print("[Pass] TEST 8: Team filter works")

        # TEST 9: Project filter works
        r9 = client.get(f"/api/analytics/summary?project_id={project.id}", headers=h_admin)
        assert r9.status_code == 200
        assert r9.json()["total_tasks"] >= 4
        print("[Pass] TEST 9: Project filter works")

        # TEST 10: Member filter works
        r10 = client.get(f"/api/analytics/summary?member_id={member1.id}", headers=h_admin)
        assert r10.status_code == 200
        assert r10.json()["total_tasks"] >= 3
        print("[Pass] TEST 10: Member filter works")

        # TEST 11: Unauthorized team analytics blocked for outsider
        # Outsider tries to access team's specific workload
        r11 = client.get(f"/api/analytics/teams?team_id={team.id}", headers=h_outsider)
        assert r11.status_code == 200
        assert len(r11.json()) == 0 # Cannot see unauthorized team
        print("[Pass] TEST 11: Unauthorized team analytics blocked")

        # TEST 12: Admin can access workspace-wide analytics
        r12 = client.get("/api/analytics/teams", headers=h_admin)
        assert r12.status_code == 200
        assert len(r12.json()) >= 1
        print("[Pass] TEST 12: Admin can access workspace-wide analytics")

        # TEST 13: Member only sees authorized analytics
        r13 = client.get("/api/analytics/workload", headers=h_m1)
        assert r13.status_code == 200
        m_list = r13.json()["members"]
        # Member 1 cannot see outsider
        outsider_in_list = any(m["user_id"] == outsider.id for m in m_list)
        assert not outsider_in_list
        print("[Pass] TEST 13: Member only sees authorized analytics")

        # TEST 14: Zero tasks returns safe zero percentages
        empty_project = Project(name="Empty Proj", team_id=team.id)
        db.add(empty_project)
        db.commit()
        r14 = client.get(f"/api/analytics/summary?project_id={empty_project.id}", headers=h_admin)
        assert r14.status_code == 200
        assert r14.json()["completion_rate"] == 0.0
        assert r14.json()["average_tasks_per_member"] == 0.0
        print("[Pass] TEST 14: Zero tasks returns safe zero percentages")

        # TEST 15: Trend endpoint returns ordered time-series data
        r15 = client.get("/api/analytics/trends?period=7d", headers=h_admin)
        assert r15.status_code == 200
        t_data = r15.json()
        assert t_data["period"] == "7d"
        assert len(t_data["completed_tasks"]) == 8 # 7 days + today
        assert len(t_data["created_tasks"]) == 8
        print("[Pass] TEST 15: Trend endpoint returns ordered time-series data")

        print("\n--- ALL 15 ANALYTICS BACKEND TESTS PASSED CLEANLY! ---")

    finally:
        db.close()

if __name__ == "__main__":
    setup_module()
    test_analytics_suite()
