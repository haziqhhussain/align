import sqlite3
import os
from app.config import settings

def run_migrations():
    # Only run SQLite migrations if using sqlite
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add owner_id to teams if missing
        cursor.execute("PRAGMA table_info(teams)")
        teams_cols = [row[1] for row in cursor.fetchall()]
        if "owner_id" not in teams_cols:
            print("[Migration] Adding 'owner_id' column to 'teams' table...")
            cursor.execute("ALTER TABLE teams ADD COLUMN owner_id INTEGER REFERENCES users(id)")
            cursor.execute("UPDATE teams SET owner_id = lead_id WHERE owner_id IS NULL")

        # 2. Add role to team_members if missing
        cursor.execute("PRAGMA table_info(team_members)")
        tm_cols = [row[1] for row in cursor.fetchall()]
        if "role" not in tm_cols:
            print("[Migration] Adding 'role' column to 'team_members' table...")
            cursor.execute("ALTER TABLE team_members ADD COLUMN role VARCHAR(20) DEFAULT 'MEMBER'")
            cursor.execute(
                "UPDATE team_members SET role = 'OWNER' WHERE user_id IN (SELECT owner_id FROM teams WHERE teams.id = team_members.team_id)"
            )

        # 3. Add columns to notifications table if missing
        cursor.execute("PRAGMA table_info(notifications)")
        notif_cols = [row[1] for row in cursor.fetchall()]
        if "type" not in notif_cols:
            print("[Migration] Adding 'type' column to 'notifications' table...")
            cursor.execute("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'SYSTEM'")
        if "action_url" not in notif_cols:
            print("[Migration] Adding 'action_url' column to 'notifications' table...")
            cursor.execute("ALTER TABLE notifications ADD COLUMN action_url TEXT")
            cursor.execute("UPDATE notifications SET action_url = link WHERE action_url IS NULL")
        if "related_entity_type" not in notif_cols:
            print("[Migration] Adding 'related_entity_type' column to 'notifications' table...")
            cursor.execute("ALTER TABLE notifications ADD COLUMN related_entity_type VARCHAR(50)")
        # 4. Create activity_logs table if missing
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='activity_logs'")
        if not cursor.fetchone():
            print("[Migration] Creating 'activity_logs' table...")
            cursor.execute("""
                CREATE TABLE activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    action_type VARCHAR(50) NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INTEGER,
                    team_id INTEGER,
                    project_id INTEGER,
                    task_id INTEGER,
                    target_user_id INTEGER,
                    description TEXT NOT NULL,
                    metadata_json TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX idx_activity_actor ON activity_logs(actor_id)")
            cursor.execute("CREATE INDEX idx_activity_team ON activity_logs(team_id)")
            cursor.execute("CREATE INDEX idx_activity_project ON activity_logs(project_id)")
            cursor.execute("CREATE INDEX idx_activity_task ON activity_logs(task_id)")
            cursor.execute("CREATE INDEX idx_activity_created ON activity_logs(created_at)")
            cursor.execute("CREATE INDEX idx_activity_action ON activity_logs(action_type)")

        # 5. Create subtasks table if missing
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='subtasks'")
        if not cursor.fetchone():
            print("[Migration] Creating 'subtasks' table...")
            cursor.execute("""
                CREATE TABLE subtasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    description TEXT,
                    is_completed BOOLEAN NOT NULL DEFAULT 0,
                    position INTEGER NOT NULL DEFAULT 0,
                    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    completed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    completed_at DATETIME,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX idx_subtask_task ON subtasks(task_id)")
            cursor.execute("CREATE INDEX idx_subtask_assigned ON subtasks(assigned_to_id)")
            cursor.execute("CREATE INDEX idx_subtask_completed ON subtasks(is_completed)")
            cursor.execute("CREATE INDEX idx_subtask_position ON subtasks(position)")

        # 6. Add indexes for task due_date, status, priority, assigned_to_id, project_id, and project start_date/due_date/team_id
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_due_date ON tasks(due_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_assigned_to ON tasks(assigned_to_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_task_project_id ON tasks(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_start_date ON projects(start_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_due_date ON projects(due_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_project_team_id ON projects(team_id)")

        # 7. Create attachments table if missing
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='attachments'")
        if not cursor.fetchone():
            print("[Migration] Creating 'attachments' table...")
            cursor.execute("""
                CREATE TABLE attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_name TEXT NOT NULL,
                    stored_file_name TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type TEXT NOT NULL,
                    uploaded_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
                    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachment_task ON attachments(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachment_project ON attachments(project_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachment_uploader ON attachments(uploaded_by_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachment_created ON attachments(created_at)")

        conn.commit()
    except Exception as e:
        print(f"[Migration] Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
