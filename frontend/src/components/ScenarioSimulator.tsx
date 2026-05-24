"use client";

import { useState } from "react";
import { api, type Factor, type ScoringMatrix, type ScenarioResult } from "@/lib/api";
import { ScoreBarChart } from "./ScoreBarChart";

interface Props {
  decisionId: string;
  factors: Factor[];
  originalMatrix: ScoringMatrix;
}

const QUICK_SCENARIOS = [
  { name: "Budget doesn't matter", factor: "Budget", weight: 1 },
  { name: "Camera is everything", factor: "Camera", weight: 10 },
  { name: "Battery is king", factor: "Battery", weight: 10 },
];

export function ScenarioSimulator({ decisionId, factors, originalMatrix }: Props) {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    factors.forEach((f) => (w[f.name] = f.weight));
    return w;
  });
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarioName, setScenarioName] = useState("Custom Scenario");

  const hasChanges = factors.some((f) => weights[f.name] !== f.weight);

  async function handleSimulate() {
    setLoading(true);
    try {
      const modified: Record<string, number> = {};
      factors.forEach((f) => {
        if (weights[f.name] !== f.weight) {
          modified[f.name] = weights[f.name];
        }
      });
      const result = await api.simulate(decisionId, modified, scenarioName);
      setScenario(result.scenario);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function applyQuickScenario(qs: { name: string; factor: string; weight: number }) {
    setScenarioName(qs.name);
    setWeights((prev) => ({ ...prev, [qs.factor]: qs.weight }));
  }

  function resetWeights() {
    const w: Record<string, number> = {};
    factors.forEach((f) => (w[f.name] = f.weight));
    setWeights(w);
    setScenario(null);
    setScenarioName("Custom Scenario");
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Scenario Simulator
        </h2>
        <button
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          onClick={resetWeights}
        >
          Reset
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Adjust weights to see how the recommendation changes.
      </p>

      {/* Quick scenarios */}
      <div className="flex flex-wrap gap-2 mb-5">
        {QUICK_SCENARIOS.filter((qs) =>
          factors.some((f) => f.name === qs.factor)
        ).map((qs) => (
          <button
            key={qs.name}
            className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-indigo-500/30 hover:text-indigo-300 transition-all"
            onClick={() => applyQuickScenario(qs)}
          >
            {qs.name}
          </button>
        ))}
      </div>

      {/* Weight sliders */}
      <div className="space-y-4 mb-6">
        {factors.map((f) => (
          <div key={f.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{f.name}</span>
              <span className="text-sm text-indigo-400 font-mono">
                {weights[f.name]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={weights[f.name]}
              onChange={(e) =>
                setWeights((prev) => ({
                  ...prev,
                  [f.name]: parseInt(e.target.value),
                }))
              }
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.05] accent-indigo-500 cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Simulate button */}
      <button
        className="btn-primary w-full mb-6"
        onClick={handleSimulate}
        disabled={loading || !hasChanges}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Simulating...
          </span>
        ) : (
          `Simulate${hasChanges ? "" : " (change a weight first)"}`
        )}
      </button>

      {/* Scenario result */}
      {scenario && (
        <div className="border-t border-white/[0.06] pt-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {scenario.scenario_name}
            </h3>
            <span className="badge badge-accent">
              {scenario.recommendation}
            </span>
          </div>
          <ScoreBarChart optionScores={scenario.matrix.option_scores} />
        </div>
      )}
    </div>
  );
}
