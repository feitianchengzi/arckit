#!/usr/bin/env python3
"""
Local dev test for task father_id update behavior.

Usage:
  BASE_URL=http://localhost:8081/workshop/v1 \
  USER_ID=11111111-1111-1111-1111-111111111111 \
  USERNAME=alice \
  python3 test/dev/task_update_local_test.py
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE_URL = os.getenv("BASE_URL", "http://localhost:8081/workshop/v1")
USER_ID = os.getenv("USER_ID", "11111111-1111-1111-1111-111111111111")
USERNAME = os.getenv("USERNAME", "alice")
TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "5"))

HEADERS = {
    "X-User-ID": USER_ID,
    "X-User-Username": USERNAME,
    "Content-Type": "application/json",
}


def request(method, path, data=None):
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL + path, data=body, method=method, headers=HEADERS
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return {"_raw": text}


def fail(step, status, payload):
    print(f"\n[FAIL] {step}")
    print("status:", status)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.exit(1)


def ok(step, status, payload):
    print(f"\n== {step} ==")
    print("status:", status)
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def expect_ok(step, status, payload, allow_status=None):
    if allow_status is None:
        allow_status = {200, 201}
    if status not in allow_status:
        fail(step, status, payload)
    if payload.get("code") != "OK":
        fail(step, status, payload)


def main():
    # 1. health
    status, text = request("GET", "/public/health")
    payload = parse_json(text)
    expect_ok("health", status, payload, allow_status={200})
    ok("health", status, payload)

    # 2. create user (200 or 201)
    status, text = request(
        "POST",
        "/user/users",
        {"username": USERNAME, "avatar": "https://example.com/avatar.png"},
    )
    payload = parse_json(text)
    expect_ok("create user", status, payload)
    ok("create user", status, payload)

    # 3. create project
    project_name = f"task-update-test-{int(time.time())}"
    status, text = request("POST", "/user/projects", {"name": project_name})
    payload = parse_json(text)
    expect_ok("create project", status, payload, allow_status={201})
    ok("create project", status, payload)

    project_id = payload.get("data", {}).get("id")
    if not project_id:
        fail("create project", status, payload)

    # 4. create parent task
    status, text = request(
        "POST",
        "/user/tasks",
        {"project_id": project_id, "content": "parent task"},
    )
    payload = parse_json(text)
    expect_ok("create parent task", status, payload, allow_status={201})
    ok("create parent task", status, payload)
    parent_id = payload.get("data", {}).get("id")
    if not parent_id:
        fail("create parent task", status, payload)

    # 5. create child task (no father_id)
    status, text = request(
        "POST",
        "/user/tasks",
        {"project_id": project_id, "content": "child task"},
    )
    payload = parse_json(text)
    expect_ok("create child task", status, payload, allow_status={201})
    ok("create child task", status, payload)
    child_id = payload.get("data", {}).get("id")
    if not child_id:
        fail("create child task", status, payload)

    # 6. update child: set father_id
    status, text = request(
        "PUT", f"/user/tasks/{child_id}", {"father_id": parent_id}
    )
    payload = parse_json(text)
    expect_ok("update child set father_id", status, payload, allow_status={200})
    if payload.get("data", {}).get("father_id") != parent_id:
        fail("update child set father_id", status, payload)
    ok("update child set father_id", status, payload)

    # 7. update child: clear father_id with null
    status, text = request("PUT", f"/user/tasks/{child_id}", {"father_id": None})
    payload = parse_json(text)
    expect_ok("update child clear father_id", status, payload, allow_status={200})
    if payload.get("data", {}).get("father_id") is not None:
        fail("update child clear father_id", status, payload)
    ok("update child clear father_id", status, payload)

    # 8. update child: content only (father_id should remain null)
    status, text = request(
        "PUT", f"/user/tasks/{child_id}", {"content": "child task updated"}
    )
    payload = parse_json(text)
    expect_ok("update child content only", status, payload, allow_status={200})
    if payload.get("data", {}).get("father_id") is not None:
        fail("update child content only", status, payload)
    ok("update child content only", status, payload)

    # 9. set father again
    status, text = request(
        "PUT", f"/user/tasks/{child_id}", {"father_id": parent_id}
    )
    payload = parse_json(text)
    expect_ok("update child set father_id again", status, payload, allow_status={200})
    if payload.get("data", {}).get("father_id") != parent_id:
        fail("update child set father_id again", status, payload)
    ok("update child set father_id again", status, payload)

    # 10. attempt cycle (should be rejected)
    status, text = request(
        "PUT", f"/user/tasks/{parent_id}", {"father_id": child_id}
    )
    payload = parse_json(text)
    if status != 400 or payload.get("code") != "TASK_CIRCULAR_REFERENCE":
        fail("update parent set father_id to child (cycle)", status, payload)
    ok("update parent set father_id to child (cycle)", status, payload)

    print("\n[PASS] task father_id update behavior verified")


if __name__ == "__main__":
    main()
