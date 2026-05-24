"use client";

import { useState, useEffect, use } from "react";
import {
  api,
  type AnalyzeResponse,
  type ScoreResponse,
  type Question,
  type Answer,
} from "@/lib/api";
import { DecisionMatrix } from "@/components/DecisionMatrix";
import { RadarChartView } from "@/components/RadarChart";
import { ScoreBarChart } from "@/components/ScoreBarChart";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { ConfidenceMeter } from "@/components/ConfidenceMeter";

type Step = "questions" | "scoring" | "results";

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [step, setStep] = useState<Step>("questions");
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(
    null
  );
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");

  // Load the decision on mount
  useEffect(() => {
    loadDecision();
  }, [id]);

  async function loadDecision() {
    try {
      const decision = await api.getDecision(id);
      if (decision.status === "complete" && decision.matrix) {
        // Already scored
        setAnalyzeResponseFromDecision(decision);
        setScoreResult({
          decision_id: decision.id,
          matrix: decision.matrix,
          recommendation: decision.recommendation!,
          status: decision.status,
        });
        setStep("results");
      } else if (decision.extracted) {
        setAnalyzeResult({
          decision_id: decision.id,
          extracted: decision.extracted,
          questions: decision.questions,
          status: decision.status,
        });
        setStep("questions");
      }
    } catch {
      setError("Decision not found");
    } finally {
      setLoading(false);
    }
  }

  function setAnalyzeResponseFromDecision(decision: { id: string; extracted: AnalyzeResponse["extracted"] | null; questions: Question[]; status: string }) {
    if (decision.extracted) {
      setAnalyzeResult({
        decision_id: decision.id,
        extracted: decision.extracted,
        questions: decision.questions,
        status: decision.status,
      });
    }
  }

  async function handleSubmitAnswers() {
    if (!analyzeResult) return;
    setScoring(true);
    setError("");

    try {
      const answerList: Answer[] = Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([questionId, answer]) => ({
          question_id: questionId,
          answer,
        }));

      await api.submitAnswers(analyzeResult.decision_id, answerList);
      const score = await api.score(analyzeResult.decision_id);
      setScoreResult(score);
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading decision...</p>
        </div>
      </div>
    );
  }

  if (error && !analyzeResult) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <a href="/" className="text-indigo-400 text-sm mt-4 block hover:underline">
            Start a new decision
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      {analyzeResult && (
        <div className="mb-8 fade-in">
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-accent">
              {analyzeResult.extracted.category}
            </span>
            <span className="text-xs text-slate-500">
              {step === "questions"
                ? "Step 1 of 2 — Answer Questions"
                : "Step 2 of 2 — Analysis"}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {analyzeResult.extracted.decision}
          </h1>
        </div>
      )}

      {/* Step 1: Questions */}
      {step === "questions" && analyzeResult && (
        <div className="fade-in space-y-6">
          {/* Options */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Options Being Compared
            </h2>
            <div className="flex flex-wrap gap-2">
              {analyzeResult.extracted.options.map((opt) => (
                <span key={opt} className="badge badge-accent">
                  {opt}
                </span>
              ))}
            </div>
          </div>

          {/* Factors */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Factors Identified
            </h2>
            <div className="grid gap-3">
              {analyzeResult.extracted.factors.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium">{f.name}</span>
                    {f.description && (
                      <span className="text-xs text-slate-500 ml-2">
                        — {f.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 score-bar">
                      <div
                        className="score-bar-fill bg-indigo-500"
                        style={{ width: `${f.weight * 10}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">
                      {f.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Answer These Questions
            </h2>
            <div className="space-y-5">
              {analyzeResult.questions.map((q, i) => (
                <div key={q.id}>
                  <label className="text-sm font-medium mb-2 block">
                    <span className="text-indigo-400 mr-2">{i + 1}.</span>
                    {q.text}
                    {q.factor_hint && (
                      <span className="text-xs text-slate-500 ml-2">
                        ({q.factor_hint})
                      </span>
                    )}
                  </label>
                  {q.options ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                            answers[q.id] === opt
                              ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                              : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20"
                          }`}
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt,
                            }))
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="Your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            className="btn-primary w-full"
            onClick={handleSubmitAnswers}
            disabled={scoring}
          >
            {scoring ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scoring...
              </span>
            ) : (
              "Get Recommendation"
            )}
          </button>
        </div>
      )}

      {/* Step 2: Results */}
      {step === "results" && scoreResult && (
        <div className="fade-in space-y-6">
          {/* Recommendation */}
          <RecommendationPanel
            recommendation={scoreResult.recommendation}
          />

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Factor Comparison
              </h2>
              <RadarChartView
                factors={scoreResult.matrix.factors}
                optionScores={scoreResult.matrix.option_scores}
              />
            </div>
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Weighted Scores
              </h2>
              <ScoreBarChart
                optionScores={scoreResult.matrix.option_scores}
              />
            </div>
          </div>

          {/* Confidence */}
          <ConfidenceMeter
            confidence={scoreResult.recommendation.confidence}
          />

          {/* Decision Matrix */}
          <DecisionMatrix matrix={scoreResult.matrix} />

          {/* Scenario Simulator */}
          <ScenarioSimulator
            decisionId={id}
            factors={scoreResult.matrix.factors}
            originalMatrix={scoreResult.matrix}
          />
        </div>
      )}
    </div>
  );
}
