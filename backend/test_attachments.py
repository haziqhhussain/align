import sys
import os
import io
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.session import SessionLocal, engine, Base
from app.database.migrate import run_migrations
from app.models import User, UserRole, Team, TeamMember, Project, Task, Attachment
from app.services.storage_service import delete_stored_file, get_safe_file_path
from app.auth.jwt import create_access_token

client = TestClient(app)

def setup_module():
    Base.metadata.create_all(bind=engine)
    run_migrations()

def get_auth_headers(user: User):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}

def test_attachment_suite():
    db = SessionLocal()
    try:
        # 1. Setup test users
        admin = db.query(User).filter(User.email == "admin_att@test.com").first()
        if not admin:
            admin = User(email="admin_att@test.com", password_hash="hash", full_name="Admin Attacher", role=UserRole.ADMIN)
            db.add(admin)

        user1 = db.query(User).filter(User.email == "user1_att@test.com").first()
        if not user1:
            user1 = User(email="user1_att@test.com", password_hash="hash", full_name="User One", role=UserRole.MEMBER)
            db.add(user1)

        user2 = db.query(User).filter(User.email == "user2_att@test.com").first()
        if not user2:
            user2 = User(email="user2_att@test.com", password_hash="hash", full_name="User Two", role=UserRole.MEMBER)
            db.add(user2)

        outsider = db.query(User).filter(User.email == "outsider_att@test.com").first()
        if not outsider:
            outsider = User(email="outsider_att@test.com", password_hash="hash", full_name="Outsider", role=UserRole.MEMBER)
            db.add(outsider)

        db.commit()

        # 2. Setup team & project & task
        team = Team(name="Attachment Team", lead_id=admin.id, owner_id=admin.id)
        db.add(team)
        db.commit()

        tm1 = TeamMember(team_id=team.id, user_id=user1.id, role="MEMBER")
        tm2 = TeamMember(team_id=team.id, user_id=user2.id, role="MEMBER")
        db.add_all([tm1, tm2])

        project = Project(name="Attachment Project", team_id=team.id)
        db.add(project)
        db.commit()

        task = Task(title="Attachment Task", project_id=project.id, assigned_to_id=user1.id, created_by_id=admin.id)
        db.add(task)
        db.commit()

        h_user1 = get_auth_headers(user1)
        h_user2 = get_auth_headers(user2)
        h_admin = get_auth_headers(admin)
        h_outsider = get_auth_headers(outsider)

        # TEST 1: Upload valid task attachment
        file_data1 = (io.BytesIO(b"Hello Task File"), "requirements.pdf")
        r1 = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("requirements.pdf", b"Hello Task File", "application/pdf")},
            headers=h_user1
        )
        assert r1.status_code == 201, f"TEST 1 Failed: {r1.text}"
        att1_data = r1.json()
        assert att1_data["file_name"] == "requirements.pdf"
        assert att1_data["uploaded_by"]["id"] == user1.id
        att1_id = att1_data["id"]
        print("[Pass] TEST 1: Upload valid task attachment")

        # TEST 2: Retrieve task attachment list
        r2 = client.get(f"/api/tasks/{task.id}/attachments", headers=h_user1)
        assert r2.status_code == 200
        items = r2.json()["items"]
        assert len(items) >= 1
        assert items[0]["id"] == att1_id
        print("[Pass] TEST 2: Retrieve task attachment list")

        # TEST 3: Download valid attachment
        r3 = client.get(f"/api/attachments/{att1_id}/download", headers=h_user1)
        assert r3.status_code == 200
        assert r3.content == b"Hello Task File"
        print("[Pass] TEST 3: Download valid attachment")

        # TEST 4: Upload project attachment
        r4 = client.post(
            f"/api/projects/{project.id}/attachments",
            files={"file": ("project_spec.docx", b"Project Spec Bytes", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers=h_user1
        )
        assert r4.status_code == 201
        att_proj_id = r4.json()["id"]
        print("[Pass] TEST 4: Upload project attachment")

        # TEST 5: Reject >10 MB file
        big_bytes = b"X" * (10 * 1024 * 1024 + 100) # Slightly > 10MB
        r5 = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("large_file.pdf", big_bytes, "application/pdf")},
            headers=h_user1
        )
        assert r5.status_code == 413
        assert "File must be smaller" in r5.json()["detail"]
        print("[Pass] TEST 5: Reject >10 MB file")

        # TEST 6: Reject forbidden executable type (.exe)
        r6 = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("virus.exe", b"MZ...", "application/x-msdownload")},
            headers=h_user1
        )
        assert r6.status_code == 400
        assert "forbidden" in r6.json()["detail"].lower()
        print("[Pass] TEST 6: Reject forbidden executable type (.exe)")

        # TEST 7: Unauthorized user cannot download another team's file
        r7 = client.get(f"/api/attachments/{att1_id}/download", headers=h_outsider)
        assert r7.status_code == 403
        print("[Pass] TEST 7: Unauthorized user cannot download another team's file")

        # TEST 8: Unauthorized user cannot upload
        r8 = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("hack.pdf", b"Content", "application/pdf")},
            headers=h_outsider
        )
        assert r8.status_code == 403
        print("[Pass] TEST 8: Unauthorized user cannot upload")

        # TEST 9: Uploader can delete own attachment
        # Upload another attachment for User 1 to delete
        r_temp = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("to_delete.txt", b"Delete Me", "text/plain")},
            headers=h_user1
        )
        temp_id = r_temp.json()["id"]
        r9 = client.delete(f"/api/attachments/{temp_id}", headers=h_user1)
        assert r9.status_code == 200
        print("[Pass] TEST 9: Uploader can delete own attachment")

        # TEST 10: Unauthorized member cannot delete another user's file
        # User 1 uploaded att1_id. User 2 tries to delete it.
        r10 = client.delete(f"/api/attachments/{att1_id}", headers=h_user2)
        assert r10.status_code == 403
        assert "Not authorized" in r10.json()["detail"]
        print("[Pass] TEST 10: Unauthorized member cannot delete another user's file")

        # TEST 11: Owner/Lead/Admin can delete allowed attachment
        # Admin deletes att_proj_id uploaded by User 1
        r11 = client.delete(f"/api/attachments/{att_proj_id}", headers=h_admin)
        assert r11.status_code == 200
        print("[Pass] TEST 11: Owner/Lead/Admin can delete allowed attachment")

        # TEST 12: Duplicate original filenames do not overwrite each other
        r12_a = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("requirements.pdf", b"Version A", "application/pdf")},
            headers=h_user1
        )
        r12_b = client.post(
            f"/api/tasks/{task.id}/attachments",
            files={"file": ("requirements.pdf", b"Version B", "application/pdf")},
            headers=h_user1
        )
        assert r12_a.status_code == 201 and r12_b.status_code == 201
        att_a = r12_a.json()
        att_b = r12_b.json()
        assert att_a["id"] != att_b["id"]

        # Content check
        res_a = client.get(f"/api/attachments/{att_a['id']}/download", headers=h_user1)
        res_b = client.get(f"/api/attachments/{att_b['id']}/download", headers=h_user1)
        assert res_a.content == b"Version A"
        assert res_b.content == b"Version B"
        print("[Pass] TEST 12: Duplicate original filenames do not overwrite each other")

        # TEST 13: Deleting attachment removes DB record and physical file
        att_db = db.query(Attachment).filter(Attachment.id == att_a["id"]).first()
        rel_path = att_db.file_path
        abs_p = get_safe_file_path(rel_path)
        assert os.path.exists(abs_p)

        del_res = client.delete(f"/api/attachments/{att_a['id']}", headers=h_user1)
        assert del_res.status_code == 200
        assert not os.path.exists(abs_p)
        assert db.query(Attachment).filter(Attachment.id == att_a["id"]).first() is None
        print("[Pass] TEST 13: Deleting attachment removes DB record and physical file")

        # TEST 14: Missing physical file does not crash delete
        att_b_db = db.query(Attachment).filter(Attachment.id == att_b["id"]).first()
        rel_path_b = att_b_db.file_path
        abs_p_b = get_safe_file_path(rel_path_b)
        if os.path.exists(abs_p_b):
            os.remove(abs_p_b) # Manually delete file to simulate missing physical file

        del_res_missing = client.delete(f"/api/attachments/{att_b['id']}", headers=h_user1)
        assert del_res_missing.status_code == 200
        assert db.query(Attachment).filter(Attachment.id == att_b["id"]).first() is None
        print("[Pass] TEST 14: Missing physical file does not crash delete")

        print("\n--- ALL 14 ATTACHMENTS BACKEND TESTS PASSED CLEANLY! ---")

    finally:
        db.close()

if __name__ == "__main__":
    setup_module()
    test_attachment_suite()
