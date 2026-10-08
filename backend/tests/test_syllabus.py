import pytest
from httpx import AsyncClient


async def test_syllabus_today_returns_item(client: AsyncClient, seeded_sd1):
    resp = await client.get("/syllabus/today?track=sd1&day=1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["track"] == "sd1"
    assert "title" in data
    assert "description" in data
    assert "day_no" in data
    assert isinstance(data["id"], int)


async def test_syllabus_today_invalid_track(client: AsyncClient):
    resp = await client.get("/syllabus/today?track=invalid")
    assert resp.status_code == 400


async def test_syllabus_today_missing_track(client: AsyncClient):
    resp = await client.get("/syllabus/today")
    assert resp.status_code == 422


async def test_syllabus_today_empty_track_404(client: AsyncClient):
    resp = await client.get("/syllabus/today?track=sd2&day=1")
    assert resp.status_code in (200, 404)


async def test_syllabus_all_tracks_valid(client: AsyncClient):
    for track in ("sd1", "sd2", "ai"):
        resp = await client.get(f"/syllabus/today?track={track}&day=1")
        assert resp.status_code in (200, 404), f"Unexpected status for {track}"
