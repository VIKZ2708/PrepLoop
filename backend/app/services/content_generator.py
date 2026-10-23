"""Generate rich study content per topic using Claude Sonnet."""
from pathlib import Path

from app.core.config import settings
from app.services.llm import call_with_json_retry

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "content_generator.txt").read_text()


def generate_topic_content(title: str, description: str, track: str) -> dict:
    track_label = {
        "sd1": "System Design Interview Vol 1 (Alex Xu)",
        "sd2": "System Design Interview Vol 2 (Alex Xu)",
        "ai": "AI Engineering",
    }.get(track, "System Design")

    user_prompt = f"""Track: {track_label}
Topic: {title}
Description: {description}

Generate comprehensive study content for this topic."""

    return call_with_json_retry(
        system=_SYSTEM,
        user=user_prompt,
        model=settings.SONNET_MODEL,
        max_tokens=4096,
    )
