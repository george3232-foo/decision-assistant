"""LLM client wrapper using OpenAI-compatible API."""
from __future__ import annotations

import json
import os
import re
import httpx
from openai import AsyncOpenAI


_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        http_client = httpx.AsyncClient(
            headers={"Accept-Encoding": "identity"},
            timeout=httpx.Timeout(120.0, connect=30.0),
        )
        api_key = os.getenv("LLM_API_KEY")
        if not api_key:
            raise ValueError(
                "LLM_API_KEY environment variable is required. "
                "Set it with: export LLM_API_KEY='your-api-key'"
            )
        _client = AsyncOpenAI(
            base_url=os.getenv("LLM_BASE_URL", "https://opengateway.gitlawb.com/v1"),
            api_key=api_key,
            http_client=http_client,
        )
    return _client


MODEL = os.getenv("LLM_MODEL", "mimo-v2.5-pro")


def _parse_json_robust(content: str) -> dict:
    """Parse JSON from LLM output, handling markdown fences and common quirks."""
    text = content.strip()
    # Strip markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def chat_json(system: str, user: str) -> dict:
    """Call LLM and parse JSON response."""
    client = get_client()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    return _parse_json_robust(content)


async def chat_text(system: str, user: str) -> str:
    """Call LLM and return text response."""
    client = get_client()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.7,
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""
