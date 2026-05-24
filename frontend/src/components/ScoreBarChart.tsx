"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OptionScore } from "@/lib/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props {
  optionScores: OptionScore[];
}

export function ScoreBarChart({ optionScores }: Props) {
  const data = optionScores.map((opt) => ({
    name: opt.option,
    score: opt.weighted_total,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#94a3b8", fontSize: 13 }}
          axisLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            background: "#1e1e2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: "#e2e8f0",
          }}
          formatter={(value) => [`${value}`, "Weighted Score"]}
        />
        <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={32}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
