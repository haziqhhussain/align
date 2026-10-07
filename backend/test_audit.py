import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000/api"

def make_req(endpoint, method="GET", body=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        status = res.status
        content = res.read().decode('utf-8')
        return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        return e.code, json.loads(content) if content else {}
    except Exception as e:
        return 500, {"error": str(e)}

def log_p(msg):
    print(msg)
    sys.stdout.flush()

def run_audit():
    log_p("=== STARTING BACKEND FUNCTIONAL AUDIT ===")
    
    # 1. Test Root/Docs
    status, res = make_req("", "GET")
    log_p(f"[1] GET / -> Status {status}")

    # 2. Login Admin
    status, login_res = make_req("/auth/login", "POST", {"email": "admin@align.com", "password": "admin123"})
    log_p(f"[2] POST /auth/login (Admin) -> Status {status}")
    if status != 200:
        log_p(f"Admin login failed: {login_res}")
        return
    admin_token = login_res["access_token"]
    admin_id = login_res["user"]["id"]

    # 3. Current User
    status, me_res = make_req("/auth/me", "GET", token=admin_token)
    log_p(f"[3] GET /auth/me -> Status {status}, User: {me_res.get('full_name')} ({me_res.get('role')})")

    # 4. Dashboard Stats (Admin)
    status, dash_res = make_req("/dashboard/stats", "GET", token=admin_token)
    log_p(f"[4] GET /dashboard/stats -> Status {status}, View: {dash_res.get('view_type')}")

    # 5. Teams List & Details
    status, teams = make_req("/teams", "GET", token=admin_token)
    log_p(f"[5] GET /teams -> Status {status}, Count: {len(teams)}")
    if teams:
        team_id = teams[0]["id"]
        status, t_detail = make_req(f"/teams/{team_id}", "GET", token=admin_token)
        log_p(f"    GET /teams/{team_id} -> Status {status}, Name: {t_detail.get('name')}")

    # 6. Projects List
    status, projects = make_req("/projects", "GET", token=admin_token)
    log_p(f"[6] GET /projects -> Status {status}, Count: {len(projects)}")

    # 7. Tasks List
    status, tasks = make_req("/tasks", "GET", token=admin_token)
    log_p(f"[7] GET /tasks -> Status {status}, Count: {len(tasks)}")

    # 8. Notifications
    status, notifs = make_req("/notifications", "GET", token=admin_token)
    log_p(f"[8] GET /notifications -> Status {status}, Count: {len(notifs)}")
    status, unread = make_req("/notifications/unread-count", "GET", token=admin_token)
    log_p(f"    GET /notifications/unread-count -> Status {status}, Count: {unread.get('unread_count')}")

    # 9. Social Friends & Requests
    status, friends = make_req("/friends", "GET", token=admin_token)
    log_p(f"[9] GET /friends -> Status {status}, Count: {len(friends)}")

    status, inc_reqs = make_req("/friend-requests/incoming", "GET", token=admin_token)
    log_p(f"    GET /friend-requests/incoming -> Status {status}, Count: {len(inc_reqs)}")

    status, team_invs = make_req("/team-invitations", "GET", token=admin_token)
    log_p(f"    GET /team-invitations -> Status {status}, Count: {len(team_invs)}")

    # 10. User Search
    status, search_res = make_req("/users/search?q=admin", "GET", token=admin_token)
    log_p(f"[10] GET /users/search?q=admin -> Status {status}, Found: {len(search_res)}")

    log_p("=== BACKEND AUDIT COMPLETE ===")

if __name__ == "__main__":
    run_audit()
