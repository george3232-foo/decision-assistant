"use client";

import type { ConfidenceBreakdown } from "@/lib/api";

interface Props {
  confidence: ConfidenceBreakdown;
}

export function ConfidenceMeter({ confidence }: Props) {
  const metrics = [
    { label: "Data Completeness", value: confidence.data_completeness },
    { label: "Question Completion", value: confidence.question_completion },
    { label: "Option Differentiation", value: confidence.option_similarity },
  ];

  function getColor(val: number) {
    if (val >= 0.7) return "bg-emerald-500";
    if (val >= 0.5) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Confidence Breakdown
      </h2>
      <div className="grid md:grid-cols-4 gap-4">
        {/* Overall */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray={`${confidence.overall * 100}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {Math.round(confidence.overall * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-500">Overall</p>
        </div>

        {/* Individual metrics */}
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{m.label}</span>
              <span className="text-xs font-medium">
                {Math.round(m.value * 100)}%
              </span>
            </div>
            <div className="score-bar">
              <div
                className={`score-bar-fill ${getColor(m.value)}`}
                style={{ width: `${m.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
