"use client";

import type { Recommendation as RecommendationType } from "@/lib/api";

interface Props {
  recommendation: RecommendationType;
}

export function RecommendationPanel({ recommendation }: Props) {
  const confPct = Math.round(recommendation.confidence.overall * 100);

  return (
    <div className="glass-card p-8">
      {/* Winner */}
      <div className="text-center mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Recommendation
        </p>
        <h2 className="text-3xl font-bold text-indigo-400 mb-1">
          {recommendation.recommendation}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              confPct >= 70
                ? "bg-emerald-500"
                : confPct >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-sm text-slate-400">
            {confPct}% confidence
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-slate-300 text-sm leading-relaxed mb-6 text-center max-w-lg mx-auto">
        {recommendation.reasoning}
      </p>

      {/* Pros & Cons */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {recommendation.pros.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Pros
            </h3>
            <ul className="space-y-1">
              {recommendation.pros.map((pro, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}
        {recommendation.cons.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
              Cons
            </h3>
            <ul className="space-y-1">
              {recommendation.cons.map((con, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Biases */}
      {recommendation.biases.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Detected Biases
          </h3>
          <div className="space-y-2">
            {recommendation.biases.map((bias, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={`badge text-xs ${
                    bias.severity === "high"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : bias.severity === "medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                  }`}
                >
                  {bias.bias_type}
                </span>
                <span className="text-sm text-slate-400">{bias.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
