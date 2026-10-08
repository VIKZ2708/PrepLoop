from httpx import AsyncClient


async def test_list_tasks_returns_list(client: AsyncClient):
    resp = await client.get("/project/tasks")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_create_task(client: AsyncClient):
    resp = await client.post("/project/tasks", json={"title": "Phase 2 test task"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Phase 2 test task"
    assert data["status"] == "todo"
    assert "id" in data


async def test_update_task_status(client: AsyncClient):
    create = await client.post("/project/tasks", json={"title": "Task to move"})
    task_id = create.json()["id"]

    resp = await client.patch(f"/project/tasks/{task_id}", json={"status": "in_progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


async def test_update_task_not_found(client: AsyncClient):
    resp = await client.patch("/project/tasks/999999", json={"status": "done"})
    assert resp.status_code == 404


async def test_delete_task(client: AsyncClient):
    create = await client.post("/project/tasks", json={"title": "Task to delete"})
    task_id = create.json()["id"]

    resp = await client.delete(f"/project/tasks/{task_id}")
    assert resp.status_code == 204

    resp = await client.delete(f"/project/tasks/{task_id}")
    assert resp.status_code == 404


async def test_upsert_today_log(client: AsyncClient):
    resp = await client.put("/project/log/today", json={
        "built": "Set up FastAPI backend",
        "blockers": "None today",
        "learnings": "SQLAlchemy async patterns",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["built"] == "Set up FastAPI backend"
    assert data["date"] is not None


async def test_upsert_today_log_is_idempotent(client: AsyncClient):
    await client.put("/project/log/today", json={"built": "first"})
    resp = await client.put("/project/log/today", json={"built": "updated"})
    assert resp.status_code == 200
    assert resp.json()["built"] == "updated"


async def test_get_today_log(client: AsyncClient):
    await client.put("/project/log/today", json={"built": "something"})
    resp = await client.get("/project/log/today")
    assert resp.status_code == 200
    assert resp.json()["built"] == "something"
