"""Generate 5 quiz questions from a study session's notes using the LLM."""
from app.core.config import settings
from app.schemas.quiz import GeneratedQuiz, QuestionSchema
from app.services.llm import call_with_json_retry

_SYSTEM = """\
You are a rigorous technical interview coach who creates quiz questions for senior engineers.
Given notes from a study session, produce exactly 5 questions as strict JSON (no markdown, no prose).

Rules:
- 3 MCQ questions (type: "mcq") with exactly 4 options each; answer must be the full text of the correct option
- 2 short-answer questions (type: "short"); answer is a 1–2 sentence reference answer
- Each question must target a distinct concept from the notes
- difficulty is one of: "easy", "medium", "hard"

Return ONLY this JSON structure:
{
  "questions": [
    {
      "type": "mcq",
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "...",
      "difficulty": "medium"
    }
  ]
}"""

_FALLBACK_QUESTIONS: list[QuestionSchema] = [
    QuestionSchema(
        type="mcq",
        prompt="Which of the following is the primary goal of consistent hashing?",
        options=[
            "Minimize the number of keys reassigned when nodes are added or removed",
            "Maximize throughput by distributing load evenly at all times",
            "Ensure every node stores the same number of keys",
            "Reduce network latency by routing requests geographically",
        ],
        answer="Minimize the number of keys reassigned when nodes are added or removed",
        explanation="Consistent hashing keeps remapping to O(K/N) keys when a node joins or leaves.",
        difficulty="medium",
    ),
    QuestionSchema(
        type="mcq",
        prompt="In a rate limiter using a token bucket, what happens when the bucket is empty?",
        options=[
            "Requests are dropped or queued until tokens refill",
            "The bucket size doubles to accommodate burst traffic",
            "All requests are forwarded at reduced priority",
            "The server returns HTTP 200 with a Retry-After header",
        ],
        answer="Requests are dropped or queued until tokens refill",
        explanation="Token bucket allows bursting up to bucket capacity; requests beyond that are rejected.",
        difficulty="easy",
    ),
    QuestionSchema(
        type="mcq",
        prompt="Which component is NOT typically part of a news feed fanout-on-write system?",
        options=[
            "A real-time bidirectional WebSocket channel between followers",
            "A message queue that delivers posts to follower timelines",
            "Pre-computed timelines stored per user",
            "A write amplification factor proportional to follower count",
        ],
        answer="A real-time bidirectional WebSocket channel between followers",
        explanation="Fanout-on-write pushes posts to follower caches at write time; WebSockets are a separate concern.",
        difficulty="hard",
    ),
    QuestionSchema(
        type="short",
        prompt="Explain why a URL shortener needs a globally unique ID generator and name one algorithm you would use.",
        answer="Short URLs must map 1-to-1 to long URLs; duplicate IDs would produce collisions. Base62 encoding of a Snowflake or counter-based ID is a common choice.",
        difficulty="medium",
    ),
    QuestionSchema(
        type="short",
        prompt="What trade-off does increasing the replication factor introduce in a distributed key-value store?",
        answer="Higher replication improves read throughput and fault tolerance but increases write latency and storage cost, and makes strong consistency harder to achieve.",
        difficulty="medium",
    ),
]


def generate_questions(notes: str) -> list[QuestionSchema]:
    """Return 5 validated QuestionSchema objects. Falls back to hardcoded set if notes are empty."""
    if not notes or len(notes.strip()) < 50:
        return _FALLBACK_QUESTIONS

    user_prompt = f"Here are my study notes:\n\n{notes[:6000]}\n\nGenerate 5 questions."
    try:
        raw = call_with_json_retry(
            system=_SYSTEM,
            user=user_prompt,
            model=settings.SONNET_MODEL,
        )
        parsed = GeneratedQuiz.model_validate(raw)
        return parsed.questions
    except Exception:
        return _FALLBACK_QUESTIONS
