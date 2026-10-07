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

def test_user_management():
    print("--- 1. Login as Admin ---")
    status, admin_login = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "admin@align.com",
        "password": "admin123"
    })
    assert status == 200
    admin_token = admin_login["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin logged in successfully.")

    print("\n--- 2. Login as Non-Admin Member ---")
    status, member_login = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "dev.marcus@align.com",
        "password": "member123"
    })
    assert status == 200
    member_token = member_login["access_token"]
    member_headers = {"Authorization": f"Bearer {member_token}"}
    print("Member logged in successfully.")

    print("\n--- 3. Test Non-Admin Forbidden Check on User Creation ---")
    status, res = make_request(f"{BASE_URL}/users", method="POST", data={
        "full_name": "Unauthorized User",
        "email": "unauth@align.com",
        "password": "password123",
        "role": "MEMBER"
    }, headers=member_headers)
    assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"
    print("Confirmed: Non-admin user cannot create users (HTTP 403).")

    print("\n--- 4. Test Admin Creating New Member ---")
    test_email = "new.member.test@align.com"
    status, new_user = make_request(f"{BASE_URL}/users", method="POST", data={
        "full_name": "Test New Member",
        "email": test_email,
        "password": "securepassword123",
        "role": "MEMBER"
    }, headers=admin_headers)
    assert status == 201, f"Create user failed: {new_user}"
    new_user_id = new_user["id"]
    print(f"Created new user ID {new_user_id}: {new_user['full_name']} ({new_user['email']}) - Role: {new_user['role']}")

    print("\n--- 5. Test Duplicate Email Validation ---")
    status, dup_res = make_request(f"{BASE_URL}/users", method="POST", data={
        "full_name": "Duplicate User",
        "email": test_email,
        "password": "password123",
        "role": "MEMBER"
    }, headers=admin_headers)
    assert status == 400, f"Expected 400 Bad Request, got {status}: {dup_res}"
    print(f"Confirmed duplicate email rejected with message: '{dup_res.get('detail')}'")

    print("\n--- 6. Test Promoting MEMBER to ADMIN ---")
    status, promoted = make_request(f"{BASE_URL}/users/{new_user_id}/role", method="PATCH", data={
        "role": "ADMIN"
    }, headers=admin_headers)
    assert status == 200, f"Role update failed: {promoted}"
    assert promoted["role"] == "ADMIN"
    print(f"Successfully promoted user ID {new_user_id} to {promoted['role']}")

    print("\n--- 7. Test Demoting ADMIN back to MEMBER ---")
    status, demoted = make_request(f"{BASE_URL}/users/{new_user_id}/role", method="PATCH", data={
        "role": "MEMBER"
    }, headers=admin_headers)
    assert status == 200, f"Role update failed: {demoted}"
    assert demoted["role"] == "MEMBER"
    print(f"Successfully demoted user ID {new_user_id} back to {demoted['role']}")

    print("\n--- 8. Test Protection Against Removing Final Admin ---")
    # Fetch all admins and demote others to test single last admin protection
    status, all_users = make_request(f"{BASE_URL}/users", headers=admin_headers)
    other_admins = [u for u in all_users if u["role"] == "ADMIN" and u["id"] != admin_login["user"]["id"]]
    
    for oa in other_admins:
        make_request(f"{BASE_URL}/users/{oa['id']}/role", method="PATCH", data={"role": "MEMBER"}, headers=admin_headers)

    # Attempt to demote the primary Admin when they are the only remaining Admin
    admin_user_id = admin_login["user"]["id"]
    status, last_admin_res = make_request(f"{BASE_URL}/users/{admin_user_id}/role", method="PATCH", data={
        "role": "MEMBER"
    }, headers=admin_headers)
    assert status == 400, f"Expected 400 for last admin demotion, got {status}: {last_admin_res}"
    print(f"Confirmed last Admin protection: '{last_admin_res.get('detail')}'")

    # Restore other admins
    for oa in other_admins:
        make_request(f"{BASE_URL}/users/{oa['id']}/role", method="PATCH", data={"role": "ADMIN"}, headers=admin_headers)

    print("\n--- 9. Cleanup Test User ---")

    status, del_res = make_request(f"{BASE_URL}/users/{new_user_id}", method="DELETE", headers=admin_headers)
    assert status == 204
    print(f"Successfully deleted test user ID {new_user_id}.")

    print("\n--- ALL ADMIN USER MANAGEMENT TESTS PASSED CLEANLY! ---")

if __name__ == "__main__":
    test_user_management()
