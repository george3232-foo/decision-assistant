"""LLM-based structure extraction from natural language input."""
from __future__ import annotations

import json
from llm.client import chat_json
from models.schemas import ExtractedStructure, Factor


SYSTEM_PROMPT = """You MUST respond with ONLY valid JSON matching this EXACT schema. No extra text, no markdown, no explanation.

{
  "decision": "short title of the decision",
  "options": ["Option A name", "Option B name"],
  "factors": [
    {"name": "FactorName", "weight": 8, "description": "why it matters"},
    {"name": "FactorName2", "weight": 5, "description": "why it matters"}
  ],
  "missing_information": ["What info would help?"],
  "category": "phone"
}

RULES:
- options: 2-5 items, use short names like "iPhone 18" not "Buy iPhone 18"
- factors: each MUST have "name" (string), "weight" (integer 1-10), "description" (string)
- weight 8-10 = user said it matters a lot, 5-7 = mentioned casually, 3-4 = implied
- category MUST be one of: phone, city, education, finance, career, vehicle, housing, general
- missing_information: 2-5 items
- Respond with ONLY the JSON object, nothing else"""


async def extract_structure(user_input: str) -> ExtractedStructure:
    """Extract decision structure from natural language."""
    result = await chat_json(SYSTEM_PROMPT, user_input)

    # Parse factors robustly
    factors = []
    for f in result.get("factors", []):
        if isinstance(f, dict):
            name = f.get("name") or f.get("criterion") or f.get("factor") or str(f)
            weight = f.get("weight", 5)
            # Handle weight being a string like "High"
            if isinstance(weight, str):
                weight_map = {"high": 9, "medium": 6, "low": 3}
                weight = weight_map.get(weight.lower(), 5)
            factors.append(Factor(
                name=str(name),
                weight=int(weight),
                description=str(f.get("description", "")),
            ))
        elif isinstance(f, str):
            factors.append(Factor(name=f, weight=5))

    return ExtractedStructure(
        decision=result.get("decision", "Unknown Decision"),
        options=result.get("options", []),
        factors=factors,
        missing_information=result.get("missing_information", []),
        category=result.get("category", "general"),
    )
