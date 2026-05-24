"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Factor, OptionScore } from "@/lib/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  factors: Factor[];
  optionScores: OptionScore[];
}

export function RadarChartView({ factors, optionScores }: Props) {
  // Transform data for Recharts
  const data = factors.map((f) => {
    const entry: Record<string, string | number> = {
      factor: f.name,
      weight: f.weight,
    };
    optionScores.forEach((opt) => {
      entry[opt.option] = opt.factor_scores[f.name] || 0;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="factor"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 10]}
          tick={{ fill: "#64748b", fontSize: 10 }}
        />
        {optionScores.map((opt, i) => (
          <Radar
            key={opt.option}
            name={opt.option}
            dataKey={opt.option}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          contentStyle={{
            background: "#1e1e2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: "#e2e8f0",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
