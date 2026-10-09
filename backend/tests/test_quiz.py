"""Phase 3 quiz tests — LLM is mocked throughout."""
from unittest.mock import patch, MagicMock

import pytest

from app.schemas.quiz import QuestionSchema

MOCK_QUESTIONS = [
    QuestionSchema(
        type="mcq",
        prompt="What does consistent hashing minimize?",
        options=["Key remapping on node changes", "Network hops", "Storage cost", "Write latency"],
        answer="Key remapping on node changes",
        explanation="Consistent hashing keeps remapping to O(K/N).",
        difficulty="medium",
    ),
    QuestionSchema(
        type="mcq",
        prompt="Token bucket: what happens when the bucket is empty?",
        options=["Requests are dropped", "Bucket doubles", "All requests pass", "Server returns 200"],
        answer="Requests are dropped",
        explanation="Requests beyond bucket capacity are rejected.",
        difficulty="easy",
    ),
    QuestionSchema(
        type="mcq",
        prompt="Which is NOT part of fanout-on-write?",
        options=["WebSocket channel", "Message queue", "Pre-computed timelines", "Write amplification"],
        answer="WebSocket channel",
        explanation="Fanout-on-write pushes posts to caches at write time.",
        difficulty="hard",
    ),
    QuestionSchema(
        type="short",
        prompt="Why does a URL shortener need a unique ID generator?",
        answer="To avoid collisions in the short-to-long URL mapping.",
        difficulty="medium",
    ),
    QuestionSchema(
        type="short",
        prompt="What trade-off does increasing replication factor introduce?",
        answer="Higher fault tolerance but increased write latency and cost.",
        difficulty="medium",
    ),
]


@pytest.fixture
def mock_generate():
    with patch("app.api.quiz.generate_questions", return_value=MOCK_QUESTIONS) as m:
        yield m


@pytest.mark.asyncio
async def test_start_quiz_returns_5_questions(client, mock_generate):
    resp = await client.post("/quiz/start?track=sd1")
    assert resp.status_code == 200
    data = resp.json()
    assert "attempt_id" in data
    assert len(data["questions"]) == 5


@pytest.mark.asyncio
async def test_start_quiz_questions_have_no_answer_field(client, mock_generate):
    resp = await client.post("/quiz/start?track=sd1")
    q = resp.json()["questions"][0]
    assert "answer" not in q
    assert "prompt" in q
    assert "type" in q


@pytest.mark.asyncio
async def test_answer_correct_mcq(client, mock_generate):
    start = (await client.post("/quiz/start?track=sd1")).json()
    attempt_id = start["attempt_id"]
    q = next(q for q in start["questions"] if q["type"] == "mcq")

    resp = await client.post(
        f"/quiz/{attempt_id}/answer",
        json={"question_id": q["id"], "user_answer": "Key remapping on node changes"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is True
    assert data["correct_answer"] == "Key remapping on node changes"


@pytest.mark.asyncio
async def test_answer_wrong_mcq(client, mock_generate):
    start = (await client.post("/quiz/start?track=sd1")).json()
    attempt_id = start["attempt_id"]
    q = next(q for q in start["questions"] if q["type"] == "mcq")

    resp = await client.post(
        f"/quiz/{attempt_id}/answer",
        json={"question_id": q["id"], "user_answer": "Network hops"},
    )
    assert resp.status_code == 200
    assert resp.json()["is_correct"] is False


@pytest.mark.asyncio
async def test_answer_unknown_attempt_returns_404(client, mock_generate):
    resp = await client.post(
        "/quiz/99999/answer",
        json={"question_id": 1, "user_answer": "anything"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_finish_quiz_score(client, mock_generate):
    start = (await client.post("/quiz/start?track=sd1")).json()
    attempt_id = start["attempt_id"]
    questions = start["questions"]

    # Answer all 3 MCQs correctly
    mcq_correct = {
        "What does consistent hashing minimize?": "Key remapping on node changes",
        "Token bucket: what happens when the bucket is empty?": "Requests are dropped",
        "Which is NOT part of fanout-on-write?": "WebSocket channel",
    }
    for q in questions:
        if q["type"] == "mcq":
            correct = mcq_correct[q["prompt"]]
            await client.post(
                f"/quiz/{attempt_id}/answer",
                json={"question_id": q["id"], "user_answer": correct},
            )
        else:
            await client.post(
                f"/quiz/{attempt_id}/answer",
                json={"question_id": q["id"], "user_answer": "wrong"},
            )

    resp = await client.post(f"/quiz/{attempt_id}/finish")
    assert resp.status_code == 200
    data = resp.json()
    assert data["correct"] == 3
    assert data["total"] == 5
    assert abs(data["score"] - 0.6) < 0.01


@pytest.mark.asyncio
async def test_finish_unknown_attempt_returns_404(client):
    resp = await client.post("/quiz/99999/finish")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_fallback_questions_used_when_no_notes(client):
    """When notes are empty, generator returns fallback questions — no LLM call."""
    with patch("app.api.quiz.generate_questions") as mock_gen:
        from app.services.quiz_generator import _FALLBACK_QUESTIONS
        mock_gen.return_value = _FALLBACK_QUESTIONS
        resp = await client.post("/quiz/start?track=sd1")
        assert resp.status_code == 200
        assert len(resp.json()["questions"]) == 5
        mock_gen.assert_called_once()
