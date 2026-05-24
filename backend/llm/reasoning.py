"""LLM-based reasoning, explanation, and bias analysis."""
from __future__ import annotations

from llm.client import chat_json, chat_text
from models.schemas import (
    ExtractedStructure,
    ScoringMatrix,
    Answer,
    BiasDetection,
)


# --- Score Generation ---

SCORE_PROMPT = """You MUST respond with ONLY valid JSON. No extra text, no markdown.

Score each option 1-10 on each factor. Be objective and realistic.

Decision: {decision}
Options: {options}
Factors (with weights): {factors}
User's answers: {answers}
User's original input: "{raw_input}"

Respond with this EXACT format:
{{
  "scores": {{
    "Option A": {{"Factor1": 8, "Factor2": 6}},
    "Option B": {{"Factor1": 7, "Factor2": 9}}
  }}
}}

RULES:
- Every option must have a score for every factor
- Scores are integers 1-10
- Use real knowledge about products/services if available
- Respond with ONLY the JSON object"""


async def generate_scores(
    extracted: ExtractedStructure,
    answers: list[Answer],
    raw_input: str,
) -> dict[str, dict[str, int]]:
    """LLM generates factor scores for each option.

    This is the ONLY place the LLM contributes to scoring,
    and these scores are then fed into the deterministic engine.
    """
    factors_str = ", ".join(f"{f.name} (weight {f.weight})" for f in extracted.factors)
    options_str = ", ".join(extracted.options)
    answers_str = "\n".join(f"Q: {a.question_id} -> A: {a.answer}" for a in answers) or "No answers yet"

    prompt = SCORE_PROMPT.format(
        decision=extracted.decision,
        options=options_str,
        factors=factors_str,
        answers=answers_str,
        raw_input=raw_input,
    )

    result = await chat_json(
        "You are an objective scoring engine. Score realistically. Respond with ONLY valid JSON.",
        prompt,
    )

    return result.get("scores", {})


# --- Reasoning ---

REASONING_PROMPT = """Explain why {winner} won the analysis in 2-3 sentences. Be direct.

Decision: {decision}
Winner: {winner} (score: {winner_score})
Runner-up: {runner_up} (score: {runner_up_score})
Score difference: {diff} ({diff_pct}%)

Factor breakdown for winner:
{factor_breakdown}

Explain the math in human terms. No filler."""


async def generate_reasoning(
    extracted: ExtractedStructure,
    matrix: ScoringMatrix,
) -> str:
    """Generate human-readable reasoning for the recommendation."""
    if not matrix.option_scores or len(matrix.option_scores) < 2:
        return "Insufficient data for detailed reasoning."

    winner = matrix.option_scores[0]
    runner_up = matrix.option_scores[1]
    diff = winner.weighted_total - runner_up.weighted_total
    diff_pct = round((diff / winner.weighted_total) * 100, 1) if winner.weighted_total > 0 else 0

    breakdown_lines = []
    for f in matrix.factors:
        w_score = winner.factor_scores.get(f.name, 0)
        r_score = runner_up.factor_scores.get(f.name, 0)
        breakdown_lines.append(f"  {f.name} (weight {f.weight}): {w_score} vs {r_score}")
    breakdown = "\n".join(breakdown_lines)

    prompt = REASONING_PROMPT.format(
        decision=extracted.decision,
        winner=winner.option,
        winner_score=winner.weighted_total,
        runner_up=runner_up.option,
        runner_up_score=runner_up.weighted_total,
        diff=round(diff, 1),
        diff_pct=diff_pct,
        factor_breakdown=breakdown,
    )

    return await chat_text(
        "You explain decision analysis results clearly and concisely.",
        prompt,
    )


# --- Bias Analysis ---

BIAS_PROMPT = """You MUST respond with ONLY valid JSON. No extra text.

Analyze for cognitive biases.

User's input: "{raw_input}"

Scoring:
{scoring_summary}

Respond with this EXACT format:
{{
  "biases": [
    {{"bias_type": "confirmation", "description": "observation", "severity": "low"}}
  ]
}}

bias_type must be one of: sunk_cost, emotional, confirmation, recency
severity must be one of: low, medium, high
If no biases found, return {{"biases": []}}"""


async def analyze_biases(
    raw_input: str,
    matrix: ScoringMatrix,
) -> list[BiasDetection]:
    """LLM-based bias analysis."""
    lines = []
    for opt in matrix.option_scores:
        lines.append(f"{opt.option}: total={opt.weighted_total}")
        for fname, score in opt.factor_scores.items():
            lines.append(f"  {fname}: {score}/10")
    summary = "\n".join(lines)

    prompt = BIAS_PROMPT.format(raw_input=raw_input, scoring_summary=summary)

    result = await chat_json(
        "You detect cognitive biases. Respond with ONLY valid JSON.",
        prompt,
    )

    biases = []
    for b in result.get("biases", []):
        biases.append(BiasDetection(
            bias_type=b.get("bias_type", "unknown"),
            description=b.get("description", ""),
            severity=b.get("severity", "low"),
        ))

    return biases
