from httpx import AsyncClient


async def test_get_today_study_session_creates_one(client: AsyncClient, seeded_sd1):
    resp = await client.get("/study/today?track=sd1")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["date"] is not None


async def test_get_today_study_session_idempotent(client: AsyncClient, seeded_sd1):
    resp1 = await client.get("/study/today?track=sd1")
    resp2 = await client.get("/study/today?track=sd1")
    assert resp1.json()["id"] == resp2.json()["id"]


async def test_patch_study_session_notes(client: AsyncClient, seeded_sd1):
    resp = await client.get("/study/today?track=sd1")
    session_id = resp.json()["id"]

    resp = await client.patch(f"/study/{session_id}", json={"notes": "## My notes\n\nHello world"})
    assert resp.status_code == 200
    assert resp.json()["notes"] == "## My notes\n\nHello world"


async def test_patch_study_session_diagram(client: AsyncClient, seeded_sd1):
    resp = await client.get("/study/today?track=sd1")
    session_id = resp.json()["id"]

    diagram = {"elements": [{"id": "abc", "type": "rectangle"}], "appState": {}}
    resp = await client.patch(f"/study/{session_id}", json={"diagram_json": diagram})
    assert resp.status_code == 200
    assert resp.json()["diagram_json"]["elements"][0]["id"] == "abc"


async def test_patch_nonexistent_session(client: AsyncClient):
    resp = await client.patch("/study/999999", json={"notes": "test"})
    assert resp.status_code == 404


async def test_invalid_track(client: AsyncClient):
    resp = await client.get("/study/today?track=xyz")
    assert resp.status_code == 400
