"use client";

import type { ScoringMatrix } from "@/lib/api";

interface Props {
  matrix: ScoringMatrix;
}

export function DecisionMatrix({ matrix }: Props) {
  const maxScore = Math.max(
    ...matrix.option_scores.flatMap((o) => Object.values(o.factor_scores)),
    1
  );

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Decision Matrix
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-3 text-slate-400 font-medium">
                Factor
              </th>
              <th className="text-center py-3 px-3 text-slate-400 font-medium">
                Weight
              </th>
              {matrix.option_scores.map((opt) => (
                <th
                  key={opt.option}
                  className="text-center py-3 px-3 text-slate-400 font-medium"
                >
                  {opt.option}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.factors.map((f) => (
              <tr
                key={f.name}
                className="border-b border-white/[0.03] hover:bg-white/[0.02]"
              >
                <td className="py-3 px-3 font-medium">{f.name}</td>
                <td className="py-3 px-3 text-center">
                  <span className="badge badge-accent">{f.weight}</span>
                </td>
                {matrix.option_scores.map((opt) => {
                  const score = opt.factor_scores[f.name] || 0;
                  const pct = (score / maxScore) * 100;
                  return (
                    <td key={opt.option} className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">{score}</span>
                        <div className="w-12 score-bar">
                          <div
                            className="score-bar-fill bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t border-white/[0.1] bg-white/[0.02]">
              <td className="py-3 px-3 font-bold">Weighted Total</td>
              <td className="py-3 px-3" />
              {matrix.option_scores.map((opt) => (
                <td
                  key={opt.option}
                  className="py-3 px-3 text-center font-bold text-lg"
                >
                  {opt.weighted_total}
                </td>
              ))}
            </tr>
            {/* Rank row */}
            <tr>
              <td className="py-3 px-3 font-medium text-slate-400">Rank</td>
              <td className="py-3 px-3" />
              {matrix.rankings.map((r) => (
                <td key={r.option} className="py-3 px-3 text-center">
                  <span
                    className={`text-2xl ${
                      r.rank === 1 ? "text-indigo-400" : "text-slate-500"
                    }`}
                  >
                    #{r.rank}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
