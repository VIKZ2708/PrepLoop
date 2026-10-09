"""Phase 4 tests — grader and teach-back services mocked throughout."""
from unittest.mock import patch

import pytest

from app.services.grader import GradeResult
from app.services.teach_back import TeachBackResult

GOOD_GRADE = GradeResult(score=8, feedback="Strong answer covering key trade-offs.")
WEAK_GRADE = GradeResult(score=4, feedback="Missing scale and failure mode discussion.")
TEACH_BACK_RESULT = TeachBackResult(
    critique="Good high-level overview but you skipped consistency guarantees.",
    follow_up_questions=[
        "How would you handle a node failure mid-write?",
        "What consistency model does your design use and why?",
    ],
)


# ── Grader via quiz answer endpoint ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_short_answer_graded_by_ai(client):
    with patch("app.api.quiz.generate_questions") as mock_gen, \
         patch("app.api.quiz.grade_answer", return_value=GOOD_GRADE) as mock_grade:
        from app.schemas.quiz import QuestionSchema
        mock_gen.return_value = [
            QuestionSchema(
                type="short",
                prompt="Why does a URL shortener need a unique ID generator?",
                answer="To avoid collisions.",
                difficulty="medium",
            )
        ]
        start = (await client.post("/quiz/start?track=sd1")).json()
        attempt_id = start["attempt_id"]
        q = start["questions"][0]

        resp = await client.post(
            f"/quiz/{attempt_id}/answer",
            json={"question_id": q["id"], "user_answer": "A unique ID prevents duplicate short URLs."},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ai_score"] == 8.0
        assert "trade-offs" in data["ai_feedback"]
        assert data["is_correct"] is True   # score ≥ 6
        mock_grade.assert_called_once()


@pytest.mark.asyncio
async def test_short_answer_low_score_marked_wrong(client):
    with patch("app.api.quiz.generate_questions") as mock_gen, \
         patch("app.api.quiz.grade_answer", return_value=WEAK_GRADE):
        from app.schemas.quiz import QuestionSchema
        mock_gen.return_value = [
            QuestionSchema(
                type="short",
                prompt="What trade-off does replication introduce?",
                answer="Higher fault tolerance but increased write latency.",
                difficulty="medium",
            )
        ]
        start = (await client.post("/quiz/start?track=sd1")).json()
        attempt_id = start["attempt_id"]
        q = start["questions"][0]

        resp = await client.post(
            f"/quiz/{attempt_id}/answer",
            json={"question_id": q["id"], "user_answer": "More copies."},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ai_score"] == 4.0
        assert data["is_correct"] is False  # score < 6


@pytest.mark.asyncio
async def test_mcq_still_graded_by_string_match(client):
    """MCQ must NOT call the grader — string match only."""
    with patch("app.api.quiz.generate_questions") as mock_gen, \
         patch("app.api.quiz.grade_answer") as mock_grade:
        from app.schemas.quiz import QuestionSchema
        mock_gen.return_value = [
            QuestionSchema(
                type="mcq",
                prompt="Token bucket empty?",
                options=["Requests dropped", "Bucket doubles", "All pass", "200 OK"],
                answer="Requests dropped",
                difficulty="easy",
            )
        ]
        start = (await client.post("/quiz/start?track=sd1")).json()
        attempt_id = start["attempt_id"]
        q = start["questions"][0]

        resp = await client.post(
            f"/quiz/{attempt_id}/answer",
            json={"question_id": q["id"], "user_answer": "Requests dropped"},
        )
        assert resp.status_code == 200
        assert resp.json()["is_correct"] is True
        assert resp.json()["ai_score"] is None
        mock_grade.assert_not_called()


# ── Teach-back endpoint ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_teach_back_returns_critique_and_questions(client):
    with patch("app.api.study.critique_teach_back", return_value=TEACH_BACK_RESULT):
        session = (await client.get("/study/today?track=sd1")).json()
        sid = session["id"]

        resp = await client.post(
            f"/study/{sid}/teach-back",
            json={"explanation": "Consistent hashing distributes keys across nodes."},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "critique" in data
        assert len(data["follow_up_questions"]) == 2
        assert "consistency" in data["critique"]


@pytest.mark.asyncio
async def test_teach_back_saves_to_session(client):
    with patch("app.api.study.critique_teach_back", return_value=TEACH_BACK_RESULT):
        session = (await client.get("/study/today?track=sd1")).json()
        sid = session["id"]

        await client.post(
            f"/study/{sid}/teach-back",
            json={"explanation": "My explanation of hashing."},
        )
        updated = (await client.get("/study/today?track=sd1")).json()
        assert updated["teach_back"] == "My explanation of hashing."
        assert updated["ai_feedback"] is not None


@pytest.mark.asyncio
async def test_teach_back_unknown_session_returns_404(client):
    with patch("app.api.study.critique_teach_back", return_value=TEACH_BACK_RESULT):
        resp = await client.post(
            "/study/99999/teach-back",
            json={"explanation": "anything"},
        )
        assert resp.status_code == 404
