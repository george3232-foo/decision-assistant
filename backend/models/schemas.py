"""Pydantic models for Decision Assistant."""
from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from datetime import datetime


# --- Enums ---

class DecisionStatus(str, Enum):
    INPUT = "input"
    QUESTIONS = "questions"
    SCORING = "scoring"
    COMPLETE = "complete"


# --- Input ---

class DecisionInput(BaseModel):
    """Raw user input."""
    input: str = Field(..., min_length=1, description="Natural language decision")


# --- Extraction ---

class Factor(BaseModel):
    """A decision factor with weight (1-10)."""
    name: str
    weight: int = Field(ge=1, le=10)
    description: str = ""


class ExtractedStructure(BaseModel):
    """LLM-extracted decision structure."""
    decision: str
    options: list[str] = Field(min_length=2)
    factors: list[Factor]
    missing_information: list[str] = []
    category: str = "general"


# --- Questions ---

class Question(BaseModel):
    """An adaptive question."""
    id: str = Field(default_factory=lambda: str(uuid4())[:8])
    text: str
    factor_hint: str = ""
    options: list[str] | None = None  # Multiple choice options, None = free text


class Answer(BaseModel):
    """User's answer to a question."""
    question_id: str
    answer: str


# --- Scoring ---

class OptionScore(BaseModel):
    """Score for one option across all factors."""
    option: str
    factor_scores: dict[str, int] = Field(default_factory=dict)  # factor_name -> score (1-10)
    weighted_total: float = 0.0


class ScoringMatrix(BaseModel):
    """Complete scoring matrix."""
    factors: list[Factor]
    option_scores: list[OptionScore]
    rankings: list[dict[str, Any]] = []  # [{option, score, rank}]


# --- Confidence ---

class ConfidenceBreakdown(BaseModel):
    """Confidence score components."""
    data_completeness: float = Field(ge=0, le=1)
    question_completion: float = Field(ge=0, le=1)
    option_similarity: float = Field(ge=0, le=1)
    overall: float = Field(ge=0, le=1)


# --- Bias ---

class BiasDetection(BaseModel):
    """Detected bias in the decision."""
    bias_type: str  # sunk_cost, emotional, confirmation, recency
    description: str
    severity: str = "low"  # low, medium, high


# --- Recommendation ---

class Recommendation(BaseModel):
    """Final recommendation."""
    recommendation: str
    confidence: ConfidenceBreakdown
    pros: list[str]
    cons: list[str]
    reasoning: str
    biases: list[BiasDetection] = []


# --- Scenario ---

class ScenarioRequest(BaseModel):
    """Request to simulate a scenario."""
    modified_weights: dict[str, int] = Field(
        default_factory=dict,
        description="factor_name -> new_weight (1-10)"
    )
    scenario_name: str = "Custom Scenario"


class ScenarioResult(BaseModel):
    """Result of a scenario simulation."""
    scenario_name: str
    modified_weights: dict[str, int]
    matrix: ScoringMatrix
    recommendation: str
    confidence: float


# --- Full Decision State ---

class Decision(BaseModel):
    """Complete decision state."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: DecisionStatus = DecisionStatus.INPUT
    raw_input: str = ""
    extracted: ExtractedStructure | None = None
    questions: list[Question] = []
    answers: list[Answer] = []
    matrix: ScoringMatrix | None = None
    recommendation: Recommendation | None = None
    scenarios: list[ScenarioResult] = []
    created_at: datetime = Field(default_factory=datetime.now)


# --- API Responses ---

class AnalyzeResponse(BaseModel):
    """Response from /decision/analyze."""
    decision_id: str
    extracted: ExtractedStructure
    questions: list[Question]
    status: DecisionStatus


class ScoreResponse(BaseModel):
    """Response from /decision/score."""
    decision_id: str
    matrix: ScoringMatrix
    recommendation: Recommendation
    status: DecisionStatus


class SimulateResponse(BaseModel):
    """Response from /decision/simulate."""
    decision_id: str
    scenario: ScenarioResult


class HistoryResponse(BaseModel):
    """Response from /decision/history."""
    decisions: list[Decision]
