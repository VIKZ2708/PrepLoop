"""Phase 5 recap tests — Haiku mocked throughout."""
from datetime import date
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

from app.models.models import DailyRecap
from app.services.recap_builder import RecapData

MOCK_RECAP = RecapData(
    summary="Yesterday you studied consistent hashing and scored 80% on the quiz.",
    weak_topics=["virtual nodes", "replication factor"],
    recall_questions=[
        "What problem does consistent hashing solve?",
        "How does a virtual node reduce hotspots?",
        "When would you choose eventual consistency over strong consistency?",
    ],
)


@pytest.fixture
def mock_build():
    """Patch the LLM call inside recap_builder so no real API call is made."""
    with patch("app.services.recap_builder.call_with_json_retry", return_value={
        "summary": MOCK_RECAP.summary,
        "weak_topics": MOCK_RECAP.weak_topics,
        "recall_questions": MOCK_RECAP.recall_questions,
    }) as m:
        yield m


@pytest.mark.asyncio
async def test_get_today_recap_returns_404_when_not_built(client):
    resp = await client.get("/recap/today")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_trigger_build_creates_recap(client, mock_build):
    resp = await client.post("/recap/build")
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "built_for" in data
    assert len(data["recall_questions"]) == 3


@pytest.mark.asyncio
async def test_get_today_recap_after_build(client, mock_build):
    await client.post("/recap/build")
    resp = await client.get("/recap/today")
    assert resp.status_code == 200
    data = resp.json()
    assert data["summary"] == MOCK_RECAP.summary
    assert len(data["weak_topics"]) == 2
    assert len(data["recall_questions"]) == 3


@pytest.mark.asyncio
async def test_build_is_idempotent(client, mock_build):
    r1 = (await client.post("/recap/build")).json()
    r2 = (await client.post("/recap/build")).json()
    assert r1["built_for"] == r2["built_for"]
    assert mock_build.call_count == 2  # called twice but DB upserts cleanly


@pytest.mark.asyncio
async def test_cron_get_also_triggers_build(client, mock_build):
    """Vercel cron fires GET /recap/build — must work identically to POST."""
    resp = await client.get("/recap/build")
    assert resp.status_code == 200
    assert "recall_questions" in resp.json()


@pytest.mark.asyncio
async def test_curriculum_returns_all_tracks(client):
    resp = await client.get("/syllabus/all")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["sd1"]) == 15
    assert len(data["sd2"]) == 13
    assert len(data["ai"]) == 10
    assert "today" in data
    # exactly one item per track should be marked is_today
    for track in ("sd1", "sd2", "ai"):
        today_count = sum(1 for item in data[track] if item["is_today"])
        assert today_count == 1
