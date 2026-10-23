"""Generate diagrams and code examples for a topic."""
from pathlib import Path
from app.core.config import settings
from app.services.llm import call_with_json_retry

_DIAGRAM_SYSTEM = (Path(__file__).parent.parent / "prompts" / "diagram_generator.txt").read_text()
_CODE_SYSTEM = (Path(__file__).parent.parent / "prompts" / "code_generator.txt").read_text()


def generate_diagrams(title: str, description: str, track: str, diagrams_to_know: list) -> list:
    """Returns list of {title, description, mermaid} dicts."""
    hints = "\n".join(f"- {d}" for d in (diagrams_to_know or []))
    user = f"""Topic: {title}
Description: {description}
Track: {track}

Key diagrams that MUST be included (based on the curriculum):
{hints}

Generate 3 Mermaid architecture diagrams covering these concepts."""

    result = call_with_json_retry(_DIAGRAM_SYSTEM, user, settings.SONNET_MODEL, max_tokens=3000)
    return result.get("diagrams", [])


def generate_code_examples(title: str, description: str, track: str, key_concepts: list) -> list:
    """Returns list of {title, description, language, code} dicts."""
    concepts = "\n".join(f"- {c}" for c in (key_concepts or [])[:5])
    user = f"""Topic: {title}
Description: {description}
Track: {track}

Core concepts to illustrate with code:
{concepts}

Generate 3 practical code examples that implement these concepts."""

    result = call_with_json_retry(_CODE_SYSTEM, user, settings.SONNET_MODEL, max_tokens=4096)
    return result.get("code_examples", [])
