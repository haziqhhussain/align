import urllib.request
import json

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
        return e.code, json.loads(res_body) if res_body else {}

def test_align_backend():
    print("--- 1. Testing Admin Login ---")
    status, login_res = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "admin@align.com",
        "password": "admin123"
    })
    assert status == 200, f"Login failed: {login_res}"
    token = login_res["access_token"]
    user = login_res["user"]
    print(f"Logged in successfully as Admin ({user['full_name']}) - Role: {user['role']}")

    auth_headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Testing Get Current User Profile ---")
    status, profile = make_request(f"{BASE_URL}/auth/me", headers=auth_headers)
    assert status == 200, f"Get me failed: {profile}"
    print(f"User email: {profile['email']}")

    print("\n--- 3. Testing Get Dashboard Stats (Admin View) ---")
    status, dash = make_request(f"{BASE_URL}/dashboard/stats", headers=auth_headers)
    assert status == 200, f"Dashboard failed: {dash}"
    print(f"View Type: {dash['view_type']}")
    print(f"Metrics: {dash['metrics']}")

    print("\n--- 4. Testing Get Teams ---")
    status, teams = make_request(f"{BASE_URL}/teams", headers=auth_headers)
    assert status == 200, f"Get teams failed: {teams}"
    print(f"Found {len(teams)} teams.")
    for t in teams:
        print(f"  - Team ID {t['id']}: {t['name']} | Lead: {t['lead']['full_name'] if t['lead'] else 'None'} | Members: {t['member_count']} | Projects: {t['project_count']}")

    print("\n--- 5. Testing Get Projects ---")
    status, projects = make_request(f"{BASE_URL}/projects", headers=auth_headers)
    assert status == 200, f"Get projects failed: {projects}"
    print(f"Found {len(projects)} projects.")
    for p in projects:
        print(f"  - Project ID {p['id']}: {p['name']} | Progress: {p['progress_percentage']}% ({p['completed_task_count']}/{p['task_count']} tasks)")

    print("\n--- 6. Testing Get Tasks ---")
    status, tasks = make_request(f"{BASE_URL}/tasks", headers=auth_headers)
    assert status == 200, f"Get tasks failed: {tasks}"
    print(f"Found {len(tasks)} tasks.")

    print("\n--- 7. Testing Task Comments ---")
    if tasks:
        task_id = tasks[0]["id"]
        status, comments = make_request(f"{BASE_URL}/tasks/{task_id}/comments", headers=auth_headers)
        assert status == 200
        print(f"Found {len(comments)} comments on task ID {task_id}.")

    print("\n--- ALL BACKEND ENDPOINT VERIFICATIONS PASSED CLEANLY! ---")

if __name__ == "__main__":
    test_align_backend()
