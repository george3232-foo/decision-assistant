"""LLM-based adaptive questioning."""
from __future__ import annotations

from llm.client import chat_json
from models.schemas import ExtractedStructure, Question


SYSTEM_PROMPT = """You MUST respond with ONLY valid JSON matching this EXACT schema. No extra text, no markdown.

{{
  "questions": [
    {{"text": "How important is battery life to you?", "factor_hint": "Battery", "options": ["Very important", "Somewhat", "Not important"]}},
    {{"text": "What will you primarily use the camera for?", "factor_hint": "Camera", "options": null}}
  ]
}}

DECISION CONTEXT:
- Decision: {decision}
- Options: {options}
- Factors: {factors}
- Category: {category}
- Missing info: {missing_info}

RULES:
- Generate 3-7 questions maximum
- Each question needs "text", "factor_hint", and "options" (null for free-text)
- Provide multiple choice options (3-5 items) when applicable
- Questions should be conversational, not clinical
- Avoid redundant questions
- Respond with ONLY the JSON object"""


async def generate_questions(extracted: ExtractedStructure) -> list[Question]:
    """Generate adaptive questions based on extracted structure."""
    factor_str = ", ".join(f"{f.name} (weight {f.weight})" for f in extracted.factors)
    options_str = ", ".join(extracted.options)
    missing_str = ", ".join(extracted.missing_information)

    prompt = SYSTEM_PROMPT.format(
        decision=extracted.decision,
        options=options_str,
        factors=factor_str,
        category=extracted.category,
        missing_info=missing_str,
    )

    result = await chat_json(
        "You generate targeted decision questions. Respond with ONLY valid JSON.",
        prompt,
    )

    questions = []
    for q in result.get("questions", []):
        questions.append(Question(
            text=q.get("text", ""),
            factor_hint=q.get("factor_hint", ""),
            options=q.get("options"),
        ))

    return questions
