/**
 * API client for Decision Assistant backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Factor {
  name: string;
  weight: number;
  description: string;
}

export interface ExtractedStructure {
  decision: string;
  options: string[];
  factors: Factor[];
  missing_information: string[];
  category: string;
}

export interface Question {
  id: string;
  text: string;
  factor_hint: string;
  options: string[] | null;
}

export interface Answer {
  question_id: string;
  answer: string;
}

export interface OptionScore {
  option: string;
  factor_scores: Record<string, number>;
  weighted_total: number;
}

export interface Ranking {
  option: string;
  score: number;
  rank: number;
}

export interface ScoringMatrix {
  factors: Factor[];
  option_scores: OptionScore[];
  rankings: Ranking[];
}

export interface ConfidenceBreakdown {
  data_completeness: number;
  question_completion: number;
  option_similarity: number;
  overall: number;
}

export interface BiasDetection {
  bias_type: string;
  description: string;
  severity: string;
}

export interface Recommendation {
  recommendation: string;
  confidence: ConfidenceBreakdown;
  pros: string[];
  cons: string[];
  reasoning: string;
  biases: BiasDetection[];
}

export interface AnalyzeResponse {
  decision_id: string;
  extracted: ExtractedStructure;
  questions: Question[];
  status: string;
}

export interface ScoreResponse {
  decision_id: string;
  matrix: ScoringMatrix;
  recommendation: Recommendation;
  status: string;
}

export interface ScenarioResult {
  scenario_name: string;
  modified_weights: Record<string, number>;
  matrix: ScoringMatrix;
  recommendation: string;
  confidence: number;
}

export interface SimulateResponse {
  decision_id: string;
  scenario: ScenarioResult;
}

export interface Decision {
  id: string;
  status: string;
  raw_input: string;
  extracted: ExtractedStructure | null;
  questions: Question[];
  answers: Answer[];
  matrix: ScoringMatrix | null;
  recommendation: Recommendation | null;
  scenarios: ScenarioResult[];
  created_at: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  analyze: (input: string) =>
    apiFetch<AnalyzeResponse>("/decision/analyze", {
      method: "POST",
      body: JSON.stringify({ input }),
    }),

  submitAnswers: (decisionId: string, answers: Answer[]) =>
    apiFetch<{ decision_id: string; status: string }>(
      `/decision/${decisionId}/answers`,
      {
        method: "POST",
        body: JSON.stringify(answers),
      }
    ),

  score: (decisionId: string) =>
    apiFetch<ScoreResponse>(`/decision/${decisionId}/score`, {
      method: "POST",
    }),

  simulate: (decisionId: string, modifiedWeights: Record<string, number>, scenarioName: string) =>
    apiFetch<SimulateResponse>(`/decision/${decisionId}/simulate`, {
      method: "POST",
      body: JSON.stringify({
        modified_weights: modifiedWeights,
        scenario_name: scenarioName,
      }),
    }),

  history: () => apiFetch<{ decisions: Decision[] }>("/decision/history"),

  getDecision: (decisionId: string) =>
    apiFetch<Decision>(`/decision/${decisionId}`),
};
