"""FastAPI routes for Decision Assistant."""
from __future__ import annotations

import traceback
from fastapi import APIRouter, HTTPException

from models.schemas import (
    DecisionInput,
    Answer,
    ScenarioRequest,
    AnalyzeResponse,
    ScoreResponse,
    SimulateResponse,
    HistoryResponse,
    DecisionStatus,
)
from services.decision_service import (
    analyze_decision,
    submit_answers,
    score_decision,
    simulate,
    get_history,
    get_decision,
)

router = APIRouter(prefix="/decision", tags=["decisions"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(input_data: DecisionInput):
    """Analyze a decision: extract structure + generate questions."""
    try:
        decision = await analyze_decision(input_data)
        return AnalyzeResponse(
            decision_id=decision.id,
            extracted=decision.extracted,
            questions=decision.questions,
            status=decision.status,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@router.post("/{decision_id}/answers")
async def answer_questions(decision_id: str, answers: list[Answer]):
    """Submit answers to adaptive questions."""
    try:
        decision = await submit_answers(decision_id, answers)
        return {"decision_id": decision.id, "status": decision.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{decision_id}/score", response_model=ScoreResponse)
async def score(decision_id: str):
    """Score the decision: build matrix + recommendation."""
    try:
        decision = await score_decision(decision_id)
        return ScoreResponse(
            decision_id=decision.id,
            matrix=decision.matrix,
            recommendation=decision.recommendation,
            status=decision.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{decision_id}/simulate", response_model=SimulateResponse)
async def simulate_scenario(decision_id: str, request: ScenarioRequest):
    """Simulate a scenario with modified weights."""
    try:
        result = await simulate(
            decision_id,
            request.modified_weights,
            request.scenario_name,
        )
        return SimulateResponse(decision_id=decision_id, scenario=result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history", response_model=HistoryResponse)
async def history():
    """Get decision history."""
    decisions = get_history()
    return HistoryResponse(decisions=decisions)


@router.get("/{decision_id}")
async def get_single(decision_id: str):
    """Get a single decision by ID."""
    decision = get_decision(decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision
