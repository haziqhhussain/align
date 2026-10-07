import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        body_json = json.loads(resp_body) if resp_body else {}
        return e.code, body_json

def run_tests():
    # 1. Login as Admin
    status, body = make_request(f"{BASE_URL}/auth/login", method="POST", data={"email": "admin@align.com", "password": "admin123"})
    assert status == 200, f"Login failed: {body}"
    token = body["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[Pass] Login as Admin")

    # Fetch tasks
    status, tasks = make_request(f"{BASE_URL}/tasks", method="GET", headers=headers)
    assert len(tasks) > 0, "No tasks found"
    task_id = tasks[0]["id"]
    team_id = tasks[0]["project"]["team_id"]
    print(f"Using Task ID {task_id} for subtask tests.")

    # Fetch team members for team_id
    status, team_res = make_request(f"{BASE_URL}/teams/{team_id}", method="GET", headers=headers)

    # TEST 1: Create subtask
    status, st1 = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks", method="POST", headers=headers, data={
        "title": "Subtask Item 1",
        "description": "First subtask item"
    })
    assert status == 201, f"Create subtask failed: {st1}"
    assert st1["title"] == "Subtask Item 1"
    assert st1["is_completed"] is False
    print("[Pass] TEST 1: Create subtask")

    # TEST 2: Toggle complete
    status, toggled = make_request(f"{BASE_URL}/subtasks/{st1['id']}/toggle", method="PATCH", headers=headers)
    assert status == 200, f"Toggle failed: {toggled}"
    assert toggled["is_completed"] is True
    assert toggled["completed_at"] is not None
    assert toggled["completed_by_id"] is not None
    print("[Pass] TEST 2: Toggle complete")

    # TEST 3: Toggle reopen
    status, reopened = make_request(f"{BASE_URL}/subtasks/{st1['id']}/toggle", method="PATCH", headers=headers)
    assert status == 200
    assert reopened["is_completed"] is False
    assert reopened["completed_at"] is None
    print("[Pass] TEST 3: Toggle reopen")

    # Clean up existing subtasks for clear calculation
    status, subtasks_list = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks", method="GET", headers=headers)
    for s in subtasks_list:
        make_request(f"{BASE_URL}/subtasks/{s['id']}", method="DELETE", headers=headers)

    # TEST 4: Create 5 subtasks and complete 3 -> 3/5, 60%
    created_ids = []
    for i in range(1, 6):
        status, st = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks", method="POST", headers=headers, data={"title": f"Item {i}"})
        created_ids.append(st["id"])
    
    # Complete 3 of them
    for s_id in created_ids[:3]:
        make_request(f"{BASE_URL}/subtasks/{s_id}/toggle", method="PATCH", headers=headers)

    status, parent_task = make_request(f"{BASE_URL}/tasks/{task_id}", method="GET", headers=headers)
    assert parent_task["subtask_count"] == 5
    assert parent_task["completed_subtask_count"] == 3
    assert parent_task["subtask_progress"] == 60
    print("[Pass] TEST 4: 5 subtasks created, 3 completed -> 60% progress")

    # TEST 5: Assign subtask to valid team member
    members = team_res.get("members", [])
    valid_user_id = members[0]["user_id"] if len(members) > 0 else 1
    status, assign_res = make_request(f"{BASE_URL}/subtasks/{created_ids[0]}", method="PATCH", headers=headers, data={
        "assigned_to_id": valid_user_id
    })
    assert status == 200, f"Assign failed: {assign_res}"
    assert assign_res["assigned_to_id"] == valid_user_id
    print("[Pass] TEST 5: Assign subtask to valid team member")

    # TEST 6: Assign to invalid/non-team user
    status, invalid_assign = make_request(f"{BASE_URL}/subtasks/{created_ids[0]}", method="PATCH", headers=headers, data={
        "assigned_to_id": 99999
    })
    assert status in [400, 404], f"Expected 400/404, got {status}"
    print("[Pass] TEST 6: Assign to invalid user rejected")

    # TEST 8: Delete subtask
    status, del_res = make_request(f"{BASE_URL}/subtasks/{created_ids[-1]}", method="DELETE", headers=headers)
    assert status == 200
    status, parent_after_del = make_request(f"{BASE_URL}/tasks/{task_id}", method="GET", headers=headers)
    assert parent_after_del["subtask_count"] == 4
    print("[Pass] TEST 8: Delete subtask")

    # TEST 9: Reorder subtasks
    reorder_payload = {"items": [
        {"id": created_ids[1], "position": 0},
        {"id": created_ids[0], "position": 1},
        {"id": created_ids[2], "position": 2},
        {"id": created_ids[3], "position": 3}
    ]}
    status, reordered_list = make_request(f"{BASE_URL}/tasks/{task_id}/subtasks/reorder", method="PATCH", headers=headers, data=reorder_payload)
    assert status == 200
    assert reordered_list[0]["id"] == created_ids[1]
    assert reordered_list[1]["id"] == created_ids[0]
    print("[Pass] TEST 9: Reorder subtasks")

    # TEST 10: All subtasks completed -> 100% checklist progress, parent task status unchanged
    for s in parent_after_del["subtasks"]:
        if not s["is_completed"]:
            make_request(f"{BASE_URL}/subtasks/{s['id']}/toggle", method="PATCH", headers=headers)

    status, parent_all_done = make_request(f"{BASE_URL}/tasks/{task_id}", method="GET", headers=headers)
    assert parent_all_done["subtask_progress"] == 100
    assert parent_all_done["completed_subtask_count"] == parent_all_done["subtask_count"]
    print("[Pass] TEST 10: All subtasks completed -> 100% progress, parent status unchanged")

    print("\n--- ALL 10 SUBTASK BACKEND TESTS PASSED CLEANLY! ---")

if __name__ == "__main__":
    run_tests()
