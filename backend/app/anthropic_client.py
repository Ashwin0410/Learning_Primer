"""Thin wrapper around the Anthropic SDK for streaming Primer's replies.

Design notes:
- The Primer system prompt is large and static, so we send it as a cached system
  block (`cache_control: ephemeral`). Across a multi-hour session this serves the
  prompt from cache on every turn after the first — a large cost/latency saving.
- We stream so long project-step messages never hit HTTP timeouts.
- No `thinking` is enabled: teaching replies are direct generation, and we want
  snappy token-by-token output rather than a long silent pause. (Opus 4.8 with the
  `thinking` param omitted runs without thinking.)
"""
from __future__ import annotations

from collections.abc import Iterator

import anthropic

from .config import get_settings

settings = get_settings()

_client: anthropic.Anthropic | None = None


def is_configured() -> bool:
    return settings.has_api_key


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def stream_raw(
    system_prompt: str,
    messages: list[dict],
    max_tokens: int = 8000,
) -> Iterator[str]:
    """Yield raw text deltas from Claude for the given conversation.

    `messages` is a list of {"role": "user"|"assistant", "content": str}.
    Raises anthropic.APIError subclasses on failure — the caller handles them.
    """
    client = _get_client()
    system_blocks = [
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},
        }
    ]
    with client.messages.stream(
        model=settings.primer_model,
        max_tokens=max_tokens,
        system=system_blocks,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
