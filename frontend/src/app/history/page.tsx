"use client";

import { useState, useEffect } from "react";
import { api, type Decision } from "@/lib/api";

export default function HistoryPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .history()
      .then((r) => setDecisions(r.decisions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Decision History</h1>

      {decisions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-500 mb-4">No decisions yet</p>
          <a href="/" className="btn-primary inline-block">
            Make your first decision
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => (
            <a
              key={d.id}
              href={`/analysis/${d.id}`}
              className="glass-card p-5 block hover:border-indigo-500/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">
                    {d.extracted?.decision || "Untitled Decision"}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {d.raw_input}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {d.recommendation && (
                    <span className="badge badge-accent">
                      {d.recommendation.recommendation}
                    </span>
                  )}
                  {d.recommendation?.confidence && (
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.round(d.recommendation.confidence.overall * 100)}%
                      confidence
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                <span className="badge badge-accent">
                  {d.extracted?.category || "general"}
                </span>
                <span>
                  {new Date(d.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
