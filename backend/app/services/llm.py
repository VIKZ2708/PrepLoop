"""Thin Anthropic SDK wrapper with prompt caching and retry-once on invalid JSON."""
import json
import re
from typing import Any

import anthropic

from app.core.config import settings

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _extract_json(text: str) -> Any:
    """Extract JSON from a response that may have surrounding prose."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first JSON array or object
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    raise ValueError(f"No JSON found in LLM response: {text[:200]}")


def call_with_json_retry(
    system: str,
    user: str,
    model: str,
    max_tokens: int = 2048,
) -> Any:
    """
    Call Anthropic, return parsed JSON. Retries once on parse failure.
    Uses prompt caching on the system prompt (cache_control: ephemeral).
    """
    client = _get_client()

    def _call() -> str:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=[
                {
                    "type": "text",
                    "text": system,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text

    raw = _call()
    try:
        return _extract_json(raw)
    except (ValueError, json.JSONDecodeError):
        # Retry once with an explicit instruction
        raw2 = _call()
        return _extract_json(raw2)
