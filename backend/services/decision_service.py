"""Decision service — orchestrates the full decision flow."""
from __future__ import annotations

from models.schemas import (
    Decision,
    DecisionInput,
    DecisionStatus,
    ExtractedStructure,
    Question,
    Answer,
    ScoringMatrix,
    OptionScore,
    Factor,
    Recommendation,
    ScenarioResult,
)
from llm.extraction import extract_structure
from llm.questions import generate_questions
from llm.reasoning import generate_reasoning, analyze_biases, generate_scores
from scoring.engine import (
    build_scoring_matrix,
    calculate_confidence,
    detect_biases as detect_biases_rule,
    generate_pros_cons,
    simulate_scenario,
)

# In-memory store (replace with DB in Phase 2)
_decisions: dict[str, Decision] = {}


async def analyze_decision(input_data: DecisionInput) -> Decision:
    """Step 1: Extract structure from natural language input."""
    extracted = await extract_structure(input_data.input)
    questions = await generate_questions(extracted)

    decision = Decision(
        raw_input=input_data.input,
        extracted=extracted,
        questions=questions,
        status=DecisionStatus.QUESTIONS,
    )
    _decisions[decision.id] = decision
    return decision


async def submit_answers(decision_id: str, answers: list[Answer]) -> Decision:
    """Step 2: Submit answers and move to scoring."""
    decision = _decisions.get(decision_id)
    if not decision:
        raise ValueError(f"Decision {decision_id} not found")

    decision.answers = answers
    decision.status = DecisionStatus.SCORING
    return decision


async def score_decision(decision_id: str) -> Decision:
    """Step 3: Build scoring matrix, generate recommendation."""
    decision = _decisions.get(decision_id)
    if not decision or not decision.extracted:
        raise ValueError(f"Decision {decision_id} not found or not analyzed")

    extracted = decision.extracted

    # LLM generates raw scores
    raw_scores = await generate_scores(extracted, decision.answers, decision.raw_input)

    # Build deterministic scoring matrix
    option_scores = []
    for option in extracted.options:
        factor_scores = raw_scores.get(option, {})
        option_scores.append(OptionScore(
            option=option,
            factor_scores=factor_scores,
        ))

    matrix = build_scoring_matrix(extracted.factors, option_scores)

    # Confidence (deterministic)
    confidence = calculate_confidence(extracted, decision.answers, matrix)

    # Bias detection (rule-based + LLM)
    rule_biases = detect_biases_rule(decision.raw_input, matrix)
    llm_biases = await analyze_biases(decision.raw_input, matrix)
    all_biases = rule_biases + llm_biases

    # Pros/cons (deterministic)
    pros, cons = generate_pros_cons(matrix, extracted.factors)

    # Reasoning (LLM)
    reasoning = await generate_reasoning(extracted, matrix)

    # Build recommendation
    recommendation = Recommendation(
        recommendation=matrix.rankings[0]["option"] if matrix.rankings else "Unknown",
        confidence=confidence,
        pros=pros,
        cons=cons,
        reasoning=reasoning,
        biases=all_biases,
    )

    decision.matrix = matrix
    decision.recommendation = recommendation
    decision.status = DecisionStatus.COMPLETE
    return decision


async def simulate(decision_id: str, modified_weights: dict[str, int], scenario_name: str) -> ScenarioResult:
    """Simulate a scenario with modified weights."""
    decision = _decisions.get(decision_id)
    if not decision or not decision.matrix:
        raise ValueError(f"Decision {decision_id} not found or not scored")

    new_matrix = simulate_scenario(decision.matrix, modified_weights)

    result = ScenarioResult(
        scenario_name=scenario_name,
        modified_weights=modified_weights,
        matrix=new_matrix,
        recommendation=new_matrix.rankings[0]["option"] if new_matrix.rankings else "Unknown",
        confidence=new_matrix.rankings[0]["score"] if new_matrix.rankings else 0,
    )

    decision.scenarios.append(result)
    return result


def get_history() -> list[Decision]:
    """Get all decisions."""
    return list(_decisions.values())


def get_decision(decision_id: str) -> Decision | None:
    """Get a specific decision."""
    return _decisions.get(decision_id)
