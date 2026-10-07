import urllib.request
import json
import time

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data_bytes = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(res_body) if res_body else {}
        except Exception:
            return e.code, {"raw_error": res_body}

def test_activity_log():
    timestamp = int(time.time())
    email1 = f"act_user1_{timestamp}@example.com"
    email2 = f"act_user2_{timestamp}@example.com"
    email3 = f"act_user3_{timestamp}@example.com"

    print("--- 1. Register User 1 ---")
    st, u1 = make_request(f"{BASE_URL}/auth/register", method="POST", data={
        "email": email1,
        "full_name": "Audit User 1",
        "password": "Password123!"
    })
    assert st == 201, f"User 1 reg failed: {u1}"
    u1_id = u1["id"]

    st, l1 = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": email1,
        "password": "Password123!"
    })
    assert st == 200, f"User 1 login failed: {l1}"
    u1_token = l1["access_token"]
    h1 = {"Authorization": f"Bearer {u1_token}"}

    print("--- 2. Register User 2 ---")
    st, u2 = make_request(f"{BASE_URL}/auth/register", method="POST", data={
        "email": email2,
        "full_name": "Audit User 2",
        "password": "Password123!"
    })
    assert st == 201, f"User 2 reg failed: {u2}"
    u2_id = u2["id"]

    st, l2 = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": email2,
        "password": "Password123!"
    })
    assert st == 200, f"User 2 login failed: {l2}"
    u2_token = l2["access_token"]
    h2 = {"Authorization": f"Bearer {u2_token}"}

    print("--- 3. Friend Request & Accept ---")
    st, freq = make_request(f"{BASE_URL}/friend-requests/{u2_id}", method="POST", headers=h1)
    assert st == 201, f"Friend request failed: {freq}"
    req_id = freq["id"]

    st, acc = make_request(f"{BASE_URL}/friend-requests/{req_id}/accept", method="PATCH", headers=h2)
    assert st == 200, f"Accept friend request failed: {acc}"

    print("--- 4. Create Team ---")
    st, team = make_request(f"{BASE_URL}/teams", method="POST", data={
        "name": f"Audit Team {timestamp}",
        "description": "Testing activity log integration"
    }, headers=h1)
    assert st == 201, f"Create team failed: {team}"
    team_id = team["id"]

    print("--- 5. Invite & Join Team ---")
    st, inv = make_request(f"{BASE_URL}/teams/{team_id}/invitations/{u2_id}", method="POST", headers=h1)
    assert st == 201, f"Invite failed: {inv}"
    inv_id = inv["id"]

    st, join = make_request(f"{BASE_URL}/team-invitations/{inv_id}/accept", method="PATCH", headers=h2)
    assert st == 200, f"Join team failed: {join}"

    print("--- 6. Create Project ---")
    st, proj = make_request(f"{BASE_URL}/projects", method="POST", data={
        "name": f"Audit Project {timestamp}",
        "description": "Testing project activity logging",
        "team_id": team_id,
        "status": "Active"
    }, headers=h1)
    assert st == 201, f"Create project failed: {proj}"
    proj_id = proj["id"]

    print("--- 7. Create Task & Assign ---")
    st, task = make_request(f"{BASE_URL}/tasks", method="POST", data={
        "title": "Build Audit System",
        "description": "Log all workspace events",
        "project_id": proj_id,
        "assigned_to_id": u2_id,
        "priority": "High",
        "status": "To Do"
    }, headers=h1)
    assert st == 201, f"Create task failed: {task}"
    task_id = task["id"]

    print("--- 8. Update Task Status & Complete ---")
    st, updated_task = make_request(f"{BASE_URL}/tasks/{task_id}/status", method="PATCH", data={
        "status": "Completed"
    }, headers=h2)
    assert st == 200, f"Update task status failed: {updated_task}"

    print("--- 9. Add Task Comment ---")
    st, comment = make_request(f"{BASE_URL}/tasks/{task_id}/comments", method="POST", data={
        "content": "Audit log system verified!"
    }, headers=h2)
    assert st == 201, f"Comment failed: {comment}"

    print("--- 10. Verify Activity Log Endpoint ---")
    st, act_list = make_request(f"{BASE_URL}/activity?team_id={team_id}", headers=h1)
    assert st == 200, f"Activity fetch failed: {act_list}"
    items = act_list["items"]
    assert len(items) > 0, "No activity items returned"
    action_types = [it["action_type"] for it in items]
    print(f"Logged Actions: {action_types}")

    assert "TEAM_CREATED" in action_types
    assert "PROJECT_CREATED" in action_types
    assert "TASK_CREATED" in action_types
    assert "TASK_COMPLETED" in action_types
    assert "COMMENT_ADDED" in action_types

    print("--- 11. Verify Permissions (Unrelated User) ---")
    st, u3 = make_request(f"{BASE_URL}/auth/register", method="POST", data={
        "email": email3,
        "full_name": "Audit User 3",
        "password": "Password123!"
    })
    assert st == 201
    st, l3 = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": email3,
        "password": "Password123!"
    })
    assert st == 200
    u3_token = l3["access_token"]
    h3 = {"Authorization": f"Bearer {u3_token}"}

    st, unauth_act = make_request(f"{BASE_URL}/activity?team_id={team_id}", headers=h3)
    assert st == 403, f"Expected 403 for unauthorized team activity, got {st}: {unauth_act}"

    print("\n==========================================")
    print("ALL 11 ACTIVITY LOG ENDPOINT & PERMISSION TESTS PASSED CLEANLY!")
    print("==========================================")

if __name__ == "__main__":
    test_activity_log()
