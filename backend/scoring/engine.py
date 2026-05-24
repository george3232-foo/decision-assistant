"""
Deterministic Scoring Engine.

This is the sacred core. The LLM NEVER touches this.
All calculations are deterministic, explainable, and reproducible.
"""
from __future__ import annotations

import math
from models.schemas import (
    Factor,
    OptionScore,
    ScoringMatrix,
    ConfidenceBreakdown,
    Recommendation,
    BiasDetection,
    ExtractedStructure,
    Answer,
)


def calculate_weighted_score(option: OptionScore, factors: list[Factor]) -> float:
    """Calculate weighted total for an option.

    weighted_score = sum(factor_weight * option_score for each factor)
    """
    total = 0.0
    for factor in factors:
        raw_score = option.factor_scores.get(factor.name, 0)
        total += factor.weight * raw_score
    return round(total, 2)


def build_scoring_matrix(
    factors: list[Factor],
    option_scores: list[OptionScore],
) -> ScoringMatrix:
    """Build complete scoring matrix with weighted totals and rankings."""
    # Calculate weighted totals
    for opt in option_scores:
        opt.weighted_total = calculate_weighted_score(opt, factors)

    # Sort by weighted total descending
    sorted_options = sorted(option_scores, key=lambda o: o.weighted_total, reverse=True)

    # Build rankings
    rankings = []
    for rank, opt in enumerate(sorted_options, 1):
        rankings.append({
            "option": opt.option,
            "score": opt.weighted_total,
            "rank": rank,
        })

    return ScoringMatrix(
        factors=factors,
        option_scores=sorted_options,
        rankings=rankings,
    )


def calculate_confidence(
    extracted: ExtractedStructure,
    answers: list[Answer],
    matrix: ScoringMatrix,
) -> ConfidenceBreakdown:
    """Calculate confidence score.

    confidence = (data_completeness * 0.4) + (question_completion * 0.3) + (option_similarity * 0.3)
    """
    # Data completeness: how many factors have non-zero scores
    total_factors = len(matrix.factors)
    scored_factors = sum(
        1 for f in matrix.factors
        if any(
            opt.factor_scores.get(f.name, 0) > 0
            for opt in matrix.option_scores
        )
    )
    data_completeness = scored_factors / total_factors if total_factors > 0 else 0

    # Question completion: how many questions were answered vs asked
    total_questions = len(extracted.missing_information) or 1
    answered = len(answers)
    question_completion = min(answered / total_questions, 1.0)

    # Option similarity: how close are the top 2 options (closer = lower confidence)
    if len(matrix.option_scores) >= 2:
        top_score = matrix.option_scores[0].weighted_total
        second_score = matrix.option_scores[1].weighted_total
        if top_score > 0:
            similarity = second_score / top_score
        else:
            similarity = 1.0
        # High similarity = low confidence (options are too close)
        option_similarity = 1.0 - (similarity * 0.5)
    else:
        option_similarity = 0.5

    overall = round(
        (data_completeness * 0.4) + (question_completion * 0.3) + (option_similarity * 0.3),
        2,
    )

    return ConfidenceBreakdown(
        data_completeness=round(data_completeness, 2),
        question_completion=round(question_completion, 2),
        option_similarity=round(option_similarity, 2),
        overall=min(overall, 1.0),
    )


def detect_biases(
    raw_input: str,
    matrix: ScoringMatrix,
) -> list[BiasDetection]:
    """Detect potential biases using deterministic heuristics.

    This is a rule-based bias detector. The LLM provides deeper analysis,
    but these checks are always applied as a baseline.
    """
    biases: list[BiasDetection] = []

    # Check for extreme weight concentration
    if matrix.factors:
        max_weight = max(f.weight for f in matrix.factors)
        total_weight = sum(f.weight for f in matrix.factors)
        if total_weight > 0 and max_weight / total_weight > 0.5:
            biases.append(BiasDetection(
                bias_type="confirmation",
                description="One factor dominates your weighting. You may be confirming a pre-existing preference.",
                severity="medium",
            ))

    # Check for extreme score differences (potential emotional bias)
    for opt in matrix.option_scores:
        scores = list(opt.factor_scores.values())
        if len(scores) >= 2:
            if max(scores) - min(scores) >= 8:
                biases.append(BiasDetection(
                    bias_type="emotional",
                    description=f"'{opt.option}' has extreme score variance. Some scores may be emotionally driven.",
                    severity="low",
                ))

    # Check for very close scores (indecisiveness)
    if len(matrix.option_scores) >= 2:
        top = matrix.option_scores[0].weighted_total
        second = matrix.option_scores[1].weighted_total
        if top > 0 and abs(top - second) / top < 0.05:
            biases.append(BiasDetection(
                bias_type="recency",
                description="Options are nearly tied. Your scores may be influenced by recent information.",
                severity="low",
            ))

    return biases


def generate_pros_cons(
    matrix: ScoringMatrix,
    factors: list[Factor],
) -> tuple[list[str], list[str]]:
    """Generate pros and cons based on scoring data."""
    if not matrix.option_scores:
        return [], []

    winner = matrix.option_scores[0]
    loser = matrix.option_scores[-1] if len(matrix.option_scores) > 1 else None

    pros = []
    cons = []

    # Top scoring factors for winner
    sorted_factors = sorted(
        factors,
        key=lambda f: winner.factor_scores.get(f.name, 0) * f.weight,
        reverse=True,
    )

    for f in sorted_factors[:3]:
        score = winner.factor_scores.get(f.name, 0)
        if score >= 7:
            pros.append(f"Strong {f.name.lower()} (scored {score}/10, weight {f.weight})")
        elif score <= 4:
            cons.append(f"Weak {f.name.lower()} (scored {score}/10)")

    return pros, cons


def simulate_scenario(
    matrix: ScoringMatrix,
    modified_weights: dict[str, int],
) -> ScoringMatrix:
    """Recalculate the matrix with modified weights.

    This is purely deterministic — instant recalculation.
    """
    new_factors = []
    for f in matrix.factors:
        new_weight = modified_weights.get(f.name, f.weight)
        new_factors.append(Factor(
            name=f.name,
            weight=new_weight,
            description=f.description,
        ))

    # Rebuild with new weights (keep same scores)
    new_option_scores = []
    for opt in matrix.option_scores:
        new_option_scores.append(OptionScore(
            option=opt.option,
            factor_scores=opt.factor_scores,
        ))

    return build_scoring_matrix(new_factors, new_option_scores)
