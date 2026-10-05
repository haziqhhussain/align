from datetime import datetime, timedelta
from app.database.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.comment import TaskComment
from app.models.notification import Notification
from app.auth.password import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if DB is already seeded
        if db.query(User).first():
            print("Database already seeded. Skipping initial seed.")
            return

        print("Seeding database...")

        # 1. Create Users
        admin = User(
            email="admin@align.com",
            full_name="Alex Morgan (Admin)",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
        )
        lead1 = User(
            email="lead.frontend@align.com",
            full_name="Sarah Jenkins (Frontend Lead)",
            password_hash=get_password_hash("lead123"),
            role=UserRole.MEMBER,
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80"
        )
        lead2 = User(
            email="lead.backend@align.com",
            full_name="David Chen (Backend Lead)",
            password_hash=get_password_hash("lead123"),
            role=UserRole.MEMBER,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
        )
        member1 = User(
            email="dev.emily@align.com",
            full_name="Emily Vance (UI/UX Dev)",
            password_hash=get_password_hash("member123"),
            role=UserRole.MEMBER,
            avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80"
        )
        member2 = User(
            email="dev.marcus@align.com",
            full_name="Marcus Brody (Full-stack Dev)",
            password_hash=get_password_hash("member123"),
            role=UserRole.MEMBER,
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
        )
        member3 = User(
            email="dev.priya@align.com",
            full_name="Priya Sharma (Backend Engineer)",
            password_hash=get_password_hash("member123"),
            role=UserRole.MEMBER,
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
        )

        db.add_all([admin, lead1, lead2, member1, member2, member3])
        db.commit()

        # Refresh users to get IDs
        db.refresh(admin)
        db.refresh(lead1)
        db.refresh(lead2)
        db.refresh(member1)
        db.refresh(member2)
        db.refresh(member3)

        # 2. Create Teams
        team1 = Team(
            name="Frontend Engineering",
            description="Responsible for building modern responsive web apps, components, and design system.",
            lead_id=lead1.id
        )
        team2 = Team(
            name="Backend & Infrastructure",
            description="Responsible for scalable microservices, FastAPI endpoints, and cloud database optimizations.",
            lead_id=lead2.id
        )
        db.add_all([team1, team2])
        db.commit()

        db.refresh(team1)
        db.refresh(team2)

        # 3. Add Team Members
        memberships = [
            # Team 1 members
            TeamMember(team_id=team1.id, user_id=lead1.id),
            TeamMember(team_id=team1.id, user_id=member1.id),
            TeamMember(team_id=team1.id, user_id=member2.id),
            # Team 2 members
            TeamMember(team_id=team2.id, user_id=lead2.id),
            TeamMember(team_id=team2.id, user_id=member2.id), # Member 2 belongs to both teams!
            TeamMember(team_id=team2.id, user_id=member3.id),
        ]
        db.add_all(memberships)
        db.commit()

        # 4. Create Projects
        now = datetime.utcnow()
        proj1 = Project(
            name="Align Web Application UI",
            description="Design and develop React TypeScript dashboard with Tailwind CSS styling.",
            team_id=team1.id,
            status=ProjectStatus.ACTIVE,
            start_date=now - timedelta(days=14),
            due_date=now + timedelta(days=14)
        )
        proj2 = Project(
            name="Mobile Responsiveness & Theme Switcher",
            description="Ensure flawless tablet & mobile views with smooth theme transitions.",
            team_id=team1.id,
            status=ProjectStatus.ACTIVE,
            start_date=now - timedelta(days=5),
            due_date=now + timedelta(days=20)
        )
        proj3 = Project(
            name="FastAPI & JWT Auth Engine",
            description="Implement high-performance REST APIs, role-based authorization, and token handling.",
            team_id=team2.id,
            status=ProjectStatus.ACTIVE,
            start_date=now - timedelta(days=20),
            due_date=now + timedelta(days=5)
        )
        proj4 = Project(
            name="Docker Setup & Deployment",
            description="Containerize services using Docker Compose, volume mounts, and PostgreSQL integration.",
            team_id=team2.id,
            status=ProjectStatus.ACTIVE,
            start_date=now - timedelta(days=3),
            due_date=now + timedelta(days=10)
        )

        db.add_all([proj1, proj2, proj3, proj4])
        db.commit()

        db.refresh(proj1)
        db.refresh(proj2)
        db.refresh(proj3)
        db.refresh(proj4)

        # 5. Create Tasks
        t1 = Task(
            title="Design System & Palette Configuration",
            description="Setup Tailwind CSS color tokens, glassmorphism cards, and Google typography.",
            project_id=proj1.id,
            assigned_to_id=member1.id,
            created_by_id=lead1.id,
            priority=TaskPriority.HIGH,
            status=TaskStatus.COMPLETED,
            start_date=now - timedelta(days=12),
            due_date=now - timedelta(days=5),
            completed_date=now - timedelta(days=6)
        )
        t2 = Task(
            title="Build Dashboard Layout & Sidebar",
            description="Create reusable layout with top navbar, collapsible sidebar, and responsive mobile drawer.",
            project_id=proj1.id,
            assigned_to_id=member2.id,
            created_by_id=lead1.id,
            priority=TaskPriority.CRITICAL,
            status=TaskStatus.IN_PROGRESS,
            start_date=now - timedelta(days=6),
            due_date=now + timedelta(days=2)
        )
        t3 = Task(
            title="Implement Task Modal & Comment Section",
            description="Allow team leads and members to comment on tasks and view discussion histories.",
            project_id=proj1.id,
            assigned_to_id=member1.id,
            created_by_id=lead1.id,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.TO_DO,
            start_date=now,
            due_date=now + timedelta(days=7)
        )
        t4 = Task(
            title="User Profile & Role Settings View",
            description="Create dedicated user profile screen showing role badge and team memberships.",
            project_id=proj1.id,
            assigned_to_id=lead1.id,
            created_by_id=admin.id,
            priority=TaskPriority.LOW,
            status=TaskStatus.REVIEW,
            start_date=now - timedelta(days=3),
            due_date=now + timedelta(days=4)
        )

        # Overdue Task (Due 3 days ago, still in progress)
        t5 = Task(
            title="Database Migration Script & Seed Verification",
            description="Write database seed script with default Admin, Teams, Projects, and Tasks.",
            project_id=proj3.id,
            assigned_to_id=member3.id,
            created_by_id=lead2.id,
            priority=TaskPriority.CRITICAL,
            status=TaskStatus.IN_PROGRESS,
            start_date=now - timedelta(days=10),
            due_date=now - timedelta(days=3) # Overdue!
        )
        t6 = Task(
            title="JWT Authentication & Password Hashing",
            description="Setup Bcrypt hashing and PyJWT token generation with expiration logic.",
            project_id=proj3.id,
            assigned_to_id=member2.id,
            created_by_id=lead2.id,
            priority=TaskPriority.HIGH,
            status=TaskStatus.COMPLETED,
            start_date=now - timedelta(days=18),
            due_date=now - timedelta(days=8),
            completed_date=now - timedelta(days=9)
        )
        t7 = Task(
            title="Docker Compose YAML & Health Checks",
            description="Configure align-frontend, align-backend, and align-postgres with health checks.",
            project_id=proj4.id,
            assigned_to_id=member3.id,
            created_by_id=lead2.id,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.TO_DO,
            start_date=now - timedelta(days=2),
            due_date=now + timedelta(days=5)
        )

        db.add_all([t1, t2, t3, t4, t5, t6, t7])
        db.commit()

        db.refresh(t2)
        db.refresh(t5)
        db.refresh(t6)

        # 6. Create Comments
        c1 = TaskComment(
            task_id=t2.id,
            user_id=lead1.id,
            content="Great start on the sidebar navigation! Make sure to verify the mobile drawer smooth slide animation."
        )
        c2 = TaskComment(
            task_id=t2.id,
            user_id=member2.id,
            content="Thanks Sarah! Working on backdrop blur and keyboard escape key handlers now."
        )
        c3 = TaskComment(
            task_id=t5.id,
            user_id=lead2.id,
            content="Priya, checking in on the seed script status. Is there any blocker with SQLAlchemy 2.0 types?"
        )
        c4 = TaskComment(
            task_id=t5.id,
            user_id=member3.id,
            content="Resolving foreign key sequence links now! Will push the updated script shortly."
        )

        db.add_all([c1, c2, c3, c4])

        # 7. Create Notifications
        n1 = Notification(
            user_id=member2.id,
            title="New Task Assigned",
            message="You were assigned to 'Build Dashboard Layout & Sidebar' by Sarah Jenkins.",
            link="/tasks"
        )
        n2 = Notification(
            user_id=member3.id,
            title="Task Overdue Notice",
            message="Task 'Database Migration Script & Seed Verification' is past due.",
            link="/tasks"
        )
        db.add_all([n1, n2])

        db.commit()
        print("Database successfully seeded with demo data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
