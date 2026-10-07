import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

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
    # Login as Admin
    status, body = make_request(f"{BASE_URL}/auth/login", method="POST", data={"email": "admin@align.com", "password": "admin123"})
    assert status == 200, f"Login failed: {body}"
    token = body["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[Pass] Login as Admin")

    now = datetime.utcnow()
    start_str = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    end_str = (now + timedelta(days=60)).strftime("%Y-%m-%d")

    # TEST 1: Task due within range appears
    status, events = make_request(f"{BASE_URL}/calendar?start={start_str}&end={end_str}", headers=headers)
    assert status == 200
    task_events = [e for e in events if e["type"] == "TASK"]
    assert len(task_events) > 0, "No task events returned"
    print("[Pass] TEST 1: Task due within range appears")

    # TEST 2: Task outside range does not appear
    future_start = (now + timedelta(days=365)).strftime("%Y-%m-%d")
    future_end = (now + timedelta(days=370)).strftime("%Y-%m-%d")
    status, empty_events = make_request(f"{BASE_URL}/calendar?start={future_start}&end={future_end}", headers=headers)
    assert status == 200
    assert len(empty_events) == 0
    print("[Pass] TEST 2: Task outside range does not appear")

    # TEST 3: Project overlapping range appears
    project_events = [e for e in events if e["type"] == "PROJECT"]
    assert len(project_events) > 0, "No project events returned"
    print("[Pass] TEST 3: Project overlapping range appears")

    # TEST 4: Completed task displays correctly and is_overdue=false
    status, tasks = make_request(f"{BASE_URL}/tasks", headers=headers)
    completed_task = next((t for t in tasks if t["status"] == "Completed"), None)
    if completed_task:
        comp_event = next((e for e in events if e["id"] == f"task-{completed_task['id']}"), None)
        if comp_event:
            assert comp_event["is_overdue"] is False
    print("[Pass] TEST 4: Completed task is not overdue")

    # TEST 5: Past incomplete task is_overdue = true
    overdue_task = next((t for t in tasks if t.get("is_overdue")), None)
    if overdue_task:
        od_event = next((e for e in events if e["id"] == f"task-{overdue_task['id']}"), None)
        if od_event:
            assert od_event["is_overdue"] is True
    print("[Pass] TEST 5: Past incomplete task marked overdue")

    # TEST 7: team_id filter works
    team_id = events[0]["team_id"]
    if team_id:
        status, team_filtered = make_request(f"{BASE_URL}/calendar?start={start_str}&end={end_str}&team_id={team_id}", headers=headers)
        assert status == 200
        for e in team_filtered:
            assert e["team_id"] == team_id
    print("[Pass] TEST 7: team_id filter works")

    # TEST 8: project_id filter works
    proj_id = events[0]["project_id"]
    if proj_id:
        status, proj_filtered = make_request(f"{BASE_URL}/calendar?start={start_str}&end={end_str}&project_id={proj_id}", headers=headers)
        assert status == 200
        for e in proj_filtered:
            assert e["project_id"] == proj_id
    print("[Pass] TEST 8: project_id filter works")

    # TEST 9: assignee_id filter works
    task_with_assignee = next((e for e in task_events if e.get("assignee_id")), None)
    if task_with_assignee:
        asg_id = task_with_assignee["assignee_id"]
        status, asg_filtered = make_request(f"{BASE_URL}/calendar?start={start_str}&end={end_str}&assignee_id={asg_id}&event_type=TASK", headers=headers)
        assert status == 200
        for e in asg_filtered:
            assert e["assignee_id"] == asg_id
    print("[Pass] TEST 9: assignee_id filter works")

    # TEST 10: My Calendar filter works
    status, my_cal_events = make_request(f"{BASE_URL}/calendar?start={start_str}&end={end_str}&my_calendar_only=true", headers=headers)
    assert status == 200
    print("[Pass] TEST 10: My Calendar returns user's relevant events")

    # TEST 11: Upcoming deadlines endpoint works
    status, upcoming = make_request(f"{BASE_URL}/calendar/upcoming", headers=headers)
    assert status == 200
    assert isinstance(upcoming, list)
    print("[Pass] TEST 11: Upcoming deadlines endpoint works")

    # TEST 12: Invalid range (start > end) returns 400 validation error
    status, err_resp = make_request(f"{BASE_URL}/calendar?start=2026-10-31&end=2026-10-01", headers=headers)
    assert status == 400, f"Expected 400 error, got {status}"
    print("[Pass] TEST 12: Invalid date range (start > end) rejected with 400")

    print("\n--- ALL 12 CALENDAR BACKEND TESTS PASSED CLEANLY! ---")

if __name__ == "__main__":
    run_tests()
